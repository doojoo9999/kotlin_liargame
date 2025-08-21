# MIGRATION.md - 개발 가이드

팀이 동일 패턴을 확장 적용할 수 있도록 하는 개발 가이드입니다.

## React Query 패턴

### Query Key 규칙

Query Key는 계층적 구조로 관리하며, `queryKeys.js`에 중앙화합니다:

```javascript
// src/api/queryKeys.js
export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  rooms: {
    all: ['rooms'],
    list: (filters = {}) => ['rooms', 'list', filters],
    detail: (gameNumber) => ['rooms', 'detail', gameNumber],
  },
  subjects: {
    all: ['subjects'],
    list: (category) => ['subjects', 'list', category],
    detail: (id) => ['subjects', 'detail', id],
  },
  game: {
    state: (gameNumber) => ['game', 'state', gameNumber],
  },
}
```

**규칙:**
- 첫 번째 요소는 리소스 타입 (예: 'auth', 'rooms')
- 두 번째 요소는 작업 타입 (예: 'list', 'detail', 'me')
- 파라미터가 있는 경우 함수로 구현
- 필터나 옵션은 마지막 요소로 배치

### useQuery/useMutation 템플릿

```javascript
// Query 예시
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys'
import * as gameApi from '../api/gameApi'

function useRooms(filters = {}) {
  return useQuery({
    queryKey: queryKeys.rooms.list(filters),
    queryFn: () => gameApi.getAllRooms(filters),
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  })
}

// Mutation 예시
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useCreateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: gameApi.createRoom,
    onSuccess: () => {
      // 방 목록 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.all
      })
    }
  })
}
```

### Invalidate 패턴

```javascript
// 특정 쿼리 무효화
queryClient.invalidateQueries({
  queryKey: queryKeys.rooms.detail(gameNumber)
})

// 계층적 무효화 (모든 rooms 관련 쿼리)
queryClient.invalidateQueries({
  queryKey: queryKeys.rooms.all
})

// 조건부 무효화
queryClient.invalidateQueries({
  predicate: (query) => 
    query.queryKey[0] === 'rooms' && 
    query.queryKey[1] === 'list'
})
```

## Axios 패턴

### apiClient 사용 규칙

모든 API 호출은 중앙화된 `apiClient.js`를 사용합니다:

```javascript
// src/api/apiClient.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021') + '/api/v1',
  timeout: 10000,
  withCredentials: true, // 세션 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((request) => {
  try {
    const rawToken = localStorage.getItem('authToken')
    let token = rawToken
    if (!token) {
      const userDataRaw = localStorage.getItem('userData')
      if (userDataRaw) {
        const parsed = JSON.parse(userDataRaw)
        if (parsed && parsed.token) token = parsed.token
      }
    }
    if (token && !request.headers?.Authorization) {
      request.headers = request.headers || {}
      request.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // no-op: 요청 흐름을 중단하지 않음
  }
  return request
})

// Response interceptor: 401 에러 중앙화 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userData')
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)
```

### API 함수 작성 패턴

```javascript
// src/api/gameApi.js
import apiClient from './apiClient'

export async function getAllRooms(filters = {}) {
  const response = await apiClient.get('/rooms', { params: filters })
  return response.data
}

export async function createRoom(roomData) {
  const response = await apiClient.post('/rooms', roomData)
  return response.data
}

export async function joinRoom(gameNumber) {
  const response = await apiClient.post(`/rooms/${gameNumber}/join`)
  return response.data
}
```

### 에러 처리 패턴 (normalizedMessage)

```javascript
// src/utils/authErrorMapping.js
export function mapHttpErrorToAuthCode(error) {
  if (!error.response) return 'NETWORK_ERROR'
  
  const status = error.response.status
  const serverMessage = error.response.data?.message
  
  switch (status) {
    case 400:
      if (serverMessage?.includes('이미 사용중')) return 'NICKNAME_TAKEN'
      if (serverMessage?.includes('유효하지 않은')) return 'INVALID_INPUT'
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 500:
      return 'SERVER_ERROR'
    default:
      return 'UNKNOWN_ERROR'
  }
}

// 사용 예시
try {
  await apiClient.post('/auth/login', { nickname })
} catch (error) {
  const errorCode = mapHttpErrorToAuthCode(error)
  const normalizedMessage = getNormalizedMessage(errorCode)
  setErrorMessage(normalizedMessage)
}
```

**규칙:**
- 모든 API 호출은 `apiClient` 사용
- 에러는 `mapHttpErrorToAuthCode`로 정규화
- 민감한 서버 메시지는 클라이언트에서 필터링
- 401 에러는 인터셉터에서 자동 로그아웃 처리

## WebSocket 패턴

### 연결 가드 및 상태 관리

```javascript
// src/socket/gameStompClient.js
class GameStompClient {
  constructor() {
    this.client = null
    this.isConnected = false
    this.subscriptions = new Map()      // topic -> Subscription (세션 종속)
    this.topicHandlers = new Map()      // topic -> handler (논리적 구독)
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isConnecting = false
    this.connectionPromise = null
  }

  async connect(serverUrl, options = {}) {
    // 이미 연결된 경우 즉시 반환
    if (this.isConnected && this.client && this.client.connected) {
      return Promise.resolve(this.client)
    }

    // 이미 연결 중인 경우 기존 Promise 반환
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise
    }

    this.isConnecting = true
    this.connectionPromise = new Promise((resolve, reject) => {
      // 기존 클라이언트 정리
      if (this.client) {
        this.client.deactivate()
        this.client = null
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(`${serverUrl}/ws`, null, {
          withCredentials: true // 세션 쿠키 포함
        }),
        connectHeaders: { ...options.headers },
        debug: (str) => console.log('[DEBUG_LOG] STOMP:', str),
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      this.client.onConnect = (frame) => {
        this.isConnected = true
        this.isConnecting = false
        this.connectionPromise = null
        this.reconnectAttempts = 0
        
        // 구독 복원
        this.restoreSubscriptions()
        resolve(this.client)
      }

      this.client.onStompError = (frame) => {
        this.handleError(frame, reject)
      }

      this.client.activate()
    })

    return this.connectionPromise
  }
}
```

### 구독 관리 (Idempotent)

```javascript
// 멱등성 보장하는 구독
subscribe(topic, handler) {
  // 논리적 구독 저장 (재연결 시 복원용)
  this.topicHandlers.set(topic, handler)
  
  // 이미 구독 중이면 핸들러만 업데이트
  if (this.subscriptions.has(topic)) {
    console.log(`[DEBUG_LOG] Updating handler for existing subscription: ${topic}`)
    return this.subscriptions.get(topic)
  }

  if (!this.isConnected || !this.client) {
    console.log(`[DEBUG_LOG] Not connected, storing handler for later: ${topic}`)
    return null
  }

  // 실제 구독 수행
  const subscription = this.client.subscribe(topic, (message) => {
    try {
      const data = JSON.parse(message.body)
      handler(data)
    } catch (error) {
      console.error(`[DEBUG_LOG] Failed to parse message:`, error)
      handler(message.body)
    }
  })

  this.subscriptions.set(topic, subscription)
  return subscription
}

// 구독 해제
unsubscribe(topic) {
  const subscription = this.subscriptions.get(topic)
  if (subscription) {
    subscription.unsubscribe()
    this.subscriptions.delete(topic)
  }
  this.topicHandlers.delete(topic)
}
```

### 언마운트 시 정리 체크리스트

```javascript
// React 컴포넌트에서 WebSocket 사용
useEffect(() => {
  const stompClient = new GameStompClient()
  
  // 연결 및 구독
  const setupWebSocket = async () => {
    try {
      await stompClient.connect(serverUrl)
      stompClient.subscribe('/topic/game-updates', handleGameUpdate)
      stompClient.subscribe('/user/queue/notifications', handleNotification)
    } catch (error) {
      console.error('WebSocket setup failed:', error)
    }
  }
  
  setupWebSocket()

  // ✅ 필수: 언마운트 시 정리
  return () => {
    stompClient.unsubscribe('/topic/game-updates')
    stompClient.unsubscribe('/user/queue/notifications')
    stompClient.disconnect()
  }
}, [])

// ✅ 페이지 이탈 시에도 정리
useEffect(() => {
  const handleBeforeUnload = () => {
    if (stompClient) {
      stompClient.disconnect()
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [])
```

### 재연결 로직

```javascript
handleReconnection() {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('[DEBUG_LOG] Max reconnection attempts reached')
    return
  }
  
  this.reconnectAttempts++
  console.log(`[DEBUG_LOG] Reconnection attempt ${this.reconnectAttempts}`)
  
  setTimeout(() => {
    this.connect()
  }, this.reconnectDelay * this.reconnectAttempts)
}

restoreSubscriptions() {
  this.subscriptions.clear()
  this.topicHandlers.forEach((handler, topic) => {
    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body)
        handler(data)
      } catch (error) {
        console.error('[DEBUG_LOG] Failed to parse message:', error)
        handler(message.body)
      }
    })
    this.subscriptions.set(topic, subscription)
  })
}
```

**규칙:**
- 연결 가드로 중복 연결 방지
- 구독은 멱등성 보장
- 언마운트 시 반드시 구독 해제 및 연결 종료
- 재연결 시 구독 자동 복원
- 에러 처리 및 디버깅 로그 포함

## Forms 패턴 (React Hook Form + Zod + MUI)

### 표준 Form 템플릿

```javascript
import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Box } from '@mui/material'

// 1. Zod 스키마 정의
const schema = z.object({
  nickname: z.string()
    .min(1, '닉네임을 입력해주세요.')
    .min(2, '닉네임은 최소 2글자 이상이어야 합니다.')
    .max(12, '닉네임은 최대 12글자까지 가능합니다.')
    .refine((value) => !/[<>"'&]/.test(value), '닉네임에 특수문자는 사용할 수 없습니다.'),
  email: z.string().email('유효한 이메일을 입력해주세요.').optional(),
})

// 2. Form 컴포넌트
function UserForm({ onSubmit, defaultValues = {} }) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur', // 실시간 검증
    defaultValues: {
      nickname: '',
      email: '',
      ...defaultValues,
    },
  })

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {/* Controller로 MUI TextField 연동 */}
      <Controller
        name="nickname"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="닉네임"
            fullWidth
            margin="normal"
            error={!!errors.nickname}
            helperText={errors.nickname?.message}
            disabled={isSubmitting}
          />
        )}
      />
      
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="이메일 (선택사항)"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isSubmitting}
          />
        )}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isSubmitting}
        sx={{ mt: 2 }}
      >
        {isSubmitting ? '처리 중...' : '제출'}
      </Button>
    </Box>
  )
}
```

### 복잡한 Form 예시 (중첩 객체, 배열)

```javascript
const gameRoomSchema = z.object({
  title: z.string().min(1, '방 제목을 입력해주세요.').max(50),
  maxPlayers: z.number().min(2).max(8),
  settings: z.object({
    timeLimit: z.number().min(30).max(300),
    difficulty: z.enum(['easy', 'normal', 'hard']),
  }),
  categories: z.array(z.string()).min(1, '최소 하나의 카테고리를 선택해주세요.'),
})

function GameRoomForm() {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(gameRoomSchema),
    defaultValues: {
      title: '',
      maxPlayers: 4,
      settings: {
        timeLimit: 120,
        difficulty: 'normal',
      },
      categories: [],
    },
  })

  return (
    <Box component="form">
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="방 제목"
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        )}
      />

      <Controller
        name="maxPlayers"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="최대 인원"
            inputProps={{ min: 2, max: 8 }}
            error={!!errors.maxPlayers}
            helperText={errors.maxPlayers?.message}
          />
        )}
      />

      {/* 중첩 객체 */}
      <Controller
        name="settings.timeLimit"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="시간 제한 (초)"
            error={!!errors.settings?.timeLimit}
            helperText={errors.settings?.timeLimit?.message}
          />
        )}
      />
    </Box>
  )
}
```

### 에러 표시 가이드

```javascript
// 1. 필드별 에러 표시
<TextField
  error={!!errors.nickname}
  helperText={errors.nickname?.message}
/>

// 2. 글로벌 에러 표시
{Object.keys(errors).length > 0 && (
  <Alert severity="error" sx={{ mt: 2 }}>
    입력한 정보를 다시 확인해주세요.
  </Alert>
)}

// 3. 중첩 객체 에러 체크
const hasSettingsError = errors.settings?.timeLimit || errors.settings?.difficulty
{hasSettingsError && (
  <Typography color="error" variant="caption">
    게임 설정에 오류가 있습니다.
  </Typography>
)}

// 4. 배열 에러 체크
{errors.categories && (
  <FormHelperText error>
    {errors.categories.message}
  </FormHelperText>
)}
```

### 동적 Form 값 제어

```javascript
function DynamicForm() {
  const { control, watch, setValue } = useForm()
  
  // 특정 필드 값 감시
  const watchMaxPlayers = watch('maxPlayers')
  
  // 조건부 필드 표시
  useEffect(() => {
    if (watchMaxPlayers > 6) {
      setValue('settings.difficulty', 'hard')
    }
  }, [watchMaxPlayers, setValue])

  return (
    <Box>
      {/* 조건부 렌더링 */}
      {watchMaxPlayers > 4 && (
        <Controller
          name="advancedSettings"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="고급 설정" />
          )}
        />
      )}
    </Box>
  )
}
```

**규칙:**
- 모든 Form은 Zod + RHF + MUI Controller 조합 사용
- 스키마는 Form 컴포넌트 외부에서 정의
- `mode: 'onBlur'`로 실시간 검증 활성화
- 에러는 `errors.fieldName?.message`로 표시
- 중첩 객체는 `name="object.field"` 형식 사용
- `isSubmitting` 상태로 중복 제출 방지

## Utilities 패턴

### clsx 사용 규칙

조건부 클래스명 결합에 `clsx`를 사용합니다:

```javascript
import clsx from 'clsx'

// 기본 사용법
const className = clsx('base-class', {
  'active': isActive,
  'disabled': isDisabled,
  'error': hasError,
})

// 복합 조건
const buttonClass = clsx(
  'btn',
  `btn-${variant}`, // 동적 값
  {
    'btn-loading': isLoading,
    'btn-disabled': disabled || isLoading,
  },
  size === 'large' && 'btn-lg',
  customClassName // 외부에서 전달받은 클래스
)

// MUI sx와 함께 사용
<Box
  className={clsx('custom-container', {
    'highlighted': isHighlighted,
  })}
  sx={{ p: 2 }}
>

// 실제 사용 예시
function ChatMessage({ message, isOwn, isSystem, className }) {
  return (
    <div
      className={clsx(
        'chat-message',
        {
          'chat-message--own': isOwn,
          'chat-message--system': isSystem,
          'chat-message--highlighted': message.isHighlighted,
        },
        className
      )}
    >
      {message.content}
    </div>
  )
}
```

### lodash-es 사용 규칙

성능을 위해 필요한 함수만 개별 import합니다:

```javascript
// ✅ 좋은 예: 개별 import
import { debounce, throttle, isEmpty, cloneDeep } from 'lodash-es'

// ❌ 나쁜 예: 전체 import
import _ from 'lodash-es'

// debounce 패턴 (검색, API 호출 지연)
import { debounce } from 'lodash-es'

const useDebouncedCallback = (callback, delay) => {
  const debouncedCallback = useCallback(
    debounce(callback, delay),
    [callback, delay]
  )
  
  useEffect(() => {
    return () => {
      debouncedCallback.cancel()
    }
  }, [debouncedCallback])
  
  return debouncedCallback
}

// 사용 예시
function SearchInput({ onSearch }) {
  const debouncedSearch = useDebouncedCallback((query) => {
    onSearch(query)
  }, 300)
  
  return (
    <TextField
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="검색..."
    />
  )
}

// throttle 패턴 (스크롤, 리사이즈 이벤트)
import { throttle } from 'lodash-es'

useEffect(() => {
  const handleScroll = throttle(() => {
    // 스크롤 처리 로직
  }, 100)
  
  window.addEventListener('scroll', handleScroll)
  return () => {
    window.removeEventListener('scroll', handleScroll)
    handleScroll.cancel()
  }
}, [])

// 객체/배열 유틸리티
import { isEmpty, cloneDeep, isEqual } from 'lodash-es'

// 빈 값 체크
if (isEmpty(searchResults)) {
  return <div>검색 결과가 없습니다.</div>
}

// 깊은 복사
const clonedState = cloneDeep(originalState)

// 깊은 비교 (React.memo에서 유용)
const MemoComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>
}, isEqual)
```

### dayjs 사용 규칙

날짜 처리는 `dayjs`를 사용하며, 플러그인은 필요시에만 로드합니다:

```javascript
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko' // 한국어 로케일

// 플러그인 등록 (앱 초기화 시 한 번만)
dayjs.extend(relativeTime)
dayjs.locale('ko')

// 기본 사용법
const now = dayjs()
const messageTime = dayjs(message.timestamp)
const formatted = messageTime.format('YYYY-MM-DD HH:mm:ss')

// 상대 시간 표시
const timeAgo = messageTime.fromNow() // "3분 전"

// 날짜 비교
const isToday = messageTime.isSame(dayjs(), 'day')
const isAfter = messageTime.isAfter(dayjs().subtract(5, 'minute'))

// 날짜 조작
const fiveMinutesAgo = dayjs().subtract(5, 'minute')
const nextWeek = dayjs().add(1, 'week')
const startOfDay = dayjs().startOf('day')

// 실제 사용 예시 - 메시지 시간 표시
function MessageTimestamp({ timestamp }) {
  const messageTime = dayjs(timestamp)
  const now = dayjs()
  
  // 오늘 메시지는 시간만, 과거 메시지는 날짜+시간
  const display = messageTime.isSame(now, 'day') 
    ? messageTime.format('HH:mm')
    : messageTime.format('MM/DD HH:mm')
  
  return (
    <span 
      className="message-time" 
      title={messageTime.format('YYYY-MM-DD HH:mm:ss')}
    >
      {display}
    </span>
  )
}

// 시스템 메시지 만료 시간 관리
function useSystemMessages() {
  const cleanupExpired = useCallback(() => {
    const now = dayjs()
    const validMessages = messages.filter(msg => {
      return !msg.expiresAt || dayjs(msg.expiresAt).isAfter(now)
    })
    setMessages(validMessages)
  }, [messages])
  
  // 정기적으로 만료된 메시지 정리
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 30000) // 30초마다
    return () => clearInterval(interval)
  }, [cleanupExpired])
}

// 게임 시간 관리
function GameTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState('')
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = dayjs(endTime).diff(dayjs(), 'second')
      if (remaining <= 0) {
        setTimeLeft('종료')
        clearInterval(timer)
      } else {
        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [endTime])
  
  return <span className="game-timer">{timeLeft}</span>
}
```

**규칙:**
- `clsx`: 조건부 클래스명 결합 시 필수 사용
- `lodash-es`: 개별 함수만 import, 사용 후 cleanup 필수
- `dayjs`: 모든 날짜 처리, 플러그인은 필요시에만 로드
- 성능을 위해 무거운 연산은 debounce/throttle 적용

## Routing 패턴 (React Router Data API)

### Data API 적용 사례

React Router v6+ Data API를 활용한 로더 패턴:

```javascript
// src/loaders/lobbyLoader.js
import * as gameApi from '../api/gameApi'

// 단일 데이터 로더
export async function roomsLoader() {
  try {
    const rooms = await gameApi.getAllRooms()
    return { rooms: rooms || [] }
  } catch (error) {
    console.error('Failed to load rooms:', error)
    throw new Response('방 목록을 불러올 수 없습니다.', { 
      status: 500,
      statusText: 'Internal Server Error' 
    })
  }
}

// 복합 데이터 로더 (병렬 처리)
export async function lobbyLoader() {
  try {
    const [roomsResult, subjectsResult] = await Promise.allSettled([
      gameApi.getAllRooms(),
      gameApi.getAllSubjects()
    ])

    const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value || [] : []
    const subjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value || [] : []

    return { 
      rooms,
      subjects,
      errors: {
        rooms: roomsResult.status === 'rejected' ? roomsResult.reason?.message : null,
        subjects: subjectsResult.status === 'rejected' ? subjectsResult.reason?.message : null
      }
    }
  } catch (error) {
    console.error('Failed to load lobby data:', error)
    throw new Response('로비 데이터를 불러올 수 없습니다.', { 
      status: 500,
      statusText: 'Internal Server Error' 
    })
  }
}

// 파라미터 기반 로더
export async function gameRoomLoader({ params }) {
  const { gameNumber } = params
  
  if (!gameNumber) {
    throw new Response('게임 번호가 필요합니다.', { status: 400 })
  }
  
  try {
    const roomData = await gameApi.getRoomDetails(gameNumber)
    return { room: roomData, gameNumber }
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Response('존재하지 않는 게임방입니다.', { status: 404 })
    }
    throw new Response('게임방 정보를 불러올 수 없습니다.', { status: 500 })
  }
}
```

### 라우터 설정 패턴

```javascript
// src/App.jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lobbyLoader, gameRoomLoader } from './loaders'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/lobby',
    element: <LobbyPage />,
    loader: lobbyLoader,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/room/:gameNumber',
    element: <GameRoomPage />,
    loader: gameRoomLoader,
    errorElement: <RouteErrorBoundary />
  },
  {
    // 중첩 라우트 예시
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboard />,
        loader: adminDashboardLoader
      }
    ]
  }
])

function App() {
  return <RouterProvider router={router} />
}
```

### 로더 데이터 사용 패턴

```javascript
import { useLoaderData, useRouteError } from 'react-router-dom'

// 로더 데이터 사용
function LobbyPage() {
  const { rooms, subjects, errors } = useLoaderData()
  
  return (
    <div>
      {errors.rooms && (
        <Alert severity="error">방 목록 로딩 오류: {errors.rooms}</Alert>
      )}
      
      <RoomList rooms={rooms} />
      <SubjectList subjects={subjects} />
    </div>
  )
}

// 에러 처리 컴포넌트
function RouteErrorBoundary() {
  const error = useRouteError()
  
  if (error.status === 404) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h4">404 - 페이지를 찾을 수 없습니다</Typography>
        <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </Box>
    )
  }
  
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h4" color="error">오류가 발생했습니다</Typography>
      <Typography variant="body1">{error.data || '알 수 없는 오류'}</Typography>
      <Button onClick={() => window.location.reload()}>새로고침</Button>
    </Box>
  )
}
```

### 인증 가드 패턴

```javascript
// Protected Route 컴포넌트
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading.auth) {
    return <LoadingSpinner message="인증 확인 중..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// 라우터에서 사용
{
  path: '/lobby',
  element: (
    <ProtectedRoute>
      <LobbyPage />
    </ProtectedRoute>
  ),
  loader: lobbyLoader
}

// 로더에서 인증 체크
export async function protectedLoader() {
  const isAuthenticated = checkAuthStatus()
  if (!isAuthenticated) {
    throw redirect('/login')
  }
  
  return await loadData()
}
```

### 주의점 및 최적화

```javascript
// ⚠️ 주의: 로더에서 React 상태 접근 불가
export async function badLoader() {
  // ❌ 잘못된 예: React 상태에 접근할 수 없음
  // const user = useAuth() // 불가능!
  
  // ✅ 올바른 예: 로컬스토리지나 API 직접 호출
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw redirect('/login')
  }
}

// 로더 캐싱 최적화
const dataCache = new Map()

export async function cachedLoader({ params }) {
  const cacheKey = `room-${params.gameNumber}`
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey)
  }
  
  const data = await gameApi.getRoomDetails(params.gameNumber)
  dataCache.set(cacheKey, data)
  
  // 5분 후 캐시 삭제
  setTimeout(() => dataCache.delete(cacheKey), 5 * 60 * 1000)
  
  return data
}

// 로더와 React Query 조합
export async function hybridLoader() {
  // 초기 데이터는 로더에서 로드
  const initialData = await gameApi.getAllRooms()
  
  return { initialData }
}

function RoomListPage() {
  const { initialData } = useLoaderData()
  
  // React Query로 실시간 업데이트
  const { data: rooms } = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: gameApi.getAllRooms,
    initialData,
    refetchInterval: 30000 // 30초마다 갱신
  })
  
  return <RoomList rooms={rooms} />
}
```

**규칙:**
- 로더는 순수 함수로 작성, React 상태 접근 불가
- 에러는 Response 객체를 throw하여 처리
- Promise.allSettled로 부분 실패 허용
- 인증 체크는 로더에서 수행
- 로더와 React Query 조합으로 초기 데이터 + 실시간 업데이트

## QA Checklist - 수동 테스트 가이드

### 로그인 테스트

**기본 로그인 플로우:**
- [ ] 유효한 닉네임으로 로그인 성공
- [ ] 빈 닉네임 입력 시 에러 표시
- [ ] 2글자 미만 닉네임 에러 표시  
- [ ] 12글자 초과 닉네임 에러 표시
- [ ] 특수문자 포함 닉네임 에러 표시 (`<>"'&`)
- [ ] 이미 사용 중인 닉네임 에러 처리
- [ ] 로그인 중 로딩 상태 표시
- [ ] 로그인 성공 후 환영 메시지 표시

**에러 처리:**
- [ ] 네트워크 오류 시 적절한 에러 메시지
- [ ] 서버 오류 시 로그인 실패 페이지 리다이렉트
- [ ] 에러 페이지에서 자동 카운트다운 동작
- [ ] 재시도 버튼 동작 확인

### 방 관리 테스트

**방 목록:**
- [ ] 로비 페이지 로딩 시 방 목록 표시
- [ ] 빈 방 목록일 때 적절한 메시지 표시
- [ ] 방 정보 (제목, 인원, 상태) 정확히 표시
- [ ] 새로고침 시 방 목록 업데이트
- [ ] 자동 새로고침 (30초 간격) 동작

**방 생성:**
- [ ] 방 생성 다이얼로그 열기/닫기
- [ ] 유효한 방 제목 입력 후 생성 성공
- [ ] 빈 제목으로 생성 시 에러 표시
- [ ] 최대 인원 설정 (2-8명) 유효성 검사
- [ ] 생성 중 로딩 상태 표시
- [ ] 생성 성공 후 해당 방으로 이동

**방 입장:**
- [ ] 대기 중인 방 입장 성공
- [ ] 가득 찬 방 입장 시 에러 메시지
- [ ] 이미 시작된 게임 입장 시 에러 메시지
- [ ] 존재하지 않는 방 접근 시 404 처리

### 게임 플레이 테스트

**게임 방 기본 기능:**
- [ ] 방 입장 시 참가자 목록 표시
- [ ] 방장 권한 (게임 시작) 확인
- [ ] 채팅 기능 동작 (메시지 송수신)
- [ ] 사용자 나가기 기능
- [ ] 방장 위임 기능 (방장이 나갈 때)

**게임 진행:**
- [ ] 게임 시작 시 주제 단어 표시 (라이어 제외)
- [ ] 라이어에게는 "???" 표시
- [ ] 차례대로 발언 시스템 동작
- [ ] 타이머 기능 (발언 제한 시간)
- [ ] 투표 단계 진입
- [ ] 투표 결과 집계 및 표시

**게임 결과:**
- [ ] 라이어 맞추기 성공/실패 처리
- [ ] 최종 결과 화면 표시
- [ ] 게임 통계 정보 표시
- [ ] 새 게임 시작 옵션

### WebSocket 재연결 테스트

**연결 상태 관리:**
- [ ] 초기 WebSocket 연결 성공
- [ ] 연결 상태 표시 (연결됨/연결 중/오류)
- [ ] 연결 실패 시 재연결 시도 (최대 5회)
- [ ] 재연결 성공 시 구독 복원

**네트워크 중단 시나리오:**
- [ ] Wi-Fi 끄기 → 켜기 후 자동 재연결
- [ ] 브라우저 탭 비활성화 → 활성화 후 연결 상태
- [ ] 페이지 새로고침 후 WebSocket 재연결
- [ ] 서버 재시작 후 클라이언트 재연결

**실시간 업데이트:**
- [ ] 다른 사용자 입장/퇴장 실시간 반영
- [ ] 채팅 메시지 실시간 수신
- [ ] 게임 상태 변경 실시간 반영
- [ ] 투표 현황 실시간 업데이트

### Error Boundary 테스트

**컴포넌트 레벨 에러:**
- [ ] React 컴포넌트 렌더링 에러 캐치
- [ ] Error Boundary 폴백 UI 표시
- [ ] 에러 정보 로깅 확인
- [ ] 부분적 에러 (특정 컴포넌트만 영향)

**라우트 레벨 에러:**
- [ ] 존재하지 않는 페이지 404 처리
- [ ] 로더 에러 시 RouteErrorBoundary 동작
- [ ] 권한 없는 페이지 접근 시 403 처리
- [ ] 에러 페이지에서 홈으로 돌아가기

**전역 에러 처리:**
- [ ] API 요청 실패 시 토스트 알림
- [ ] 로그인 만료 시 자동 로그아웃
- [ ] 예상치 못한 에러 시 사용자 친화적 메시지
- [ ] 에러 발생 시 개발자 도구 콘솔 로그

### 성능 및 사용성 테스트

**로딩 성능:**
- [ ] 초기 페이지 로드 시간 (3초 이내)
- [ ] 페이지 간 이동 시 로딩 표시
- [ ] 이미지/리소스 지연 로딩 동작
- [ ] API 응답 지연 시 적절한 로딩 상태

**반응형 디자인:**
- [ ] 모바일 화면에서 정상 동작
- [ ] 태블릿 화면에서 레이아웃 적응
- [ ] 데스크톱 화면에서 최적 표시
- [ ] 화면 회전 시 레이아웃 조정

**접근성:**
- [ ] 키보드 탐색 가능
- [ ] Tab 순서 논리적 배치
- [ ] 포커스 표시 명확
- [ ] 색상 대비 충분 (WCAG 기준)

### 브라우저 호환성 테스트

**주요 브라우저:**
- [ ] Chrome (최신 버전)
- [ ] Firefox (최신 버전)  
- [ ] Safari (최신 버전)
- [ ] Edge (최신 버전)

**기능별 호환성:**
- [ ] WebSocket 연결 (모든 브라우저)
- [ ] 로컬 스토리지 사용
- [ ] 세션 쿠키 처리
- [ ] CSS Grid/Flexbox 레이아웃

### 보안 테스트

**입력 검증:**
- [ ] XSS 방지 (닉네임, 채팅 메시지)
- [ ] 특수문자 입력 시 적절한 처리
- [ ] SQL Injection 방지 (서버 응답 확인)

**인증/권한:**
- [ ] 미인증 사용자 보호된 페이지 접근 차단
- [ ] 토큰 만료 시 자동 로그아웃
- [ ] 권한 없는 API 호출 차단

---

### 테스트 완료 체크리스트

프로덕션 배포 전 모든 항목이 ✅ 체크되어야 합니다:

- [ ] **로그인 테스트** - 모든 시나리오 통과
- [ ] **방 관리 테스트** - 생성/입장/나가기 정상 동작  
- [ ] **게임 플레이 테스트** - 전체 게임 플로우 검증
- [ ] **WebSocket 재연결** - 네트워크 중단 시나리오 통과
- [ ] **Error Boundary** - 모든 에러 시나리오 처리 확인
- [ ] **성능 및 사용성** - 로딩 시간 및 반응형 검증
- [ ] **브라우저 호환성** - 주요 브라우저에서 동작 확인
- [ ] **보안 테스트** - 입력 검증 및 권한 처리 확인

**테스트 담당자:** _______________  
**테스트 완료 날짜:** _______________  
**승인자:** _______________

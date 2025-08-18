import React, {useState} from 'react'
import {Box, Card, CardContent, Grid, Paper, Typography} from '@components/ui'
import {Moon as DarkModeIcon, Sun as LightModeIcon} from 'lucide-react'
import OptimizedEnhancedChatSystem from './OptimizedEnhancedChatSystem'
import {getAnnouncementColors, getSystemMessageColors, getUserColorSet} from '../utils/colorUtils'
import {getChatThemeVariant} from '../styles/themeVariants'

// Sample users for theme testing
const THEME_TEST_USERS = [
  { id: 1, playerNickname: '라이트모드유저', playerId: 1 },
  { id: 2, playerNickname: '다크모드유저', playerId: 2 },
  { id: 3, playerNickname: '테마테스터', playerId: 3 }
]

// Sample messages for theme testing
const THEME_TEST_MESSAGES = [
  {
    id: 1,
    content: '라이트 모드에서 이 메시지가 잘 보이나요? 😊',
    playerNickname: '라이트모드유저',
    playerId: 1,
    timestamp: new Date().toISOString(),
    type: 'user'
  },
  {
    id: 2,
    content: '게임이 시작되었습니다!',
    timestamp: new Date().toISOString(),
    type: 'system',
    isSystem: true
  },
  {
    id: 3,
    content: '다크 모드에서도 가독성이 좋아야 합니다! 🌙',
    playerNickname: '다크모드유저',
    playerId: 2,
    timestamp: new Date().toISOString(),
    type: 'user'
  },
  {
    id: 4,
    content: '중요한 공지사항입니다!',
    timestamp: new Date().toISOString(),
    type: 'announcement'
  },
  {
    id: 5,
    content: '색상 대비가 충분한지 확인해주세요! 🎨',
    playerNickname: '테마테스터',
    playerId: 3,
    timestamp: new Date().toISOString(),
    type: 'user'
  },
  {
    id: 6,
    content: '라운드 1이 시작되었습니다.',
    timestamp: new Date().toISOString(),
    type: 'info',
    isSystem: true
  }
]

const ChatThemeTest = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentUser] = useState(THEME_TEST_USERS[0])

  const handleSendMessage = (content) => {
    console.log('[DEBUG_LOG] Theme test message sent:', content)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Get color samples for demonstration
  const user1Colors = getUserColorSet(THEME_TEST_USERS[0].playerId, isDarkMode)
  const user2Colors = getUserColorSet(THEME_TEST_USERS[1].playerId, isDarkMode)
  const user3Colors = getUserColorSet(THEME_TEST_USERS[2].playerId, isDarkMode)
  const systemColors = getSystemMessageColors(isDarkMode)
  const announcementColors = getAnnouncementColors(isDarkMode)
  const chatTheme = getChatThemeVariant(isDarkMode)

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 2,
      bgcolor: 'background.default',
      color: 'text.primary',
      transition: 'all 0.3s ease-in-out'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          채팅 테마 호환성 테스트
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, margin: '8px 0' }}>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
              style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                appearance: 'none',
                background: isDarkMode ? '#1976d2' : '#ccc',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            />
            <span>{isDarkMode ? '다크 모드' : '라이트 모드'}</span>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Color Palette Demo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                사용자별 색상 팔레트
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* User 1 Colors */}
                <Box>
                  <Typography variant="subtitle2">{THEME_TEST_USERS[0].playerNickname}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user1Colors.base,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Base Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user1Colors.background,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Background Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user1Colors.border,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Border Color" />
                  </Box>
                </Box>

                {/* User 2 Colors */}
                <Box>
                  <Typography variant="subtitle2">{THEME_TEST_USERS[1].playerNickname}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user2Colors.base,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Base Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user2Colors.background,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Background Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user2Colors.border,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Border Color" />
                  </Box>
                </Box>

                {/* User 3 Colors */}
                <Box>
                  <Typography variant="subtitle2">{THEME_TEST_USERS[2].playerNickname}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user3Colors.base,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Base Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user3Colors.background,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Background Color" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: user3Colors.border,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Border Color" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Colors Demo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시스템 메시지 색상
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* System Messages */}
                <Box>
                  <Typography variant="subtitle2">시스템 메시지</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: systemColors.base,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="System Base" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: systemColors.background,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="System Background" />
                  </Box>
                </Box>

                {/* Announcement Messages */}
                <Box>
                  <Typography variant="subtitle2">공지사항</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: announcementColors.base,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Announcement Base" />
                    <Box sx={{ 
                      width: 30, 
                      height: 30, 
                      backgroundColor: announcementColors.background,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }} title="Announcement Background" />
                  </Box>
                </Box>

                {/* Theme Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="caption" display="block">
                    <strong>현재 테마:</strong> {isDarkMode ? '다크 모드' : '라이트 모드'}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>배경색:</strong> {isDarkMode ? '#121212' : '#ffffff'}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>텍스트색:</strong> {isDarkMode ? '#ffffff' : '#000000'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Chat Demo */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            실시간 테마 적용 데모
          </Typography>
          <Typography variant="caption" color="text.secondary">
            테마를 전환하여 다크/라이트 모드에서의 가독성과 색상 대비를 확인하세요.
            각 사용자는 고유한 색상을 가지며, 시스템 메시지는 구분되는 스타일로 표시됩니다.
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <OptimizedEnhancedChatSystem
            messages={THEME_TEST_MESSAGES}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            disabled={false}
            placeholder={`${isDarkMode ? '다크' : '라이트'} 모드에서 메시지를 입력해보세요...`}
            maxLength={200}
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default ChatThemeTest
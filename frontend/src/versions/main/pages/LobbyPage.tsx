import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {BookOpen, Crown, FileText, LogOut, RefreshCw, Settings, User, Users} from 'lucide-react'
import {useAuthStore} from '@/stores/authStore'
import {useToast} from '@/hooks/useToast'
import {TopicManagementSection} from '@/components/lobby/TopicManagementSection'
import {AnswerManagementSection} from '@/components/lobby/AnswerManagementSection'
import {GameRoomsSection} from '@/components/lobby/GameRoomsSection'
import {gameService} from '@/api/gameApi'
import {subjectService} from '@/api/subjectApi'
import {wordService} from '@/api/wordApi'
import {useModal} from '@/contexts/ModalContext'

export function MainLobbyPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { nickname, logout } = useAuthStore()
  const { isAnyModalOpen, activeModals } = useModal()
  const [activeTab, setActiveTab] = useState('games')

  // Dynamic statistics state
  const [stats, setStats] = useState({
    activeGameRooms: 0,
    registeredTopics: 0,
    totalAnswers: 0,
    isLoading: true
  })

  // Fetch dynamic statistics
  const fetchStats = async () => {
    setStats(prev => ({ ...prev, isLoading: true }))

    try {
      // Fetch all data in parallel
      const [gameListResponse, subjectsResponse, wordsResponse] = await Promise.all([
        gameService.getGameList(0, 100), // Get first 100 games
        subjectService.getSubjects(),
        wordService.getWords()
      ])

      // Count active game rooms (WAITING status)
      const gameList = gameListResponse.gameRooms || gameListResponse.games || gameListResponse.data || []
      const activeGameRooms = gameList.filter(game => game.gameState === 'WAITING').length

      // Count registered topics
      const topics = subjectsResponse.subjects || []
      const registeredTopics = topics.length

      // Count total answers across all topics
      const words = wordsResponse.words || []
      const totalAnswers = words.length

      setStats({
        activeGameRooms,
        registeredTopics,
        totalAnswers,
        isLoading: false
      })

    } catch (error) {
      console.error('Failed to fetch lobby statistics:', error)
      toast({
        title: "통계 로드 실패",
        description: "로비 통계를 불러오는 중 오류가 발생했습니다",
        variant: "destructive",
      })
      setStats(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Load statistics on component mount and when tab changes
  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-refresh statistics every 30 seconds - only when component is focused and no modals are open
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if document is focused and no modals are open to avoid interfering with user interactions
      if (document.hasFocus() && !isAnyModalOpen) {
        console.log('[LobbyPage] Auto-refreshing statistics');
        fetchStats()
      } else if (isAnyModalOpen) {
        console.log('[LobbyPage] Skipping auto-refresh - modal open:', Array.from(activeModals));
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isAnyModalOpen, activeModals])

  const handleLogout = () => {
    logout()
    navigate('/')
    toast({
      title: "로그아웃되었습니다",
      description: "안전하게 로그아웃되었습니다",
    })
  }

  const handleRefreshStats = () => {
    fetchStats()
    toast({
      title: "통계 새로고침",
      description: "최신 통계를 불러왔습니다",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              라이어 게임 로비
            </h1>
            <p className="text-muted-foreground mt-1">
              게임방을 만들거나 참여하고, 주제와 답안을 관리하세요
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">{nickname}</p>
                  <p className="text-xs text-muted-foreground">플레이어</p>
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStats}
                disabled={stats.isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${stats.isLoading ? 'animate-spin' : ''}`} />
                통계 새로고침
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <Crown className="mr-2 h-4 w-4" />
                    관리자 메뉴
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* 탭 네비게이션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                게임룸
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                주제 관리
              </TabsTrigger>
              <TabsTrigger value="answers" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                답안 관리
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="games">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GameRoomsSection key={`games-${stats.isLoading}`} />
                </motion.div>
              </TabsContent>

              <TabsContent value="topics">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TopicManagementSection key={`topics-${stats.isLoading}`} />
                </motion.div>
              </TabsContent>

              <TabsContent value="answers">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnswerManagementSection key={`answers-${stats.isLoading}`} />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        {/* 통계 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 게임룸</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.isLoading ? (
                  <RefreshCw className="h-6 w-6 animate-spin inline-block" />
                ) : (
                  stats.activeGameRooms
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                현재 플레이 가능한 방
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 주제</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.isLoading ? (
                  <RefreshCw className="h-6 w-6 animate-spin inline-block" />
                ) : (
                  stats.registeredTopics
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                게임에 사용할 수 있는 주제
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 답안 수</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.isLoading ? (
                  <RefreshCw className="h-6 w-6 animate-spin inline-block" />
                ) : (
                  stats.totalAnswers
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                모든 주제의 답안 합계
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

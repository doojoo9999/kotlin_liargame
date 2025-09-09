import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {ArrowRight, User} from 'lucide-react'
import {useLogin} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import {useAuthStore} from '@/stores/authStore'

export function MainLoginPage() {
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated } = useAuthStore()
  
  const loginMutation = useLogin()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      toast({
        title: "닉네임이 필요합니다",
        description: "계속하려면 닉네임을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      // 닉네임과 password null로 간단한 인증
      await loginMutation.mutateAsync({ 
        nickname: nickname.trim(),
        password: null
      })
      
      // 인증 상태 저장
      useAuthStore.getState().login(nickname.trim())
      
      // 항상 로비로 리다이렉트
      navigate('/lobby')
      
      toast({
        title: "환영합니다!",
        description: `${nickname}님으로 로그인되었습니다`,
      })
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
        minHeight: '100vh'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
              }}
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">라이어 게임에 오신 것을 환영합니다</CardTitle>
            <CardDescription>
              게임을 시작하려면 닉네임을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium">
                  닉네임
                </label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="당신의 닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-center text-lg"
                  disabled={loginMutation.isPending}
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loginMutation.isPending || !nickname.trim()}
              >
                {loginMutation.isPending ? (
                  "로그인 중..."
                ) : (
                  <>
                    게임 시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

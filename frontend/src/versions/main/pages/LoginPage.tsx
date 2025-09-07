import {useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {motion} from 'framer-motion'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {ArrowRight, User} from 'lucide-react'
import {useJoinGame, useLogin} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'

export function MainLoginPage() {
  const [nickname, setNickname] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const loginMutation = useLogin()
  const joinGameMutation = useJoinGame()
  
  const action = searchParams.get('action')
  const gameId = searchParams.get('gameId')
  const sessionCode = searchParams.get('sessionCode')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      toast({
        title: "Nickname required",
        description: "Please enter a nickname to continue",
        variant: "destructive",
      })
      return
    }

    try {
      if (action === 'create' && gameId) {
        // Login and go to lobby as host
        await loginMutation.mutateAsync({ 
          nickname: nickname.trim(),
          gameId 
        })
        navigate(`/main/lobby/${sessionCode}`)
        
      } else if (action === 'join' && sessionCode) {
        // Login first, then join game
        await loginMutation.mutateAsync({ 
          nickname: nickname.trim() 
        })
        
        // Then join the game
        await joinGameMutation.mutateAsync({
          sessionCode,
          nickname: nickname.trim()
        })
        
        navigate(`/main/lobby/${sessionCode}`)
        
      } else {
        // Regular login
        await loginMutation.mutateAsync({ 
          nickname: nickname.trim() 
        })
        navigate('/main')
      }
      
      toast({
        title: "Welcome!",
        description: `Logged in as ${nickname}`,
      })
      
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getTitle = () => {
    if (action === 'create') return "Create Your Game"
    if (action === 'join') return "Join Game"
    return "Enter Your Nickname"
  }

  const getDescription = () => {
    if (action === 'create' && sessionCode) {
      return `You're creating a new game with session code: ${sessionCode}`
    }
    if (action === 'join' && sessionCode) {
      return `You're joining game: ${sessionCode}`
    }
    return "Choose a nickname to get started"
  }

  const isLoading = loginMutation.isPending || joinGameMutation.isPending

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-center"
                  maxLength={20}
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  This is how other players will see you
                </p>
              </div>
              
              <Button 
                type="submit"
                className="w-full"
                disabled={isLoading || !nickname.trim()}
              >
                {isLoading ? (
                  'Please wait...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            
            {(action === 'create' || action === 'join') && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  {action === 'create' ? (
                    <>You'll be the host of this game</>
                  ) : (
                    <>Joining existing game session</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
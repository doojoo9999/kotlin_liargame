import React, {useState} from 'react';
import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ArrowRight, Lock, User} from 'lucide-react';
import {useToast} from '@/hooks/useToast';
import {useAuthStore} from '@/stores/authStore';

export function MainLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuthStore();

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 인증된 경우 리다이렉트
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/lobby';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast({
        title: "닉네임 입력 오류",
        description: "닉네임을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "패스워드 입력 오류",
        description: "패스워드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await login(nickname.trim(), password);

      toast({
        title: "로그인 성공",
        description: `${nickname}님, 환영합니다!`,
      });

      const from = location.state?.from?.pathname || '/lobby';
      navigate(from, { replace: true });

    } catch (error: unknown) {
      console.error('Login error:', error);

      const errorMessage = error instanceof Error ? error.message : "로그인에 실패했습니다. 닉네임과 패스워드를 확인해주세요.";

      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold">라이어 게임</CardTitle>
            <CardDescription>
              닉네임과 패스워드를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium">
                  닉네임
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  패스워드
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="패스워드를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !nickname.trim() || !password.trim()}
              >
                {loading ? (
                  "로그인 중..."
                ) : (
                  <>
                    로그인
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>테스트 계정을 사용하시거나</p>
              <p>새로운 닉네임과 패스워드로 가입하세요</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

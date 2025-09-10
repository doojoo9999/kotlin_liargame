import React, {useState} from 'react';
import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ArrowRight, User} from 'lucide-react';
import {useToast} from '@/hooks/useToast';
import {useAuthStore} from '@/stores/authStore';
import {validateNickname} from '@/utils/nicknameValidation';

export function MainLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuthStore();

  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState('');

  // 이미 인증된 경우 리다이렉트
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/lobby';
    return <Navigate to={from} replace />;
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    
    // 실시간 검증
    if (value.trim()) {
      const validation = validateNickname(value);
      setNicknameError(validation.isValid ? '' : validation.error || '');
    } else {
      setNicknameError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 닉네임 검증
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setNicknameError(validation.error || '잘못된 닉네임입니다.');
      toast({
        title: "닉네임 오류",
        description: validation.error || '잘못된 닉네임입니다.',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setNicknameError('');

    try {
      await login(validation.normalizedNickname!);

      toast({
        title: "접속 성공",
        description: `${nickname.trim()}님, 환영합니다!`,
      });

      const from = location.state?.from?.pathname || '/lobby';
      navigate(from, { replace: true });

    } catch (error: unknown) {
      console.error('Login error:', error);

      const errorMessage = error instanceof Error ? error.message : "접속에 실패했습니다. 닉네임이 이미 사용 중일 수 있습니다.";

      toast({
        title: "접속 실패",
        description: errorMessage,
        variant: "destructive",
      });
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
              닉네임을 입력해서 게임에 참여하세요
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
                    placeholder="닉네임을 입력하세요 (한글/영어, 2-12자)"
                    value={nickname}
                    onChange={handleNicknameChange}
                    className={`pl-10 ${nicknameError ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                    maxLength={12}
                  />
                </div>
                {nicknameError && (
                  <p className="text-sm text-red-600 mt-1">{nicknameError}</p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  • 한글과 영어만 사용 가능 • 2-12자 제한 • 대소문자 구분 없음
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !nickname.trim() || !!nicknameError}
              >
                {loading ? (
                  "접속 중..."
                ) : (
                  <>
                    게임 시작
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>개인정보 수집 없이 자유롭게 이용하세요</p>
              <p>같은 닉네임이 이미 접속 중이면 사용할 수 없습니다</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {Box, Button, Paper, Text, Title} from '../components/ui';

/**
 * 로그인 실패 시 사용자에게 보여주는 페이지.
 * 현재는 다국어(i18n) 지원이 적용되지 않아 하드코딩된 텍스트를 사용합니다.
 */
function LoginFailurePage() {
  // const { t } = useI18n(); // i18n 적용 전이므로 의존성 제거

  return (
    <Box
      $display="flex"
      $alignItems="center"
      $justifyContent="center"
      $minHeight="100vh"
      $backgroundColor="background.default"
    >
      <Paper $padding={4} $textAlign="center" $maxWidth="400px">
        <Title order={2} $marginBottom={2}>
          {/* {t('login.failureTitle')} */}
          로그인 실패
        </Title>
        <Text $marginBottom={4}>
          {/* {t('login.failureMessage')} */}
          로그인 정보가 올바르지 않거나, 서버에 문제가 발생했습니다. 다시 시도해주세요.
        </Text>
        <Button
          component={RouterLink}
          to="/login"
          fullWidth
        >
          {/* {t('login.backToLogin')} */}
          로그인 페이지로 돌아가기
        </Button>
      </Paper>
    </Box>
  );
}

export default LoginFailurePage;
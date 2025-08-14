import React, {useEffect, useState} from 'react'
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Paper,
    Slide,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {
    Chat as ChatIcon,
    Close as CloseIcon,
    EmojiEvents as WinIcon,
    Group as CitizenIcon,
    HowToVote as VoteIcon,
    Info as InfoIcon,
    NavigateBefore as BackIcon,
    NavigateNext as NextIcon,
    PlayArrow as StartIcon,
    Psychology as LiarIcon,
    Timer as TimerIcon
} from '@mui/icons-material'

const TUTORIAL_STEPS = [
  {
    title: '라이어 게임에 오신 것을 환영합니다! 🎭',
    content: '라이어 게임은 한 명의 라이어를 찾아내는 추리 게임입니다. 모든 플레이어가 협력하여 라이어를 찾아내거나, 라이어가 정체를 숨기고 단어를 맞춰야 합니다.',
    icon: <StartIcon />,
    color: 'primary'
  },
  {
    title: '역할 이해하기',
    content: '게임이 시작되면 두 가지 역할 중 하나가 배정됩니다.',
    icon: <InfoIcon />,
    color: 'info',
    subSteps: [
      {
        title: '👥 시민',
        description: '주제에 맞는 단어를 받습니다. 라이어를 찾아내는 것이 목표입니다.',
        icon: <CitizenIcon />
      },
      {
        title: '🎭 라이어',
        description: '단어를 모르는 상태로 시작합니다. 정체를 숨기고 단어를 추리해야 합니다.',
        icon: <LiarIcon />
      }
    ]
  },
  {
    title: '게임 진행 과정',
    content: '게임은 여러 단계로 진행됩니다.',
    icon: <TimerIcon />,
    color: 'warning',
    subSteps: [
      {
        title: '1. 발언 단계',
        description: '각 플레이어가 순서대로 주제에 대한 힌트를 제시합니다.',
        icon: <ChatIcon />
      },
      {
        title: '2. 투표 단계',
        description: '모든 플레이어가 라이어라고 생각하는 사람에게 투표합니다.',
        icon: <VoteIcon />
      },
      {
        title: '3. 결과 발표',
        description: '투표 결과에 따라 승부가 결정됩니다.',
        icon: <WinIcon />
      }
    ]
  },
  {
    title: '승리 조건',
    content: '각 역할의 승리 조건을 알아보세요.',
    icon: <WinIcon />,
    color: 'success',
    subSteps: [
      {
        title: '시민 승리',
        description: '투표를 통해 라이어를 정확히 찾아내면 시민이 승리합니다.',
        icon: <CitizenIcon />
      },
      {
        title: '라이어 승리',
        description: '투표에서 살아남거나, 단어를 정확히 맞추면 라이어가 승리합니다.',
        icon: <LiarIcon />
      }
    ]
  },
  {
    title: '게임 팁 💡',
    content: '성공적인 게임을 위한 팁들입니다.',
    icon: <InfoIcon />,
    color: 'secondary',
    subSteps: [
      {
        title: '시민일 때',
        description: '너무 구체적이지 않으면서도 라이어가 알 수 없는 힌트를 주세요.',
        icon: <CitizenIcon />
      },
      {
        title: '라이어일 때',
        description: '다른 사람들의 힌트를 잘 듣고 자연스럽게 섞여들어가세요.',
        icon: <LiarIcon />
      },
      {
        title: '채팅 활용',
        description: '채팅을 통해 다른 플레이어들과 소통하고 추리해보세요.',
        icon: <ChatIcon />
      }
    ]
  }
]

// Action guidance messages
const ACTION_GUIDANCE = {
  WAITING: {
    message: '게임 시작을 기다리고 있습니다',
    description: '방장이 게임을 시작할 때까지 기다려주세요. 채팅으로 다른 플레이어들과 대화해보세요!',
    icon: <TimerIcon />,
    color: 'info'
  },
  SPEAKING: {
    message: '발언 차례입니다',
    description: '주제에 맞는 힌트를 제시해주세요. 너무 구체적이지 않게 주의하세요!',
    icon: <ChatIcon />,
    color: 'primary'
  },
  HINT_PHASE: {
    message: '힌트를 입력해주세요',
    description: '아래 입력창에 힌트를 작성하고 제출하세요.',
    icon: <ChatIcon />,
    color: 'primary'
  },
  VOTING: {
    message: '투표 시간입니다',
    description: '라이어라고 생각하는 플레이어를 선택하고 투표하세요.',
    icon: <VoteIcon />,
    color: 'warning'
  },
  DEFENSE: {
    message: '변론 시간입니다',
    description: '자신이 라이어가 아님을 증명할 변론을 작성하세요.',
    icon: <InfoIcon />,
    color: 'error'
  },
  SURVIVAL_VOTING: {
    message: '생존 투표입니다',
    description: '지목된 플레이어의 생존 여부를 결정하세요.',
    icon: <VoteIcon />,
    color: 'warning'
  },
  WORD_GUESS: {
    message: '단어 추리 시간입니다',
    description: '라이어로 지목되었습니다. 단어를 맞춰서 역전승을 노려보세요!',
    icon: <LiarIcon />,
    color: 'error'
  },
  RESULTS: {
    message: '게임이 종료되었습니다',
    description: '결과를 확인하고 다음 게임을 준비하세요.',
    icon: <WinIcon />,
    color: 'success'
  }
}

const GameTutorialSystem = ({ 
  open, 
  onClose, 
  showOnFirstVisit = true 
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [activeStep, setActiveStep] = useState(0)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (showOnFirstVisit && open) {
      const hasSeenTutorial = localStorage.getItem('liar-game-tutorial-seen')
      if (!hasSeenTutorial) {
        setShowTutorial(true)
      }
    } else {
      setShowTutorial(open)
    }
  }, [open, showOnFirstVisit])

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleClose = () => {
    localStorage.setItem('liar-game-tutorial-seen', 'true')
    setShowTutorial(false)
    setActiveStep(0)
    onClose?.()
  }

  const handleSkip = () => {
    localStorage.setItem('liar-game-tutorial-seen', 'true')
    setShowTutorial(false)
    setActiveStep(0)
    onClose?.()
  }

  return (
    <Dialog
      open={showTutorial}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          게임 튜토리얼
        </Typography>
        <Box>
          <Button size="small" onClick={handleSkip} sx={{ mr: 1 }}>
            건너뛰기
          </Button>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Stepper 
          activeStep={activeStep} 
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 3 }}
        >
          {TUTORIAL_STEPS.map((step, index) => (
            <Step key={index}>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      bgcolor: index <= activeStep ? `${step.color}.main` : 'grey.300',
                      width: 32,
                      height: 32
                    }}
                  >
                    {step.icon}
                  </Avatar>
                )}
              >
                {!isMobile && step.title}
              </StepLabel>
              {isMobile && (
                <StepContent>
                  <TutorialStepContent step={step} isMobile={isMobile} />
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        {!isMobile && (
          <Fade in key={activeStep}>
            <Box>
              <TutorialStepContent 
                step={TUTORIAL_STEPS[activeStep]} 
                isMobile={isMobile} 
              />
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          이전
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Typography variant="caption" sx={{ mx: 2 }}>
          {activeStep + 1} / {TUTORIAL_STEPS.length}
        </Typography>
        
        <Box sx={{ flex: 1 }} />

        {activeStep === TUTORIAL_STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleClose}
            color="success"
          >
            시작하기
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}
          >
            다음
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

const TutorialStepContent = ({ step, isMobile }) => (
  <Paper 
    elevation={2} 
    sx={{ 
      p: isMobile ? 2 : 3, 
      bgcolor: 'background.default',
      border: `2px solid ${step.color === 'primary' ? '#1976d2' : 
                           step.color === 'success' ? '#2e7d32' :
                           step.color === 'warning' ? '#ed6c02' :
                           step.color === 'error' ? '#d32f2f' :
                           step.color === 'info' ? '#0288d1' : '#9c27b0'}`
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Avatar
        sx={{
          bgcolor: `${step.color}.main`,
          mr: 2,
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
      >
        {step.icon}
      </Avatar>
      <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
        {step.title}
      </Typography>
    </Box>

    <Typography variant="body1" sx={{ mb: step.subSteps ? 2 : 0, lineHeight: 1.6 }}>
      {step.content}
    </Typography>

    {step.subSteps && (
      <Box sx={{ mt: 2 }}>
        {step.subSteps.map((subStep, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'grey.100',
                color: 'text.primary',
                width: 32,
                height: 32,
                mr: 2,
                mt: 0.5
              }}
            >
              {subStep.icon}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                {subStep.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subStep.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Paper>
)

// Action guidance component
export const ActionGuidance = ({ 
  gameStatus, 
  isCurrentTurn = false, 
  currentPlayer,
  show = true 
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  if (!show || !gameStatus) return null

  const guidance = ACTION_GUIDANCE[gameStatus]
  if (!guidance) return null

  return (
    <Slide direction="down" in={show} timeout={500}>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: isMobile ? 70 : 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
          width: '100%'
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: `${guidance.color}.main`,
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            {guidance.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {guidance.message}
              {isCurrentTurn && gameStatus === 'SPEAKING' && ' (당신 차례)'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {guidance.description}
            </Typography>
            {currentPlayer && gameStatus === 'SPEAKING' && !isCurrentTurn && (
              <Typography variant="caption" color="primary.main">
                현재: {currentPlayer.nickname}님
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Slide>
  )
}

export default GameTutorialSystem
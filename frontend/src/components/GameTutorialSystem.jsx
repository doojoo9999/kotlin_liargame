import React, {useEffect, useState} from 'react'
import styled, {keyframes} from 'styled-components'
import {
    Brain,
    ChevronLeft,
    ChevronRight,
    Clock,
    Info,
    Lightbulb,
    MessageCircle as Chat,
    Play,
    Trophy,
    Users,
    Vote,
    X
} from 'lucide-react'
import {Button} from './ui'

const TUTORIAL_STEPS = [
    {
        title: '라이어 게임에 오신 것을 환영합니다! 🎭',
        content: '라이어 게임은 한 명의 라이어를 찾아내는 추리 게임입니다. 모든 플레이어가 협력하여 라이어를 찾아내거나, 라이어가 정체를 숨기고 단어를 맞춰야 합니다.',
        icon: <Play size={24} />,
        color: '#2196F3'
    },
    {
        title: '역할 이해하기',
        content: '게임이 시작되면 두 가지 역할 중 하나가 배정됩니다.',
        icon: <Info size={24} />,
        color: '#03DAC6',
        subSteps: [
            {
                title: '👥 시민',
                description: '주제에 맞는 단어를 받습니다. 라이어를 찾아내는 것이 목표입니다.',
                icon: <Users size={20} />
            },
            {
                title: '🎭 라이어',
                description: '단어를 모르는 상태로 시작합니다. 정체를 숨기고 단어를 추리해야 합니다.',
                icon: <Brain size={20} />
            }
        ]
    },
    {
        title: '게임 진행 과정',
        content: '게임은 여러 단계로 진행됩니다.',
        icon: <Clock size={24} />,
        color: '#FF9800',
        subSteps: [
            {
                title: '1. 발언 단계',
                description: '각 플레이어가 순서대로 주제에 대한 힌트를 제시합니다.',
                icon: <Chat size={20} />
            },
            {
                title: '2. 투표 단계',
                description: '모든 플레이어가 라이어라고 생각하는 사람에게 투표합니다.',
                icon: <Vote size={20} />
            },
            {
                title: '3. 결과 발표',
                description: '투표 결과에 따라 승부가 결정됩니다.',
                icon: <Trophy size={20} />
            }
        ]
    },
    {
        title: '승리 조건',
        content: '각 역할의 승리 조건을 알아보세요.',
        icon: <Trophy size={24} />,
        color: '#4CAF50',
        subSteps: [
            {
                title: '시민 승리',
                description: '투표를 통해 라이어를 정확히 찾아내면 시민이 승리합니다.',
                icon: <Users size={20} />
            },
            {
                title: '라이어 승리',
                description: '투표에서 살아남거나, 단어를 정확히 맞추면 라이어가 승리합니다.',
                icon: <Brain size={20} />
            }
        ]
    },
    {
        title: '게임 팁 💡',
        content: '성공적인 게임을 위한 팁들입니다.',
        icon: <Lightbulb size={24} />,
        color: '#9C27B0',
        subSteps: [
            {
                title: '시민일 때',
                description: '너무 구체적이지 않으면서도 라이어가 알 수 없는 힌트를 주세요.',
                icon: <Users size={20} />
            },
            {
                title: '라이어일 때',
                description: '다른 사람들의 힌트를 잘 듣고 자연스럽게 섞여들어가세요.',
                icon: <Brain size={20} />
            },
            {
                title: '채팅 활용',
                description: '채팅을 통해 다른 플레이어들과 소통하고 추리해보세요.',
                icon: <Chat size={20} />
            }
        ]
    }
]

// Action guidance messages
const ACTION_GUIDANCE = {
    WAITING: {
        message: '게임 시작을 기다리고 있습니다',
        description: '방장이 게임을 시작할 때까지 기다려주세요. 채팅으로 다른 플레이어들과 대화해보세요!',
        icon: <Clock size={20} />,
        color: '#03DAC6'
    },
    SPEAKING: {
        message: '발언 차례입니다',
        description: '주제에 맞는 힌트를 제시해주세요. 너무 구체적이지 않게 주의하세요!',
        icon: <Chat size={20} />,
        color: '#2196F3'
    },
    HINT_PHASE: {
        message: '힌트를 입력해주세요',
        description: '아래 입력창에 힌트를 작성하고 제출하세요.',
        icon: <Chat size={20} />,
        color: '#2196F3'
    },
    VOTING: {
        message: '투표 시간입니다',
        description: '라이어라고 생각하는 플레이어를 선택하고 투표하세요.',
        icon: <Vote size={20} />,
        color: '#FF9800'
    },
    DEFENSE: {
        message: '변론 시간입니다',
        description: '자신이 라이어가 아님을 증명할 변론을 작성하세요.',
        icon: <Info size={20} />,
        color: '#F44336'
    },
    SURVIVAL_VOTING: {
        message: '생존 투표입니다',
        description: '지목된 플레이어의 생존 여부를 결정하세요.',
        icon: <Vote size={20} />,
        color: '#FF9800'
    },
    WORD_GUESS: {
        message: '단어 추리 시간입니다',
        description: '라이어로 지목되었습니다. 단어를 맞춰서 역전승을 노려보세요!',
        icon: <Brain size={20} />,
        color: '#F44336'
    },
    RESULTS: {
        message: '게임이 종료되었습니다',
        description: '결과를 확인하고 다음 게임을 준비하세요.',
        icon: <Trophy size={20} />,
        color: '#4CAF50'
    }
}

// Styled Components
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

const TutorialOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`

const TutorialModal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 768px) {
    max-height: 95vh;
    border-radius: 12px;
  }
`

const TutorialHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 16px 16px 12px;
  }
`

const TutorialTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const SkipButton = styled(Button)`
  font-size: 14px;
  padding: 6px 12px;
  background: transparent;
  color: #666;
  
  &:hover {
    background: #f5f5f5;
  }
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`

const TutorialContent = styled.div`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`

const StepProgressBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 24px;
  }
`

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.active ? props.color : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#999'};
  transition: all 0.3s;
  font-size: 14px;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
`

const StepContent = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
`

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const StepTitle = styled.h3`
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;

  @media (max-width: 768px) {
    font-size: 24px;
    margin: 0 0 8px 0;
  }
`

const StepDescription = styled.p`
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`

const SubSteps = styled.div`
  display: grid;
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 768px) {
    gap: 12px;
    margin-top: 16px;
  }
`

const SubStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid ${props => props.color || '#2196F3'};

  @media (max-width: 768px) {
    padding: 12px;
    gap: 8px;
  }
`

const SubStepIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
  color: ${props => props.color || '#2196F3'};

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`

const SubStepContent = styled.div`
  flex: 1;
`

const SubStepTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`

const SubStepDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`

const TutorialFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
`

const NavigationButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 14px;
  }
`

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
  font-size: 14px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    order: -1;
    font-size: 12px;
  }
`

const TutorialStepContent = ({ step, isMobile }) => (
    <StepContent>
        <StepHeader>
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.content}</StepDescription>
        </StepHeader>

        {step.subSteps && (
            <SubSteps>
                {step.subSteps.map((subStep, index) => (
                    <SubStep key={index} color={step.color}>
                        <SubStepIcon color={step.color}>
                            {subStep.icon}
                        </SubStepIcon>
                        <SubStepContent>
                            <SubStepTitle>{subStep.title}</SubStepTitle>
                            <SubStepDescription>{subStep.description}</SubStepDescription>
                        </SubStepContent>
                    </SubStep>
                ))}
            </SubSteps>
        )}
    </StepContent>
)

const GameTutorialSystem = ({
                                open,
                                onClose,
                                showOnFirstVisit = true
                            }) => {
    const [activeStep, setActiveStep] = useState(0)
    const [showTutorial, setShowTutorial] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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

    if (!showTutorial) return null

    const currentStep = TUTORIAL_STEPS[activeStep]

    return (
        <TutorialOverlay onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <TutorialModal>
                <TutorialHeader>
                    <TutorialTitle>게임 튜토리얼</TutorialTitle>
                    <HeaderActions>
                        <SkipButton variant="ghost" size="small" onClick={handleSkip}>
                            건너뛰기
                        </SkipButton>
                        <CloseButton onClick={handleClose}>
                            <X size={20} />
                        </CloseButton>
                    </HeaderActions>
                </TutorialHeader>

                <TutorialContent>
                    <StepProgressBar>
                        {TUTORIAL_STEPS.map((step, index) => (
                            <StepIndicator
                                key={index}
                                active={index <= activeStep}
                                color={step.color}
                            >
                                {step.icon}
                            </StepIndicator>
                        ))}
                    </StepProgressBar>

                    <TutorialStepContent step={currentStep} isMobile={isMobile} />
                </TutorialContent>

                <TutorialFooter>
                    <NavigationButton
                        variant="ghost"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        <ChevronLeft size={16} />
                        이전
                    </NavigationButton>

                    <ProgressInfo>
                        <span>{activeStep + 1} / {TUTORIAL_STEPS.length}</span>
                    </ProgressInfo>

                    {activeStep === TUTORIAL_STEPS.length - 1 ? (
                        <NavigationButton variant="primary" onClick={handleClose}>
                            시작하기
                            <Play size={16} />
                        </NavigationButton>
                    ) : (
                        <NavigationButton variant="primary" onClick={handleNext}>
                            다음
                            <ChevronRight size={16} />
                        </NavigationButton>
                    )}
                </TutorialFooter>
            </TutorialModal>
        </TutorialOverlay>
    )
}

// Action guidance component for in-game guidance
export const ActionGuidance = ({ action, visible = true }) => {
    const guidance = ACTION_GUIDANCE[action]

    if (!guidance || !visible) return null

    return (
        <ActionGuidanceContainer>
            <ActionGuidanceIcon color={guidance.color}>
                {guidance.icon}
            </ActionGuidanceIcon>
            <ActionGuidanceContent>
                <ActionGuidanceTitle>{guidance.message}</ActionGuidanceTitle>
                <ActionGuidanceDescription>{guidance.description}</ActionGuidanceDescription>
            </ActionGuidanceContent>
        </ActionGuidanceContainer>
    )
}

const ActionGuidanceContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #2196F3;
  margin: 16px 0;
  animation: ${fadeIn} 0.3s ease-out;
`

const ActionGuidanceIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
  color: ${props => props.color || '#2196F3'};
`

const ActionGuidanceContent = styled.div`
  flex: 1;
`

const ActionGuidanceTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
`

const ActionGuidanceDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`

export default GameTutorialSystem
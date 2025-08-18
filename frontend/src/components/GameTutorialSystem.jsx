import React, {useEffect, useState} from 'react'
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

const TutorialStepContent = ({ step, isMobile }) => (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <div style={{
            textAlign: 'center',
            marginBottom: '24px'
        }}>
            <h3 style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 12px 0'
            }}>
                {step.title}
            </h3>
            <p style={{
                fontSize: isMobile ? '14px' : '16px',
                color: '#666',
                lineHeight: 1.6,
                margin: 0
            }}>
                {step.content}
            </p>
        </div>

        {step.subSteps && (
            <div style={{
                display: 'grid',
                gap: isMobile ? '12px' : '16px',
                marginTop: isMobile ? '16px' : '24px'
            }}>
                {step.subSteps.map((subStep, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: isMobile ? '8px' : '12px',
                        padding: isMobile ? '12px' : '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${step.color || '#2196F3'}`
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: isMobile ? '28px' : '32px',
                            height: isMobile ? '28px' : '32px',
                            background: 'white',
                            borderRadius: '8px',
                            flexShrink: 0,
                            color: step.color || '#2196F3'
                        }}>
                            {subStep.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: 600,
                                color: '#1a1a1a',
                                margin: '0 0 4px 0'
                            }}>
                                {subStep.title}
                            </h4>
                            <p style={{
                                fontSize: isMobile ? '13px' : '14px',
                                color: '#666',
                                margin: 0,
                                lineHeight: 1.5
                            }}>
                                {subStep.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
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
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
            }}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '16px 16px 12px' : '24px 24px 16px',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: isMobile ? '20px' : '24px',
                        fontWeight: 600,
                        color: '#1a1a1a'
                    }}>
                        게임 튜토리얼
                    </h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Button variant="ghost" size="small" onClick={handleSkip} style={{
                            fontSize: '14px',
                            padding: '6px 12px',
                            background: 'transparent',
                            color: '#666'
                        }}>
                            건너뛰기
                        </Button>
                        <button 
                            onClick={handleClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#666',
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{
                    padding: isMobile ? '16px' : '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '12px',
                        marginBottom: isMobile ? '24px' : '32px',
                        flexWrap: 'wrap'
                    }}>
                        {TUTORIAL_STEPS.map((step, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: isMobile ? '32px' : '40px',
                                    height: isMobile ? '32px' : '40px',
                                    borderRadius: '50%',
                                    background: index <= activeStep ? step.color : '#f0f0f0',
                                    color: index <= activeStep ? 'white' : '#999',
                                    transition: 'all 0.3s',
                                    fontSize: isMobile ? '12px' : '14px'
                                }}
                            >
                                {step.icon}
                            </div>
                        ))}
                    </div>

                    <TutorialStepContent step={currentStep} isMobile={isMobile} />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '12px 16px' : '16px 24px',
                    borderTop: '1px solid #f0f0f0',
                    ...(isMobile && {
                        flexWrap: 'wrap',
                        gap: '12px'
                    })
                }}>
                    <Button
                        variant="ghost"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            fontSize: isMobile ? '14px' : 'inherit'
                        }}
                    >
                        <ChevronLeft size={16} />
                        이전
                    </Button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        color: '#666',
                        fontSize: isMobile ? '12px' : '14px',
                        ...(isMobile && {
                            width: '100%',
                            justifyContent: 'center',
                            order: -1
                        })
                    }}>
                        <span>{activeStep + 1} / {TUTORIAL_STEPS.length}</span>
                    </div>

                    {activeStep === TUTORIAL_STEPS.length - 1 ? (
                        <Button variant="primary" onClick={handleClose} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            fontSize: isMobile ? '14px' : 'inherit'
                        }}>
                            시작하기
                            <Play size={16} />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleNext} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            fontSize: isMobile ? '14px' : 'inherit'
                        }}>
                            다음
                            <ChevronRight size={16} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Action guidance component for in-game guidance
export const ActionGuidance = ({ action, visible = true }) => {
    const guidance = ACTION_GUIDANCE[action]

    if (!guidance || !visible) return null

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '12px',
            borderLeft: '4px solid #2196F3',
            margin: '16px 0',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'white',
                borderRadius: '8px',
                flexShrink: 0,
                color: guidance.color || '#2196F3'
            }}>
                {guidance.icon}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    margin: '0 0 4px 0'
                }}>
                    {guidance.message}
                </h4>
                <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                    lineHeight: 1.5
                }}>
                    {guidance.description}
                </p>
            </div>
        </div>
    )
}

export default GameTutorialSystem
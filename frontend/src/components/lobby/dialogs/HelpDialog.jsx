import React, {useState} from 'react'
import {Box, Button, Group, Stack, Text} from '@mantine/core'
import {IconHelp} from '@tabler/icons-react'
import {GameModal} from '../../GameModal'
import PaginationComponent from '../PaginationComponent'

const HelpDialog = ({ open, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0)

  const handleClose = () => {
    onClose()
    setCurrentPage(0)
  }

  // Help Dialog Pages Content
  const helpPages = [
    {
      title: "🎮 로비 사용법",
      content: (
        <Box style={{ padding: '0' }}>
          <Text size="xl" weight={600} style={{ 
            color: '#ffffff', 
            marginBottom: '32px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(76, 236, 196, 0.3)'
          }}>
            🎮 로비 사용법
          </Text>
          <Stack gap="lg">
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🏠</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>방 만들기</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  새로운 게임 방을 생성합니다. 참가자 수, 라운드 수, 주제, 비밀번호를 설정할 수 있습니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🚪</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>방 입장</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  기존 방에 참가하거나 진행 중인 게임을 관전할 수 있습니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">➕</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>주제/답안 추가</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  게임에서 사용할 새로운 주제와 답안을 추가할 수 있습니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🔄</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>새로고침</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  방 목록을 최신 상태로 업데이트합니다.
                </Text>
              </Box>
            </Group>
          </Stack>
        </Box>
      )
    },
    {
      title: "🏠 방 설정 안내",
      content: (
        <Box style={{ padding: '0' }}>
          <Text size="xl" weight={600} style={{ 
            color: '#ffffff', 
            marginBottom: '32px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(76, 236, 196, 0.3)'
          }}>
            🏠 방 설정 안내
          </Text>
          <Stack gap="lg">
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">👥</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>참가자 수</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  3명~15명까지 설정 가능합니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🔢</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>라운드 수</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  1~10라운드까지 설정 가능합니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🎯</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>주제 선택</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  여러 주제를 선택하면 랜덤으로 단어가 나옵니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🎮</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>게임 모드</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  라이어가 자신의 역할을 아는 모드와 다른 답을 보는 모드가 있습니다.
                </Text>
              </Box>
            </Group>
            <Group align="flex-start" gap="md" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Text size="xl">🔒</Text>
              <Box>
                <Text weight={600} style={{ color: '#4ecdc4', marginBottom: '8px' }}>비밀방</Text>
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  비밀번호를 설정하여 초대받은 사람만 입장할 수 있습니다.
                </Text>
              </Box>
            </Group>
          </Stack>
        </Box>
      )
    },
    {
      title: "📝 주제/답안 관리",
      content: (
        <Box style={{ padding: '0' }}>
          <Text size="xl" weight={600} style={{ 
            color: '#ffffff', 
            marginBottom: '32px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(76, 236, 196, 0.3)'
          }}>
            📝 주제/답안 관리
          </Text>
          <Stack gap="lg">
            <Box style={{ 
              padding: '20px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '12px' }}>
                <Text size="xl">✨</Text>
                <Text weight={600} style={{ color: '#4ecdc4' }}>주제 추가 가이드</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                새로운 주제를 추가하면 모든 사용자가 사용할 수 있습니다.
              </Text>
            </Box>
            
            <Box style={{ 
              padding: '20px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '12px' }}>
                <Text size="xl">📋</Text>
                <Text weight={600} style={{ color: '#4ecdc4' }}>답안 요구사항</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                각 주제에는 최소 5개 이상의 답안이 있어야 게임에서 사용 가능합니다.
              </Text>
            </Box>

            <Box style={{ 
              padding: '20px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '12px' }}>
                <Text size="xl">💡</Text>
                <Text weight={600} style={{ color: '#4ecdc4' }}>답안 작성 팁</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                답안은 간단하고 명확한 단어나 구문을 사용하는 것이 좋습니다.
              </Text>
            </Box>
          </Stack>
        </Box>
      )
    },
    {
      title: "❓ 자주 묻는 질문",
      content: (
        <Box style={{ padding: '0' }}>
          <Text size="xl" weight={600} style={{ 
            color: '#ffffff', 
            marginBottom: '32px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(76, 236, 196, 0.3)'
          }}>
            ❓ 자주 묻는 질문
          </Text>
          <Stack gap="lg">
            <Box style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '8px' }}>
                <Text weight={600} style={{ color: '#ff9f43' }}>Q:</Text>
                <Text weight={600} style={{ color: '#ff9f43' }}>방에 들어갈 수 없어요</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <Text component="span" weight={600} style={{ color: '#ff9f43' }}>A:</Text> 방이 가득 찼거나, 비밀번호가 필요한 방일 수 있습니다. 방 정보를 확인해보세요.
              </Text>
            </Box>
            
            <Box style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '8px' }}>
                <Text weight={600} style={{ color: '#ff9f43' }}>Q:</Text>
                <Text weight={600} style={{ color: '#ff9f43' }}>주제를 선택할 수 없어요</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <Text component="span" weight={600} style={{ color: '#ff9f43' }}>A:</Text> 해당 주제의 단어가 5개 미만일 경우 선택할 수 없습니다. 다른 주제를 선택하거나 단어를 추가해주세요.
              </Text>
            </Box>

            <Box style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Group gap="sm" align="center" style={{ marginBottom: '8px' }}>
                <Text weight={600} style={{ color: '#ff9f43' }}>Q:</Text>
                <Text weight={600} style={{ color: '#ff9f43' }}>게임이 시작되지 않아요</Text>
              </Group>
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <Text component="span" weight={600} style={{ color: '#ff9f43' }}>A:</Text> 최소 3명 이상의 플레이어가 필요합니다. 모든 플레이어가 준비 상태인지 확인해보세요.
              </Text>
            </Box>
          </Stack>
        </Box>
      )
    }
  ]

  return (
    <GameModal 
      opened={open} 
      onClose={handleClose}
      title={
        <Group gap="sm" align="center">
          <IconHelp size={24} style={{ color: '#ffffff' }} />
          <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>도움말</Text>
        </Group>
      }
      size="lg"
      styles={{
        content: {
          width: '800px',
          maxWidth: '800px',
          minWidth: '800px',
          maxHeight: '80vh'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: 'none',
          padding: '0 0 24px 0'
        },
        title: {
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      }}
    >
      <Box style={{ 
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {helpPages[currentPage].content}
        
        <Box style={{ marginTop: '24px' }}>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={helpPages.length}
            onPageChange={setCurrentPage}
          />
        </Box>
        
        <Group justify="center" style={{ marginTop: '24px' }}>
          <Button 
            onClick={handleClose}
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan' }}
            size="md"
            style={{
              minWidth: 120,
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            닫기
          </Button>
        </Group>
      </Box>
    </GameModal>
  )
}

export default HelpDialog
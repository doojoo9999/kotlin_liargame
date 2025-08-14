import React, {useState} from 'react'
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material'
import {HelpOutline as HelpIcon} from '@mui/icons-material'
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
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
            🎮 로비 사용법
          </Typography>
          <Box sx={{ '& > div': { mb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🏠</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>방 만들기</Typography>
                <Typography variant="body2" color="text.secondary">
                  새로운 게임 방을 생성합니다. 참가자 수, 라운드 수, 주제, 비밀번호를 설정할 수 있습니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🚪</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>방 입장</Typography>
                <Typography variant="body2" color="text.secondary">
                  기존 방에 참가하거나 진행 중인 게임을 관전할 수 있습니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>➕</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>주제/답안 추가</Typography>
                <Typography variant="body2" color="text.secondary">
                  게임에서 사용할 새로운 주제와 답안을 추가할 수 있습니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🔄</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>새로고침</Typography>
                <Typography variant="body2" color="text.secondary">
                  방 목록을 최신 상태로 업데이트합니다.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      title: "🏠 방 설정 안내",
      content: (
        <Box sx={{ p: 3, bgcolor: '#f0f8ff', borderRadius: 2, border: '1px solid #b3d9ff' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
            🏠 방 설정 안내
          </Typography>
          <Box sx={{ '& > div': { mb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>👥</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>참가자 수</Typography>
                <Typography variant="body2" color="text.secondary">
                  3명~15명까지 설정 가능합니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🔢</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>라운드 수</Typography>
                <Typography variant="body2" color="text.secondary">
                  1~10라운드까지 설정 가능합니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🎯</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>주제 선택</Typography>
                <Typography variant="body2" color="text.secondary">
                  여러 주제를 선택하면 랜덤으로 단어가 나옵니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🎮</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>게임 모드</Typography>
                <Typography variant="body2" color="text.secondary">
                  라이어가 자신의 역할을 아는 모드와 다른 답을 보는 모드가 있습니다.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Box sx={{ fontSize: '1.2rem' }}>🔒</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>비밀방</Typography>
                <Typography variant="body2" color="text.secondary">
                  비밀번호를 설정하여 초대받은 사람만 입장할 수 있습니다.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      title: "📝 주제/답안 관리",
      content: (
        <Box sx={{ p: 3, bgcolor: '#f0fff4', borderRadius: 2, border: '1px solid #90ee90' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
            📝 주제/답안 관리
          </Typography>
          <Box sx={{ '& > div': { mb: 3 } }}>
            <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.2rem' }}>✨</Box>
                주제 추가 가이드
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                새로운 주제를 추가하면 모든 사용자가 사용할 수 있습니다.
              </Typography>
            </Box>
            
            <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.2rem' }}>📋</Box>
                답안 요구사항
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                각 주제에는 최소 5개 이상의 답안이 있어야 게임에서 사용 가능합니다.
              </Typography>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.2rem' }}>💡</Box>
                답안 작성 팁
              </Typography>
              <Typography variant="body2" color="text.secondary">
                답안은 간단하고 명확한 단어나 구문을 사용하는 것이 좋습니다.
              </Typography>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      title: "❓ 자주 묻는 질문",
      content: (
        <Box sx={{ p: 3, bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffcc02' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
            ❓ 자주 묻는 질문
          </Typography>
          <Box sx={{ '& > div': { mb: 2 } }}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f57f17', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.1rem' }}>Q:</Box>
                방에 들어갈 수 없어요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: '#f57f17' }}>A:</Box> 방이 가득 찼거나, 비밀번호가 필요한 방일 수 있습니다. 방 정보를 확인해보세요.
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f57f17', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.1rem' }}>Q:</Box>
                주제를 선택할 수 없어요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: '#f57f17' }}>A:</Box> 해당 주제의 단어가 5개 미만일 경우 선택할 수 없습니다. 다른 주제를 선택하거나 단어를 추가해주세요.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f57f17', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.1rem' }}>Q:</Box>
                게임이 시작되지 않아요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: '#f57f17' }}>A:</Box> 최소 3명 이상의 플레이어가 필요합니다. 모든 플레이어가 준비 상태인지 확인해보세요.
              </Typography>
            </Box>
          </Box>
        </Box>
      )
    }
  ]

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2, 
        pb: 1, 
        textAlign: 'center',
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1
      }}>
        <HelpIcon />
        도움말
      </DialogTitle>
      <DialogContent sx={{ p: 0, minHeight: 400 }}>
        <Box sx={{ 
          transition: 'all 0.3s ease-in-out',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {helpPages[currentPage].content}
          
          <PaginationComponent
            currentPage={currentPage}
            totalPages={helpPages.length}
            onPageChange={setCurrentPage}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button 
          onClick={handleClose}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HelpDialog
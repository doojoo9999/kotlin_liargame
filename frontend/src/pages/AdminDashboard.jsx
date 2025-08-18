import React, {useEffect, useState} from 'react'
import {Button, Container, Paper, Typography, Box} from '../components/ui'
import {
    FileQuestion as QuizIcon,
    LayoutDashboard as DashboardIcon,
    LogOut as LogoutIcon,
    Menu as MenuIcon,
    Monitor as MonitorIcon,
    Shield as AdminIcon
} from 'lucide-react'
import {useNavigate} from 'react-router-dom'
import SubjectWordPage from './SubjectWordPage'
import GameMonitoringPage from './GameMonitoringPage'

const DRAWER_WIDTH = 280

function AdminDashboard() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960)
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('dashboard')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    console.log('[DEBUG_LOG] Admin logout')
    
    // Clear admin session data
    localStorage.removeItem('isUserAdmin')
    localStorage.removeItem('userData')
    
    // Redirect to admin login
    navigate('/admin/login')
  }

  const handleMenuClick = (menuId) => {
    setSelectedMenu(menuId)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const menuItems = [
    {
      id: 'dashboard',
      text: '대시보드',
      icon: <DashboardIcon />,
      description: '전체 현황 및 통계'
    },
    {
      id: 'subjects',
      text: '주제/답안 관리',
      icon: <QuizIcon />,
      description: '게임 주제와 답안을 관리합니다'
    },
    {
      id: 'monitoring',
      text: '게임 모니터링',
      icon: <MonitorIcon />,
      description: '진행 중인 게임을 모니터링합니다'
    }
  ]

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <Container maxWidth="lg" style={{ marginTop: '32px', marginBottom: '32px' }}>
            <Typography variant="h4" style={{ marginBottom: '16px' }}>
              관리자 대시보드
            </Typography>
            <Paper style={{ padding: '24px', marginTop: '24px' }}>
              <Typography variant="h6" style={{ marginBottom: '16px' }}>
                환영합니다!
              </Typography>
              <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                관리자 페이지에 오신 것을 환영합니다. 좌측 메뉴를 통해 다양한 관리 기능을 이용하실 수 있습니다.
              </Typography>
            </Paper>
          </Container>
        )
      case 'subjects':
        return <SubjectWordPage />
      case 'monitoring':
        return <GameMonitoringPage />
      default:
        return null
    }
  }

  const drawer = (
    <>
      {/* Sidebar Header */}
      <Box
        sx={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ff6b6b',
          color: 'white'
        }}
      >
        <AdminIcon size={24} style={{ marginRight: '16px' }} />
        <Typography variant="h6">
          관리자 패널
        </Typography>
      </Box>

      {/* Menu Items */}
      <Box sx={{ paddingTop: '16px' }}>
        {menuItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              padding: '8px 16px',
              margin: '0 8px 8px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: selectedMenu === item.id ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: selectedMenu === item.id ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0,0,0,0.04)'
              }
            }}
            onClick={() => handleMenuClick(item.id)}
          >
            <Box
              sx={{
                marginRight: '12px',
                color: selectedMenu === item.id ? '#ff6b6b' : 'inherit'
              }}
            >
              {item.icon}
            </Box>
            <Box
              sx={{
                flex: 1,
                '& .primary': {
                  fontWeight: selectedMenu === item.id ? 'bold' : 'normal',
                  color: selectedMenu === item.id ? '#ff6b6b' : 'inherit'
                },
                '& .secondary': {
                  fontSize: '0.75rem',
                  color: 'rgba(0,0,0,0.6)'
                }
              }}
            >
              <div className="primary">{item.text}</div>
              <div className="secondary">{item.description}</div>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  )

  return (
    <div style={{ display: 'flex' }}>
      {/* App Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          right: 0,
          height: '64px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1200
        }}
      >
        <button
          onClick={handleDrawerToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            marginRight: '16px',
            '@media (min-width: 960px)': {
              display: 'none'
            }
          }}
        >
          <MenuIcon size={24} />
        </button>
        
        <Typography variant="h6" style={{ flex: 1 }}>
          {menuItems.find(item => item.id === selectedMenu)?.text || '관리자 페이지'}
        </Typography>
        
        <Button
          variant="text"
          onClick={handleLogout}
          style={{
            color: 'white',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <LogoutIcon size={20} />
          로그아웃
        </Button>
      </Box>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1250,
            '@media (min-width: 960px)': {
              display: 'none'
            }
          }}
          onClick={handleDrawerToggle}
        />
      )}

      {/* Navigation Drawer */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${DRAWER_WIDTH}px`,
          height: '100vh',
          backgroundColor: 'white',
          borderRight: '1px solid rgba(0,0,0,0.12)',
          transform: `translateX(${mobileOpen ? 0 : -DRAWER_WIDTH}px)`,
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1300,
          '@media (min-width: 960px)': {
            transform: 'translateX(0)',
            position: 'relative'
          }
        }}
      >
        {drawer}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          marginLeft: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          paddingTop: '64px'
        }}
      >
        {renderContent()}
      </Box>
    </div>
  )
}

export default AdminDashboard
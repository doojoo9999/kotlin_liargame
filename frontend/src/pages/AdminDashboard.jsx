import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {Button, Container, Paper, Typography} from '../components/ui'
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

// Custom styled components
const AppBar = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.$isMobile ? 0 : DRAWER_WIDTH}px;
  right: 0;
  height: 64px;
  background-color: #ff6b6b;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1200;
`

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${DRAWER_WIDTH}px;
  height: 100vh;
  background-color: white;
  border-right: 1px solid rgba(0,0,0,0.12);
  transform: translateX(${props => props.$open ? 0 : -DRAWER_WIDTH}px);
  transition: transform 0.3s ease-in-out;
  z-index: 1300;
  
  @media (min-width: 960px) {
    transform: translateX(0);
    position: relative;
  }
`

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 1250;
  display: ${props => props.$show ? 'block' : 'none'};
  
  @media (min-width: 960px) {
    display: none;
  }
`

const DrawerHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  background-color: #ff6b6b;
  color: white;
`

const MenuList = styled.div`
  padding-top: 16px;
`

const MenuItem = styled.div`
  padding: 8px 16px;
  margin: 0 8px 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  background-color: ${props => props.$selected ? 'rgba(255, 107, 107, 0.1)' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$selected ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0,0,0,0.04)'};
  }
`

const MenuIconContainer = styled.div`
  margin-right: 12px;
  color: ${props => props.$selected ? '#ff6b6b' : 'inherit'};
`

const MenuText = styled.div`
  flex: 1;
  
  .primary {
    font-weight: ${props => props.$selected ? 'bold' : 'normal'};
    color: ${props => props.$selected ? '#ff6b6b' : 'inherit'};
  }
  
  .secondary {
    font-size: 0.75rem;
    color: rgba(0,0,0,0.6);
  }
`

const MainContent = styled.div`
  margin-left: ${props => props.$isMobile ? 0 : DRAWER_WIDTH}px;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 64px;
`

const IconBtn = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  margin-right: 16px;
  
  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
  
  @media (min-width: 960px) {
    display: none;
  }
`

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
      <DrawerHeader>
        <AdminIcon size={24} style={{ marginRight: '16px' }} />
        <Typography variant="h6">
          관리자 패널
        </Typography>
      </DrawerHeader>

      {/* Menu Items */}
      <MenuList>
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            $selected={selectedMenu === item.id}
            onClick={() => handleMenuClick(item.id)}
          >
            <MenuIconContainer $selected={selectedMenu === item.id}>
              {item.icon}
            </MenuIconContainer>
            <MenuText $selected={selectedMenu === item.id}>
              <div className="primary">{item.text}</div>
              <div className="secondary">{item.description}</div>
            </MenuText>
          </MenuItem>
        ))}
      </MenuList>
    </>
  )

  return (
    <div style={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar $isMobile={isMobile}>
        <IconBtn onClick={handleDrawerToggle}>
          <MenuIcon size={24} />
        </IconBtn>
        
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
      </AppBar>

      {/* Mobile Overlay */}
      <DrawerOverlay $show={isMobile && mobileOpen} onClick={handleDrawerToggle} />

      {/* Navigation Drawer */}
      <DrawerContainer $open={mobileOpen}>
        {drawer}
      </DrawerContainer>

      {/* Main Content */}
      <MainContent $isMobile={isMobile}>
        {renderContent()}
      </MainContent>
    </div>
  )
}

export default AdminDashboard
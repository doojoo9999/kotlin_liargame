import React, {useState} from 'react'
import {
    AppBar,
    Box,
    Button,
    Container,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {
    AdminPanelSettings as AdminIcon,
    Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Monitor as MonitorIcon,
    Quiz as QuizIcon
} from '@mui/icons-material'
import {useNavigate} from 'react-router-dom'
import SubjectWordPage from './SubjectWordPage'
import GameMonitoringPage from './GameMonitoringPage'

const DRAWER_WIDTH = 280

function AdminDashboard() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('dashboard')

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    console.log('[DEBUG_LOG] Admin logout')
    
    // Clear admin tokens
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('isUserAdmin')
    
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
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              관리자 대시보드
            </Typography>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                환영합니다!
              </Typography>
              <Typography variant="body1" color="text.secondary">
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
    <Box>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ff6b6b',
          color: 'white'
        }}
      >
        <AdminIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap>
          관리자 패널
        </Typography>
      </Box>

      {/* Menu Items */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedMenu === item.id}
              onClick={() => handleMenuClick(item.id)}
              sx={{
                mx: 1,
                mb: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: selectedMenu === item.id ? '#ff6b6b' : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: selectedMenu === item.id ? 'bold' : 'normal',
                  color: selectedMenu === item.id ? '#ff6b6b' : 'inherit'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: '#ff6b6b'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.id === selectedMenu)?.text || '관리자 페이지'}
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  )
}

export default AdminDashboard
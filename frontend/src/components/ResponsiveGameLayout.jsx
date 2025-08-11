import React, {useState} from 'react'
import {Badge, Box, Collapse, Drawer, Fab, IconButton, Paper, useMediaQuery, useTheme} from '@mui/material'
import {
    Chat as ChatIcon,
    Close as CloseIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    People as PeopleIcon
} from '@mui/icons-material'

const ResponsiveGameLayout = ({
  children,
  chatComponent,
  playersComponent,
  gameInfoComponent,
  centerComponent,
  newMessageCount = 0
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const [playersDrawerOpen, setPlayersDrawerOpen] = useState(false)
  const [gameInfoExpanded, setGameInfoExpanded] = useState(true)

  // Mobile layout
  if (isMobile) {
    return (
      <Box sx={{ height: '100vh', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Game Info - Always visible when chat is open, collapsible otherwise */}
        <Paper 
          elevation={2} 
          sx={{ 
            position: 'relative',
            zIndex: chatDrawerOpen ? 1300 : 1, // Higher z-index when chat is open
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 1 }}>
            <IconButton
              onClick={() => setGameInfoExpanded(!gameInfoExpanded)}
              sx={{ 
                position: 'absolute', 
                right: 8, 
                top: 8,
                zIndex: 2
              }}
              disabled={chatDrawerOpen} // Prevent collapse when chat is open
            >
              {(gameInfoExpanded || chatDrawerOpen) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            
            <Collapse in={gameInfoExpanded || chatDrawerOpen}>
              {gameInfoComponent}
            </Collapse>
            
            {!gameInfoExpanded && !chatDrawerOpen && (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <ExpandMoreIcon color="action" />
              </Box>
            )}
          </Box>
        </Paper>

        {/* Main Game Area */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0
        }}>
          {/* Players positioned around the edges */}
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            p: 1
          }}>
            {children}
          </Box>

          {/* Center component (voting, etc.) */}
          {centerComponent && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 32px)',
              maxWidth: 400,
              zIndex: 2
            }}>
              {centerComponent}
            </Box>
          )}
        </Box>

        {/* Mobile FABs */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          zIndex: 1000
        }}>
          <Fab
            color="primary"
            size="medium"
            onClick={() => setPlayersDrawerOpen(true)}
          >
            <PeopleIcon />
          </Fab>
          
          <Badge badgeContent={newMessageCount} color="error">
            <Fab
              color="secondary"
              size="medium"
              onClick={() => setChatDrawerOpen(true)}
            >
              <ChatIcon />
            </Fab>
          </Badge>
        </Box>

        {/* Chat Drawer */}
        <Drawer
          anchor="bottom"
          open={chatDrawerOpen}
          onClose={() => setChatDrawerOpen(false)}
          PaperProps={{
            sx: {
              height: '50vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ fontWeight: 'bold' }}>채팅</Box>
            <IconButton onClick={() => setChatDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {chatComponent}
          </Box>
        </Drawer>

        {/* Players Drawer */}
        <Drawer
          anchor="right"
          open={playersDrawerOpen}
          onClose={() => setPlayersDrawerOpen(false)}
          PaperProps={{
            sx: { width: '80vw', maxWidth: 300 }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ fontWeight: 'bold' }}>플레이어</Box>
            <IconButton onClick={() => setPlayersDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, p: 2 }}>
            {playersComponent}
          </Box>
        </Drawer>
      </Box>
    )
  }

  // Tablet layout
  if (isTablet) {
    return (
      <Box sx={{ height: '100vh', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Game Info */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
          {gameInfoComponent}
        </Paper>

        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Main Game Area */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            overflow: 'hidden',
            minHeight: 0
          }}>
            {children}
            
            {/* Center component */}
            {centerComponent && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 64px)',
                maxWidth: 600,
                zIndex: 2
              }}>
                {centerComponent}
              </Box>
            )}
          </Box>

          {/* Right Sidebar */}
          <Box sx={{ 
            width: 320, 
            display: 'flex', 
            flexDirection: 'column',
            borderLeft: '1px solid',
            borderColor: 'divider',
            minHeight: 0
          }}>
            {/* Players */}
            <Box sx={{ 
              height: '40%', 
              borderBottom: '1px solid',
              borderColor: 'divider',
              overflow: 'auto'
            }}>
              <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
                플레이어
              </Box>
              <Box sx={{ p: 1 }}>
                {playersComponent}
              </Box>
            </Box>

            {/* Chat */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
                채팅
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {chatComponent}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // Desktop layout (original)
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Game Info */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        {gameInfoComponent}
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Main Game Area */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0
        }}>
          {children}
          
          {/* Center component */}
          {centerComponent && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 128px)',
              maxWidth: 800,
              zIndex: 2
            }}>
              {centerComponent}
            </Box>
          )}
        </Box>

        {/* Right Sidebar */}
        <Box sx={{ 
          width: 400, 
          display: 'flex', 
          flexDirection: 'column',
          borderLeft: '1px solid',
          borderColor: 'divider',
          minHeight: 0
        }}>
          {/* Players */}
          <Box sx={{ 
            height: '35%', 
            borderBottom: '1px solid',
            borderColor: 'divider',
            overflow: 'auto'
          }}>
            <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
              플레이어 ({playersComponent?.props?.players?.length || 0})
            </Box>
            <Box sx={{ p: 1 }}>
              {playersComponent}
            </Box>
          </Box>

          {/* Chat */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
              채팅
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {chatComponent}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ResponsiveGameLayout
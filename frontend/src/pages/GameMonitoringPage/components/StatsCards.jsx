import React from 'react'
import {Box, Card, CardContent, Grid, Typography} from '../../../components/ui'
import {
    Gamepad2 as GamesIcon,
    TrendingUp as TrendingUpIcon,
    User as PersonIcon,
    Users as PeopleIcon
} from 'lucide-react'

const StatCard = React.memo(function StatCard({ icon, title, value, color }) {
  const getColorValue = (colorName) => {
    const colors = {
      primary: '#667eea',
      success: '#4caf50',
      info: '#2196f3',
      warning: '#ff9800'
    }
    return colors[colorName] || '#667eea'
  }

  return (
    <Card>
      <CardContent>
        <Box $display="flex" $alignItems="center">
          {React.cloneElement(icon, { 
            size: 40, 
            color: getColorValue(color),
            style: { marginRight: '16px' }
          })}
          <Box>
            <Typography style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '8px' }}>
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
})

const StatsCards = React.memo(function StatsCards({ stats }) {
  const statsConfig = [
    {
      key: 'totalPlayers',
      icon: <PeopleIcon />,
      title: '현재 접속자',
      value: stats.totalPlayers,
      color: 'primary'
    },
    {
      key: 'activeGames',
      icon: <GamesIcon />,
      title: '진행중인 게임',
      value: stats.activeGames,
      color: 'success'
    },
    {
      key: 'totalGames',
      icon: <TrendingUpIcon />,
      title: '총 게임 수',
      value: stats.totalGames,
      color: 'info'
    },
    {
      key: 'playersInLobby',
      icon: <PersonIcon />,
      title: '로비 대기자',
      value: stats.playersInLobby,
      color: 'warning'
    }
  ]

  return (
    <Grid 
      $columns="repeat(auto-fit, minmax(250px, 1fr))" 
      $gap="24px" 
      style={{ marginBottom: '32px' }}
    >
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          color={stat.color}
        />
      ))}
    </Grid>
  )
})

StatsCards.displayName = 'StatsCards'
export default StatsCards
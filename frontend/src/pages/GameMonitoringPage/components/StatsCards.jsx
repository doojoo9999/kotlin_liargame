import React from 'react'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import {
  Games as GamesIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'

const StatCard = React.memo(function StatCard({ icon, title, value, color }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon, { 
            sx: { fontSize: 40, color: `${color}.main`, mr: 2 } 
          })}
          <Box>
            <Typography color="textSecondary" gutterBottom>
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
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statsConfig.map((stat) => (
        <Grid item xs={12} sm={6} md={3} key={stat.key}>
          <StatCard
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            color={stat.color}
          />
        </Grid>
      ))}
    </Grid>
  )
})

StatsCards.displayName = 'StatsCards'
export default StatsCards
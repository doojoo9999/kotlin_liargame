import React from 'react'
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material'

const GameRulesDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>게임 방법</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              🎯 게임 목표
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              라이어 게임은 <strong>시민</strong>과 <strong>라이어</strong>로 나뉘어 진행되는 추리 게임입니다.<br/>
              • <strong>시민의 목표:</strong> 라이어를 찾아내기<br/>
              • <strong>라이어의 목표:</strong> 정체를 숨기고 주제를 맞히기
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              📋 게임 진행 순서
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>1. 역할 배정</strong><br/>
              • 한 명이 라이어로, 나머지는 시민으로 배정됩니다.<br/>
              • 시민들은 같은 단어를, 라이어는 다른 정보를 받습니다.<br/><br/>
              
              <strong>2. 토론 단계</strong><br/>
              • 각자 돌아가며 주제에 대해 한 마디씩 말합니다.<br/>
              • 라이어는 자신의 정체를 들키지 않도록 주의해야 합니다.<br/>
              • 시민들은 의심스러운 발언을 주의 깊게 들어야 합니다.<br/><br/>
              
              <strong>3. 투표 단계</strong><br/>
              • 토론이 끝나면 누가 라이어인지 투표합니다.<br/>
              • 가장 많은 표를 받은 사람이 라이어로 지목됩니다.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              🏆 승리 조건
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>시민 승리:</strong><br/>
              • 라이어를 정확히 찾아낸 경우<br/><br/>
              
              <strong>라이어 승리:</strong><br/>
              • 라이어로 지목받지 않은 경우<br/>
              • 지목받았지만 주제를 정확히 맞힌 경우
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              🎮 게임 모드
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>1. 라이어가 자신이 라이어인 것을 아는 모드</strong><br/>
              • 라이어는 자신의 역할을 알고 있습니다.<br/>
              • 라이어는 "라이어" 표시를 보고 주제를 추측해야 합니다.<br/><br/>
              
              <strong>2. 라이어가 시민과 다른 답을 보는 모드</strong><br/>
              • 라이어도 단어를 받지만, 시민들과는 다른 단어입니다.<br/>
              • 라이어는 자신이 라이어인지 모르므로 더욱 혼란스러워집니다.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              💡 게임 팁
            </Typography>
            <Typography variant="body2">
              <strong>시민을 위한 팁:</strong><br/>
              • 너무 구체적으로 말하면 라이어에게 힌트를 줄 수 있습니다.<br/>
              • 다른 사람의 발언을 잘 듣고 일관성을 확인하세요.<br/>
              • 의심스러운 사람에게 질문을 던져보세요.<br/><br/>
              
              <strong>라이어를 위한 팁:</strong><br/>
              • 다른 사람의 발언을 잘 듣고 패턴을 파악하세요.<br/>
              • 너무 구체적이지 않은 애매한 표현을 사용하세요.<br/>
              • 시민들 사이의 의견 차이를 이용해보세요.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GameRulesDialog
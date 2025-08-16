import React from 'react'
import {Box, Typography} from '@components/ui'

// Help Dialog Pages Content
export const helpPages = [
  {
    title: "🎮 로비 사용법",
    content: (
      <Box style={{ padding: 24, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          🎮 로비 사용법
        </Typography>
        <Box style={{ '& > div': { marginBottom: 16 } }}>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🏠</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>방 만들기</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                새로운 게임 방을 생성합니다. 참가자 수, 라운드 수, 주제, 비밀번호를 설정할 수 있습니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🚪</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>방 입장</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                기존 방에 참가하거나 진행 중인 게임을 관전할 수 있습니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>➕</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>주제/답안 추가</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                게임에서 사용할 새로운 주제와 답안을 추가할 수 있습니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🔄</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>새로고침</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
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
      <Box style={{ padding: 24, backgroundColor: '#f0f8ff', borderRadius: 8, border: '1px solid #b3d9ff' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          🏠 방 설정 안내
        </Typography>
        <Box style={{ '& > div': { marginBottom: 16 } }}>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>👥</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>참가자 수</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                3명~15명까지 설정 가능합니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🔢</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>라운드 수</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                1~10라운드까지 설정 가능합니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🎯</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>주제 선택</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                여러 주제를 선택하면 랜덤으로 단어가 나옵니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🎮</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>게임 모드</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
                라이어가 자신의 역할을 아는 모드와 다른 답을 보는 모드가 있습니다.
              </Typography>
            </Box>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 16 }}>
            <Box style={{ fontSize: '1.2rem' }}>🔒</Box>
            <Box>
              <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>비밀방</Typography>
              <Typography variant="body2" style={{ color: '#666666' }}>
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
      <Box style={{ padding: 24, backgroundColor: '#f0fff4', borderRadius: 8, border: '1px solid #90ee90' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          📝 주제/답안 관리
        </Typography>
        <Box style={{ '& > div': { marginBottom: 24 } }}>
          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8', marginBottom: 24 }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#2e7d32', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.2rem' }}>✨</Box>
              주제 추가 가이드
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 16, color: '#666666' }}>
              새로운 주제를 추가하면 모든 사용자가 사용할 수 있습니다.
            </Typography>
          </Box>
          
          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8', marginBottom: 24 }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#2e7d32', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.2rem' }}>📋</Box>
              답안 요구사항
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 16, color: '#666666' }}>
              각 주제에는 최소 5개 이상의 답안이 있어야 게임에서 사용 가능합니다.
            </Typography>
          </Box>

          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e8f5e8' }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#2e7d32', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.2rem' }}>💡</Box>
              답안 작성 팁
            </Typography>
            <Typography variant="body2" style={{ color: '#666666' }}>
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
      <Box style={{ padding: 24, backgroundColor: '#fff8e1', borderRadius: 8, border: '1px solid #ffcc02' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          ❓ 자주 묻는 질문
        </Typography>
        <Box style={{ '& > div': { marginBottom: 16 } }}>
          <Box style={{ padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4', marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#f57f17', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.1rem' }}>Q:</Box>
              방에 들어갈 수 없어요
            </Typography>
            <Typography variant="body2" style={{ color: '#666666' }}>
              <span style={{ fontWeight: 600, color: '#f57f17' }}>A:</span> 방이 가득 찼거나, 비밀번호가 필요한 방일 수 있습니다. 방 정보를 확인해보세요.
            </Typography>
          </Box>
          
          <Box style={{ padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4', marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#f57f17', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.1rem' }}>Q:</Box>
              주제를 선택할 수 없어요
            </Typography>
            <Typography variant="body2" style={{ color: '#666666' }}>
              <span style={{ fontWeight: 600, color: '#f57f17' }}>A:</span> 해당 주제의 단어가 5개 미만일 경우 선택할 수 없습니다. 다른 주제를 선택하거나 단어를 추가해주세요.
            </Typography>
          </Box>

          <Box style={{ padding: 16, backgroundColor: 'white', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #fff3c4' }}>
            <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#f57f17', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box style={{ fontSize: '1.1rem' }}>Q:</Box>
              게임이 시작되지 않아요
            </Typography>
            <Typography variant="body2" style={{ color: '#666666' }}>
              <span style={{ fontWeight: 600, color: '#f57f17' }}>A:</span> 최소 3명 이상의 플레이어가 필요합니다. 모든 플레이어가 준비 상태인지 확인해보세요.
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }
]

// Game Rules Dialog Pages Content
export const gameRulesPages = [
  {
    title: "🎯 게임 목표",
    content: (
      <Box style={{ padding: 24, backgroundColor: '#fdf2f8', borderRadius: 8, border: '1px solid #fce7f3' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          🎯 게임 목표
        </Typography>
        <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f3e8ff' }}>
          <Typography variant="body1" style={{ marginBottom: 24, fontWeight: 500, color: '#6b46c1' }}>
            라이어 게임은 <span style={{ fontWeight: 700, color: '#7c3aed' }}>시민</span>과 <span style={{ fontWeight: 700, color: '#dc2626' }}>라이어</span>로 나뉘어 진행되는 추리 게임입니다.
          </Typography>
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <Box style={{ padding: 24, backgroundColor: '#eff6ff', borderRadius: 8, border: '2px solid #3b82f6', textAlign: 'center' }}>
              <Box style={{ fontSize: '2rem', marginBottom: 16 }}>👨‍💼</Box>
              <Typography variant="h6" style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 16 }}>
                시민의 목표
              </Typography>
              <Typography variant="body1" style={{ color: '#1e40af', fontWeight: 500 }}>
                라이어를 찾아내기
              </Typography>
            </Box>
            <Box style={{ padding: 24, backgroundColor: '#fef2f2', borderRadius: 8, border: '2px solid #ef4444', textAlign: 'center' }}>
              <Box style={{ fontSize: '2rem', marginBottom: 16 }}>🎭</Box>
              <Typography variant="h6" style={{ fontWeight: 700, color: '#dc2626', marginBottom: 16 }}>
                라이어의 목표
              </Typography>
              <Typography variant="body1" style={{ color: '#b91c1c', fontWeight: 500 }}>
                정체를 숨기고 주제를 맞히기
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  },
  {
    title: "📋 게임 진행 순서",
    content: (
      <Box style={{ padding: 24, backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <Typography variant="h6" style={{ marginBottom: 24, fontWeight: 600, color: '#1976d2' }}>
          📋 게임 진행 순서
        </Typography>
        <Box style={{ '& > div': { marginBottom: 24 } }}>
          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #dcfce7', marginBottom: 24 }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Box style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>1</Box>
              <Typography variant="h6" style={{ fontWeight: 700, color: '#059669' }}>역할 배정</Typography>
            </Box>
            <Typography variant="body2" style={{ marginLeft: 48, color: '#666666' }}>
              • 한 명이 라이어로, 나머지는 시민으로 배정됩니다.<br/>
              • 시민들은 같은 단어를, 라이어는 다른 정보를 받습니다.
            </Typography>
          </Box>

          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #dcfce7', marginBottom: 24 }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Box style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>2</Box>
              <Typography variant="h6" style={{ fontWeight: 700, color: '#059669' }}>토론 단계</Typography>
            </Box>
            <Typography variant="body2" style={{ marginLeft: 48, color: '#666666' }}>
              • 각자 돌아가며 주제에 대해 한 마디씩 말합니다.<br/>
              • 라이어는 자신의 정체를 들키지 않도록 주의해야 합니다.<br/>
              • 시민들은 의심스러운 발언을 주의 깊게 들어야 합니다.
            </Typography>
          </Box>

          <Box style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #dcfce7' }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Box style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>3</Box>
              <Typography variant="h6" style={{ fontWeight: 700, color: '#059669' }}>투표 단계</Typography>
            </Box>
            <Typography variant="body2" style={{ marginLeft: 48, color: '#666666' }}>
              • 토론이 끝나면 누가 라이어인지 투표합니다.<br/>
              • 가장 많은 표를 받은 사람이 라이어로 지목됩니다.
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  },
  {
    title: "🏆 승리 조건",
    content: (
      <Box sx={{ p: 3, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fde68a' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
          🏆 승리 조건
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #3b82f6' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>👨‍💼</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d4ed8', mb: 3 }}>
                시민 승리
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e40af' }}>
                라이어를 정확히 찾아낸 경우
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #ef4444' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>🎭</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626', mb: 3 }}>
                라이어 승리
              </Typography>
            </Box>
            <Box sx={{ '& > div': { mb: 1 } }}>
              <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#b91c1c' }}>
                  라이어로 지목받지 않은 경우
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#b91c1c' }}>
                  지목받았지만 주제를 정확히 맞힌 경우
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  },
  {
    title: "🎮 게임 모드",
    content: (
      <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
          🎮 게임 모드
        </Typography>
        <Box sx={{ '& > div': { mb: 3 } }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ fontSize: '1.5rem' }}>🎯</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569' }}>
                모드 1: 라이어가 자신이 라이어인 것을 아는 모드
              </Typography>
            </Box>
            <Box sx={{ ml: 4, p: 2, bgcolor: '#f1f5f9', borderRadius: 1, borderLeft: '4px solid #64748b' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 라이어는 자신의 역할을 알고 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 라이어는 "라이어" 표시를 보고 주제를 추측해야 합니다.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ fontSize: '1.5rem' }}>🔀</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569' }}>
                모드 2: 라이어가 시민과 다른 답을 보는 모드
              </Typography>
            </Box>
            <Box sx={{ ml: 4, p: 2, bgcolor: '#f1f5f9', borderRadius: 1, borderLeft: '4px solid #64748b' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 라이어도 단어를 받지만, 시민들과는 다른 단어입니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 라이어는 자신이 라이어인지 모르므로 더욱 혼란스러워집니다.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  },
  {
    title: "💡 게임 팁",
    content: (
      <Box sx={{ p: 3, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fde047' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 600 }}>
          💡 게임 팁
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #3b82f6' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ fontSize: '2rem', mb: 1 }}>👨‍💼</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                시민을 위한 팁
              </Typography>
            </Box>
            <Box sx={{ '& > div': { mb: 2 } }}>
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 1, borderLeft: '3px solid #3b82f6' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e40af' }}>
                  너무 구체적으로 말하면 라이어에게 힌트를 줄 수 있습니다.
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 1, borderLeft: '3px solid #3b82f6' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e40af' }}>
                  다른 사람의 발언을 잘 듣고 일관성을 확인하세요.
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 1, borderLeft: '3px solid #3b82f6' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e40af' }}>
                  의심스러운 사람에게 질문을 던져보세요.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #ef4444' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ fontSize: '2rem', mb: 1 }}>🎭</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#dc2626' }}>
                라이어를 위한 팁
              </Typography>
            </Box>
            <Box sx={{ '& > div': { mb: 2 } }}>
              <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, borderLeft: '3px solid #ef4444' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#b91c1c' }}>
                  다른 사람의 발언을 잘 듣고 패턴을 파악하세요.
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, borderLeft: '3px solid #ef4444' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#b91c1c' }}>
                  너무 구체적이지 않은 애매한 표현을 사용하세요.
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 1, borderLeft: '3px solid #ef4444' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#b91c1c' }}>
                  시민들 사이의 의견 차이를 이용해보세요.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }
]
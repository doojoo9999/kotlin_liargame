
프론트엔드 PlayerEntity ID/UserID 혼용 문제 완전 검토 및 수정 요청 🎯 문제 개요 백엔드에서 PlayerEntity의 id (엔티티 기본키)와 userId (User 테이블 참조 외래키)가 혼용되어 사용되는 문제를 발견하고 수정했습니다. 이와 동일한 문제가 프론트엔드에서도 발생하고 있을 가능성이 매우 높습니다. 🔍 검토해야 할 핵심 개념 player.id: PlayerEntity의 데이터베이스 기본키 (엔티티 식별용) player.userId: User 테이블의 ID를 참조하는 외래키 (실제 사용자 식별용) 올바른 사용: 모든 비즈니스 로직에서는 player.userId를 사용해야 함 📂 우선 검토 대상 파일/폴더 src/features/game/ - 게임 관련 모든 컴포넌트 src/features/chat/ - 채팅 관련 컴포넌트 src/features/room/ - 방 관련 컴포넌트 src/shared/api/ - API 호출 로직 src/shared/stores/ - 상태 관리 로직 src/shared/socket/ - WebSocket 통신 로직 🚨 발견해야 할 문제 패턴들
Player 비교/필터링 오류 // ❌ 잘못된 예시들 players.find(p => p.id === currentPlayerId) players.filter(p => p.id !== accusedPlayerId) player.id === liarPlayerId votingRecord[player.id] = vote
// ✅ 올바른 형태들 players.find(p => p.userId === currentUserId) players.filter(p => p.userId !== accusedUserId) player.userId === liarUserId votingRecord[player.userId] = vote
WebSocket 메시지 처리 오류 // ❌ 잘못된 예시들 convertAndSendToUser(player.id.toString(), ...) socket.emit('action', { playerId: player.id }) if (message.playerId === player.id)
// ✅ 올바른 형태들
convertAndSendToUser(player.userId.toString(), ...) socket.emit('action', { userId: player.userId }) if (message.userId === player.userId)
API 호출 시 잘못된 ID 사용 // ❌ 잘못된 예시들 api.vote(gameId, player.id, target.id) api.submitDefense(gameId, player.id, defense) api.castFinalVote(gameId, player.id, voteForExecution)
// ✅ 올바른 형태들 api.vote(gameId, player.userId, target.userId)
api.submitDefense(gameId, player.userId, defense) api.castFinalVote(gameId, player.userId, voteForExecution)
상태 관리에서의 혼용 // ❌ 잘못된 예시들 const currentPlayer = players.find(p => p.id === sessionUserId) setAccusedPlayer(players.find(p => p.id === accusedPlayerId)) { [player.id]: player.vote }
// ✅ 올바른 형태들 const currentPlayer = players.find(p => p.userId === sessionUserId) setAccusedPlayer(players.find(p => p.userId === accusedUserId)) { [player.userId]: player.vote } 🔧 수행해야 할 작업
전체 프로젝트 스캔 src/ 폴더 내 모든 .tsx, .ts 파일에서 player.id 사용 패턴 검색 playerId, accusedPlayerId, liarPlayerId 등의 변수명 검색 Player 객체와 관련된 비교, 필터링, API 호출 코드 검토
구체적 검색 패턴들
검색해야 할 패턴들
player.id p.id === p.id !== playerId: accusedPlayerId liarPlayerId voterPlayerId { id: player.id } find(.=> ..id filter(.=> ..id
데이터 흐름 분석 백엔드에서 전달받은 Player 데이터의 사용 방식 WebSocket을 통한 실시간 업데이트에서의 Player 식별 투표, 변론, 게임 진행 등 핵심 기능에서의 Player 참조
API 인터페이스 검증 백엔드 API가 userId를 기대하는데 프론트엔드가 player.id를 전송하는 경우 응답 데이터에서 올바른 필드를 사용하고 있는지 확인 📋 검수 체크리스트 ✅ 핵심 기능별 검증 투표 시스템: 투표자와 피투표자 식별이 올바른가? 변론 시스템: 변론자 식별이 정확한가? 채팅 시스템: 메시지 발송자 식별이 정확한가? 게임 진행: 현재 턴 플레이어, 라이어 식별이 정확한가? WebSocket: 실시간 업데이트 대상자 식별이 정확한가? ✅ 타입 안전성 검증 TypeScript 인터페이스에서 Player 타입 정의 확인 API 요청/응답 타입에서 올바른 필드 사용 확인 🎯 작업 원칙
일관성 원칙 모든 비즈니스 로직에서 player.userId 사용 player.id는 오직 React key나 내부 식별용으로만 사용
데이터 무결성 원칙 백엔드와 프론트엔드 간 일관된 식별자 사용 WebSocket 메시지의 정확한 라우팅 보장
완전성 원칙 모든 관련 파일을 빠짐없이 검토 숨겨진 종속성까지 추적하여 수정 🚀 최종 목표 프론트엔드의 모든 Player 관련 로직에서 올바른 식별자 사용 백엔드와 프론트엔드 간 완벽한 데이터 일관성 확보 게임의 모든 기능이 정확한 사용자를 대상으로 동작하도록 보장 프론트엔드 프로젝트 전체를 체계적으로 검토하여 PlayerEntity의 id와 userId 혼용 문제를 완벽히 찾아내고 수정해주시기 바랍니다. 백엔드에서와 마찬가지로 100% 확신할 수 있을 때까지 작업을 반복해서 진행해주세요.
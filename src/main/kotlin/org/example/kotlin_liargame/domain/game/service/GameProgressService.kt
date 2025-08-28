package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.GiveHintRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class GameProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val subjectRepository: SubjectRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val gameProperties: GameProperties,
    @field:Lazy private val votingService: VotingService,
    @field:Lazy private val chatService: org.example.kotlin_liargame.domain.chat.service.ChatService,
    private val sessionService: org.example.kotlin_liargame.global.session.SessionService
) {

    @Transactional
    fun startGame(session: HttpSession): GameStateResponse {
        val nickname = sessionService.getCurrentUserNickname(session)

        val player = playerRepository.findByNickname(nickname)
            ?: throw RuntimeException("게임에 참여하지 않았습니다. 먼저 게임방에 입장해주세요.")

        val game = player.game

        if (game.gameOwner != nickname) {
            throw RuntimeException("게임 시작 권한이 없습니다. 방장만 게임을 시작할 수 있습니다.")
        }

        if (game.gameState != GameState.WAITING) {
            throw RuntimeException("게임이 이미 진행 중이거나 종료되었습니다.")
        }

        val playerCount = playerRepository.countByGame(game)
        if (playerCount < gameProperties.minPlayers || playerCount > gameProperties.maxPlayers) {
            throw RuntimeException("게임을 시작하기 위한 플레이어가 충분하지 않습니다. (최소 ${gameProperties.minPlayers}명, 최대 ${gameProperties.maxPlayers}명)")
        }

        val players = playerRepository.findByGame(game)
        val selectedSubjects = selectSubjects(game)
        assignRolesAndSubjects(game, players, selectedSubjects)

        game.turnOrder = players.shuffled().joinToString(",") { it.nickname }
        game.currentTurnIndex = 0

        game.startGame()
        val savedGame = gameRepository.save(game)

        try {
            println("[GameProgressService] Sending system messages for game ${savedGame.gameNumber}")
            chatService.sendSystemMessage(savedGame, "🎮 게임이 시작되었습니다!")
            chatService.sendSystemMessage(savedGame, "📝 각자 받은 주제에 대한 힌트를 차례대로 말해주세요.")

            when (savedGame.gameMode) {
                GameMode.LIARS_KNOW -> {
                    chatService.sendSystemMessage(savedGame, "🤫 라이어는 자신이 라이어임을 알고 있습니다. 다른 사람들의 힌트를 잘 들어보세요!")
                }
                GameMode.LIARS_DIFFERENT_WORD -> {
                    chatService.sendSystemMessage(savedGame, "🎭 라이어는 다른 주제의 단어를 받았습니다.")
                }
            }

            chatService.sendSystemMessage(savedGame, "⏰ 각 플레이어는 ${gameProperties.turnTimeoutSeconds}초 안에 힌트를 말해야 합니다.")
            println("[GameProgressService] All system messages sent successfully for game ${savedGame.gameNumber}")
        } catch (e: Exception) {
            println("[GameProgressService] ERROR: Could not send system message for game ${savedGame.gameNumber}: ${e.message}")
            e.printStackTrace()
        }

        startNewTurn(savedGame)

        val gameStateResponse = getGameStateResponse(savedGame, session)
        gameMonitoringService.broadcastGameState(savedGame, gameStateResponse)

        return gameStateResponse
    }

    fun startNewTurn(game: GameEntity) {
        val turnOrder = game.turnOrder?.split(',') ?: emptyList()
        if (turnOrder.isEmpty() || game.currentTurnIndex >= turnOrder.size) {
            votingService.startVotingPhase(game)
            return
        }

        val nextPlayerNickname = turnOrder[game.currentTurnIndex]
        val players = playerRepository.findByGame(game)
        val nextPlayer = players.find { it.nickname == nextPlayerNickname }
            ?: throw RuntimeException("Player not found in turn order")

        game.currentPlayerId = nextPlayer.id
        game.turnStartedAt = Instant.now()
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.turnTimeoutSeconds)
        gameRepository.save(game)

        try {
            println("[GameProgressService] Sending turn start message for game ${game.gameNumber}, player: ${nextPlayer.nickname}")
            chatService.sendSystemMessage(game, "🎯 ${nextPlayer.nickname}님의 차례입니다! 힌트를 말해주세요. (${gameProperties.turnTimeoutSeconds}초)")
            println("[GameProgressService] Turn start message sent successfully")
        } catch (e: Exception) {
            println("[GameProgressService] ERROR: Could not send turn start message for game ${game.gameNumber}: ${e.message}")
            e.printStackTrace()
        }

        gameMonitoringService.notifyTurnChanged(game.gameNumber, nextPlayer.id, game.turnStartedAt!!)
    }

    @Transactional
    fun forceNextTurn(gameId: Long) {
        val game = gameRepository.findById(gameId).orElse(null) ?: return
        
        game.currentPlayerId?.let {
            val currentPlayer = playerRepository.findById(it).orElse(null)
            if (currentPlayer != null && currentPlayer.state == PlayerState.WAITING_FOR_HINT) {
                currentPlayer.state = PlayerState.GAVE_HINT
                playerRepository.save(currentPlayer)

                // 타임아웃으로 턴이 넘어갔다는 메시지 전송
                try {
                    chatService.sendSystemMessage(game, "⏰ ${currentPlayer.nickname}님의 시간이 초과되어 다음 차례로 넘어갑니다.")
                } catch (e: Exception) {
                    println("[GameProgressService] ERROR: Could not send timeout message: ${e.message}")
                }
            }
        }
        
        // 다음 턴 시작
        startNewTurn(game)

        // 업데이트된 게임 상태를 모든 플레이어에게 브로드캐스트
        val gameStateResponse = getGameStateResponse(game, null)
        gameMonitoringService.broadcastGameState(game, gameStateResponse)
    }

    private fun selectSubjects(game: GameEntity): List<SubjectEntity> {
        if (game.citizenSubject != null) {
            val subjects = mutableListOf(game.citizenSubject!!)
            if (game.liarSubject != null && game.liarSubject != game.citizenSubject) {
                subjects.add(game.liarSubject!!)
            }
            return subjects
        }
        
        val approvedSubjects = subjectRepository.findByStatus(org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED)
        val validSubjects = approvedSubjects.filter { subject ->
            subject.word.count { word -> word.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED } >= 5
        }

        if (validSubjects.size < 2) {
            throw IllegalStateException("There are not enough approved subjects with at least 5 approved words to start a game.")
        }

        return validSubjects.shuffled().take(2)
    }

    private fun assignRolesAndSubjects(
        game: GameEntity,
        players: List<PlayerEntity>,
        subjects: List<SubjectEntity>
    ) {
        if (subjects.isEmpty()) {
            throw RuntimeException("No subjects available for assignment")
        }

        val citizenSubject = subjects.first()
        game.citizenSubject = citizenSubject
        val liarSubject = if (subjects.size > 1) subjects[1] else citizenSubject
        game.liarSubject = liarSubject

        val liarCount = game.gameLiarCount.coerceAtMost(players.size - 1)
        val liarIndices = players.indices.shuffled().take(liarCount).toSet()

        // 시민용 단어 선택 (한 게임에서 모든 시민은 같은 단어를 받음)
        val citizenWords = citizenSubject.word.filter {
            it.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED
        }
        val selectedCitizenWord = citizenWords.randomOrNull()?.content ?: citizenSubject.content

        // 라이어용 단어 선택 (다른 주제 모드일 때)
        val liarWords = liarSubject.word.filter {
            it.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED
        }
        val selectedLiarWord = liarWords.randomOrNull()?.content ?: liarSubject.content

        players.forEachIndexed { index, player ->
            player.role = if (liarIndices.contains(index)) PlayerRole.LIAR else PlayerRole.CITIZEN
            player.subject = when {
                player.role == PlayerRole.CITIZEN -> citizenSubject
                game.gameMode == GameMode.LIARS_DIFFERENT_WORD -> liarSubject
                else -> citizenSubject
            }

            // 플레이어별 할당된 단어 저장 (hint 필드 재활용)
            player.assignedWord = when {
                player.role == PlayerRole.CITIZEN -> selectedCitizenWord
                game.gameMode == GameMode.LIARS_DIFFERENT_WORD -> selectedLiarWord
                else -> null // 라이어인 것을 아는 모드에서는 단어를 받지 않음
            }

            player.state = PlayerState.WAITING_FOR_HINT
        }
        playerRepository.saveAll(players)
    }

    @Transactional
    fun giveHint(req: GiveHintRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        val userId = sessionService.getCurrentUserId(session)

        // Check if it's the player's turn
        val currentPlayer = playerRepository.findById(game.currentPlayerId ?: 0).orElse(null)
        if (currentPlayer?.userId != userId) {
            throw RuntimeException("It's not your turn")
        }

        markPlayerAsSpoken(req.gameNumber, userId)
        gameMonitoringService.notifyHintSubmitted(req.gameNumber, userId, req.hint)
        
        // Advance turn
        game.currentTurnIndex++
        gameRepository.save(game)

        // Start next turn and get updated game state
        startNewTurn(game)

        val gameStateResponse = getGameStateResponse(game, session)
        // Broadcast the updated game state to all players
        gameMonitoringService.broadcastGameState(game, gameStateResponse)

        return gameStateResponse
    }

    @Transactional
    fun restartSpeechPhase(game: GameEntity) {
        // Reset player states and votes for a new speech round
        val players = playerRepository.findByGame(game)
        players.forEach { player ->
            if (player.isAlive) {
                player.state = PlayerState.WAITING_FOR_HINT
                player.votesReceived = 0
                player.votedFor = null
            }
        }
        playerRepository.saveAll(players)

        // Reset turn order to start from the beginning of round
        game.currentTurnIndex = 0
        gameRepository.save(game)

        // Start new turn (which will be first player's speech)
        startNewTurn(game)
    }

    @Transactional
    fun markPlayerAsSpoken(gameNumber: Int, userId: Long): PlayerEntity {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from game")
        }

        if (player.state != PlayerState.WAITING_FOR_HINT) {
            throw RuntimeException("You have already spoken or are not in hint phase")
        }

        player.state = PlayerState.GAVE_HINT
        return playerRepository.save(player)
    }

    private fun getGameStateResponse(game: GameEntity, session: HttpSession?): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = sessionService.getOptionalUserId(session)
        val turnOrder = game.turnOrder?.split(',')

        return GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = currentUserId,
            currentPhase = game.currentPhase,
            turnOrder = turnOrder,
            currentTurnIndex = game.currentTurnIndex,
            phaseEndTime = game.phaseEndTime?.toString()
        )
    }
}

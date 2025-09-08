import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Award, Crown, Eye, EyeOff, Medal, Star, Target, TrendingUp, Trophy} from "lucide-react"
import {Avatar, AvatarFallback} from "@radix-ui/react-avatar"

import {cn} from "@/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {GameButton} from "@/components/ui/game-button"
import type {GameResults, Player} from "@/types/game"

export interface ScoreBoardProps {
  players: Player[]
  gameResults?: GameResults
  finalScores?: Record<string, number>
  showRoundResults?: boolean
  showFinalResults?: boolean
  onNextRound?: () => void
  onPlayAgain?: () => void
  onLeaveGame?: () => void
  className?: string
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-yellow-500" />
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />
    case 3:
      return <Award className="w-6 h-6 text-amber-600" />
    default:
      return <Star className="w-6 h-6 text-blue-500" />
  }
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "from-yellow-400 to-yellow-600"
    case 2:
      return "from-gray-300 to-gray-500"
    case 3:
      return "from-amber-400 to-amber-600"
    default:
      return "from-blue-400 to-blue-600"
  }
}

const PlayerScoreCard: React.FC<{
  player: Player
  rank: number
  score: number
  isLiar?: boolean
  votes?: number
  isWinner?: boolean
  delay?: number
}> = ({ player, rank, score, isLiar, votes, isWinner, delay = 0 }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
        delay
      }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { type: "spring" as const, stiffness: 400, damping: 17 }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cn(
        "relative overflow-hidden",
        rank === 1 && "order-first"
      )}
    >
      <Card className={cn(
        "border-2 transition-all duration-300 hover:shadow-lg",
        rank === 1 && "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
        rank === 2 && "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20",
        rank === 3 && "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
        isWinner && "ring-2 ring-green-400 ring-offset-2"
      )}>
        {/* Winner Badge */}
        <AnimatePresence>
          {isWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg z-10"
            >
              <Crown className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rank Badge */}
        <div className="absolute -top-3 -left-3 z-10">
          <div className={cn(
            "w-10 h-10 bg-gradient-to-r rounded-full flex items-center justify-center shadow-lg border-2 border-white",
            getRankColor(rank)
          )}>
            <span className="text-white font-bold text-sm">#{rank}</span>
          </div>
        </div>

        <CardContent className="p-6 text-center">
          {/* Avatar */}
          <div className="mb-4">
            <Avatar className="w-16 h-16 mx-auto ring-4 ring-white shadow-lg">
              <AvatarFallback className={cn(
                "text-white font-bold text-xl bg-gradient-to-br",
                getRankColor(rank)
              )}>
                {player.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Player Info */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {player.nickname}
            </h3>

            {/* Role Badge */}
            <div className="flex justify-center">
              {isLiar ? (
                <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                  <EyeOff className="w-4 h-4" />
                  <span>Liar</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  <span>Civilian</span>
                </div>
              )}
            </div>

            {/* Score */}
            <div className="py-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.5, type: "spring", stiffness: 300 }}
                className="text-3xl font-black text-gray-900 dark:text-gray-100"
              >
                {score}
              </motion.div>
              <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
            </div>

            {/* Vote Count */}
            {typeof votes === 'number' && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{votes} votes received</span>
                </div>
              </div>
            )}
          </div>

          {/* Rank Icon */}
          <div className="mt-4 flex justify-center">
            {getRankIcon(rank)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const VoteResultsSection: React.FC<{
  gameResults: GameResults
  players: Player[]
}> = ({ gameResults }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-300">
            <Target className="w-5 h-5" />
            <span>Voting Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Topic Display */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">The topic was:</div>
              <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                "{gameResults.topic}"
              </div>
            </div>

            {/* Liar Reveal */}
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400 mb-1">The liar was:</div>
              <div className="text-xl font-bold text-red-800 dark:text-red-200">
                {gameResults.liarName}
              </div>
              <div className={cn(
                "mt-2 text-lg font-medium",
                gameResults.liarWon 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-green-600 dark:text-green-400"
              )}>
                {gameResults.liarWon ? "Liar Wins! 🎭" : "Civilians Win! 👥"}
              </div>
            </div>

            {/* Vote Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameResults.votes
                .sort((a, b) => b.votes - a.votes)
                .map((vote, index) => (
                  <motion.div
                    key={vote.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-3 rounded-lg border-2",
                      vote.playerId === gameResults.liarId 
                        ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 bg-gray-50 dark:bg-gray-800/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{vote.playerName}</span>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span className="font-bold">{vote.votes}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {vote.votes} vote{vote.votes !== 1 ? 's' : ''}
                    </div>
                  </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  gameResults,
  finalScores,
  showRoundResults = false,
  showFinalResults = false,
  onNextRound,
  onPlayAgain,
  onLeaveGame,
  className
}) => {
  const scoredPlayers = React.useMemo(() => {
    return players
      .map(player => ({
        ...player,
        score: finalScores?.[player.id] || player.score || 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))
  }, [players, finalScores])

  const winner = scoredPlayers[0]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("w-full max-w-6xl mx-auto space-y-8", className)}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {showFinalResults ? "Final Results" : "Round Results"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {showFinalResults ? "Game completed!" : "Round completed!"}
        </p>
      </motion.div>

      {/* Vote Results */}
      {showRoundResults && gameResults && (
        <VoteResultsSection gameResults={gameResults} players={players} />
      )}

      {/* Scores Section */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300 text-2xl">
            <TrendingUp className="w-6 h-6" />
            <span>{showFinalResults ? "Final Standings" : "Current Standings"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Winner Announcement */}
          {showFinalResults && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8 p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border-2 border-yellow-300"
            >
              <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                🎉 {winner.nickname} Wins! 🎉
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 text-lg">
                With {winner.score} points
              </p>
            </motion.div>
          )}

          {/* Player Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scoredPlayers.map((player, index) => (
              <PlayerScoreCard
                key={player.id}
                player={player}
                rank={player.rank}
                score={player.score}
                isLiar={gameResults?.liarId === player.id}
                votes={gameResults?.votes.find(v => v.playerId === player.id)?.votes}
                isWinner={showFinalResults && player.rank === 1}
                delay={index * 0.1}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        {!showFinalResults && onNextRound && (
          <GameButton
            variant="primary"
            size="lg"
            onClick={onNextRound}
          >
            Next Round
          </GameButton>
        )}

        {showFinalResults && onPlayAgain && (
          <GameButton
            variant="success"
            size="lg"
            onClick={onPlayAgain}
          >
            Play Again
          </GameButton>
        )}

        {onLeaveGame && (
          <GameButton
            variant="secondary"
            size="lg"
            onClick={onLeaveGame}
          >
            Leave Game
          </GameButton>
        )}
      </motion.div>
    </motion.div>
  )
}
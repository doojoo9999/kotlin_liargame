import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {CheckCircle2, Eye, MessageSquare, Target, Trophy, Users, Vote} from "lucide-react"

import {cn} from "@/lib/utils"
import {Card, CardContent} from "@/components/ui/card"
import {Progress} from "@/components/ui/progress"
import type {RoundInfo, RoundPhase} from "@/types/game"

export interface RoundIndicatorProps {
  roundInfo: RoundInfo
  className?: string
  showProgress?: boolean
  showPhaseDetails?: boolean
  variant?: 'default' | 'compact' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

const phaseConfig = {
  waiting: {
    label: "Waiting for Players",
    description: "Players are joining the game",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
    step: 0
  },
  topic_reveal: {
    label: "Topic Revealed",
    description: "The secret topic has been shared",
    icon: Eye,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
    step: 1
  },
  discussion: {
    label: "Discussion Phase",
    description: "Players are discussing the topic",
    icon: MessageSquare,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    step: 2
  },
  voting: {
    label: "Voting Phase",
    description: "Vote for who you think is the liar",
    icon: Vote,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    step: 3
  },
  results: {
    label: "Round Results",
    description: "Revealing the results",
    icon: Target,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    step: 4
  },
  finished: {
    label: "Game Complete",
    description: "The game has ended",
    icon: Trophy,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    borderColor: "border-gray-300 dark:border-gray-700",
    step: 5
  }
}

const gamePhases: RoundPhase[] = ['waiting', 'topic_reveal', 'discussion', 'voting', 'results', 'finished']

const PhaseStep: React.FC<{
  phase: RoundPhase
  isActive: boolean
  isCompleted: boolean
  isFirst?: boolean
  isLast?: boolean
  size?: 'sm' | 'md' | 'lg'
}> = ({ phase, isActive, isCompleted, isLast, size = 'md' }) => {
  const config = phaseConfig[phase]
  const PhaseIcon = config.icon

  const sizeClasses = {
    sm: { 
      circle: "w-8 h-8", 
      icon: "w-3 h-3", 
      text: "text-xs",
      connector: "h-0.5"
    },
    md: { 
      circle: "w-10 h-10", 
      icon: "w-4 h-4", 
      text: "text-sm",
      connector: "h-1"
    },
    lg: { 
      circle: "w-12 h-12", 
      icon: "w-5 h-5", 
      text: "text-base",
      connector: "h-1"
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center space-y-2">
        {/* Circle Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: isActive ? 1.1 : 1,
            opacity: isActive || isCompleted ? 1 : 0.5
          }}
          className={cn(
            classes.circle,
            "rounded-full flex items-center justify-center border-2 transition-all duration-300",
            isActive && "ring-2 ring-offset-2 ring-current",
            isCompleted && "bg-green-500 border-green-500 text-white",
            !isCompleted && !isActive && "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500",
            !isCompleted && isActive && `${config.bgColor} ${config.borderColor} ${config.color}`
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className={classes.icon} />
          ) : (
            <PhaseIcon className={classes.icon} />
          )}
        </motion.div>

        {/* Phase Label */}
        <div className={cn(
          classes.text,
          "font-medium text-center max-w-20 leading-tight",
          isActive && config.color,
          isCompleted && "text-green-600 dark:text-green-400",
          !isActive && !isCompleted && "text-gray-500 dark:text-gray-400"
        )}>
          {config.label}
        </div>
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className={cn(
          "flex-1 mx-2",
          classes.connector,
          isCompleted ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
        )} />
      )}
    </div>
  )
}

export const RoundIndicator: React.FC<RoundIndicatorProps> = ({
  roundInfo,
  className,
  showProgress = true,
  showPhaseDetails = true,
  variant = 'default',
  size = 'md'
}) => {
  const currentPhaseConfig = phaseConfig[roundInfo.phase]
  const PhaseIcon = currentPhaseConfig.icon
  
  const currentStep = phaseConfig[roundInfo.phase].step
  const totalSteps = gamePhases.length - 1 // excluding 'finished' from progress
  const progressValue = (currentStep / totalSteps) * 100

  const containerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className={cn("flex items-center space-x-2", className)}
      >
        <div className={cn("p-2 rounded-lg", currentPhaseConfig.bgColor)}>
          <PhaseIcon className={cn("w-4 h-4", currentPhaseConfig.color)} />
        </div>
        <div>
          <div className="font-medium text-sm">
            Round {roundInfo.current}/{roundInfo.total}
          </div>
          <div className={cn("text-xs", currentPhaseConfig.color)}>
            {currentPhaseConfig.label}
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className={cn("w-full", className)}
      >
        <Card className={cn("border-2", currentPhaseConfig.borderColor)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={cn("p-2 rounded-lg", currentPhaseConfig.bgColor)}>
                  <PhaseIcon className={cn("w-5 h-5", currentPhaseConfig.color)} />
                </div>
                <div>
                  <h3 className={cn("font-bold text-sm", currentPhaseConfig.color)}>
                    {currentPhaseConfig.label}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Round {roundInfo.current} of {roundInfo.total}
                  </p>
                </div>
              </div>
            </div>

            {showProgress && (
              <Progress value={progressValue} className="h-2" />
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Default variant - Full featured
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn("w-full max-w-4xl mx-auto", className)}
    >
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardContent className="p-6">
          {/* Round Header */}
          <div className="text-center mb-6">
            <motion.h2
              key={roundInfo.current}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              Round {roundInfo.current} of {roundInfo.total}
            </motion.h2>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={roundInfo.phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center space-x-2"
              >
                <div className={cn("p-2 rounded-full", currentPhaseConfig.bgColor)}>
                  <PhaseIcon className={cn("w-5 h-5", currentPhaseConfig.color)} />
                </div>
                <div>
                  <h3 className={cn("font-bold text-lg", currentPhaseConfig.color)}>
                    {currentPhaseConfig.label}
                  </h3>
                  {showPhaseDetails && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentPhaseConfig.description}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Topic Display */}
            <AnimatePresence>
              {roundInfo.topic && roundInfo.phase !== 'waiting' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    Today's topic:
                  </div>
                  <div className="font-bold text-lg text-blue-800 dark:text-blue-200">
                    "{roundInfo.topic}"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Phase Progress Bar */}
          <div className="space-y-4">
            {/* Visual Progress Steps */}
            <div className="flex items-center justify-between px-2">
              {gamePhases.slice(0, -1).map((phase, index) => (
                <PhaseStep
                  key={phase}
                  phase={phase}
                  isActive={phase === roundInfo.phase}
                  isCompleted={phaseConfig[phase].step < currentStep}
                  isFirst={index === 0}
                  isLast={index === gamePhases.length - 2}
                  size={size}
                />
              ))}
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="space-y-2">
                <Progress value={progressValue} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Game Start</span>
                  <span>{Math.round(progressValue)}% Complete</span>
                  <span>Round End</span>
                </div>
              </div>
            )}
          </div>

          {/* Phase Instructions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={roundInfo.phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center space-x-2 mb-2">
                <PhaseIcon className={cn("w-4 h-4", currentPhaseConfig.color)} />
                <span className="font-medium text-sm">What happens now:</span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {getPhaseInstructions(roundInfo.phase)}
              </p>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function getPhaseInstructions(phase: RoundPhase): string {
  switch (phase) {
    case 'waiting':
      return "Waiting for all players to join and ready up. The game will start once everyone is ready."
    case 'topic_reveal':
      return "The secret topic has been revealed to all civilian players. The liar doesn't know the topic and must try to blend in."
    case 'discussion':
      return "Discuss the topic with other players. Try to figure out who doesn't know what you're talking about, but don't be too obvious if you're the liar!"
    case 'voting':
      return "Time to vote! Choose who you think is the liar. The player with the most votes will be eliminated."
    case 'results':
      return "The votes are in! See who was voted out and whether the liar was caught or managed to fool everyone."
    case 'finished':
      return "The game is complete! Check the final scores and see who performed the best across all rounds."
    default:
      return "Get ready for the next phase of the game!"
  }
}
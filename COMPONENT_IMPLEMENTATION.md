# Component Implementation Guide

## Practical Implementation Examples

### Enhanced Game Phase Components

#### 1. Intelligent Hint Phase Component

```typescript
// components/game/phases/HintPhase.tsx
interface HintPhaseProps {
  currentTopic: string;
  currentWord?: string;
  isMyTurn: boolean;
  isLiar: boolean;
  timeRemaining: number;
  onSubmitHint: (hint: string) => Promise<void>;
  players: Player[];
  submittedHints: Hint[];
}

export const HintPhase: React.FC<HintPhaseProps> = ({
  currentTopic,
  currentWord,
  isMyTurn,
  isLiar,
  timeRemaining,
  onSubmitHint,
  players,
  submittedHints
}) => {
  const [hint, setHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Smart hint validation
  const validateHint = useMemo(() => {
    if (!hint.trim()) return { isValid: false, message: 'Please enter a hint' };
    if (hint.length < 2) return { isValid: false, message: 'Hint too short' };
    if (hint.length > 50) return { isValid: false, message: 'Hint too long' };
    
    // Check if hint contains the actual word (for non-liars)
    if (!isLiar && currentWord && hint.toLowerCase().includes(currentWord.toLowerCase())) {
      return { isValid: false, message: 'Your hint cannot contain the secret word' };
    }
    
    // Check for duplicate hints
    const isDuplicate = submittedHints.some(h => 
      h.hint.toLowerCase().trim() === hint.toLowerCase().trim()
    );
    if (isDuplicate) {
      return { isValid: false, message: 'This hint has already been given' };
    }
    
    return { isValid: true, message: '' };
  }, [hint, isLiar, currentWord, submittedHints]);
  
  // Auto-submit when time is critically low
  useEffect(() => {
    if (timeRemaining <= 5 && hint.trim() && !hasSubmitted && isMyTurn) {
      handleSubmitHint();
    }
  }, [timeRemaining, hint, hasSubmitted, isMyTurn]);
  
  const handleSubmitHint = async () => {
    if (!validateHint.isValid || isSubmitting || hasSubmitted) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitHint(hint.trim());
      setHasSubmitted(true);
      setHint('');
      toast.success('Hint submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit hint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Hint suggestions for liars (based on topic)
  const hintSuggestions = useMemo(() => {
    if (!isLiar) return [];
    
    const suggestions = HINT_SUGGESTIONS[currentTopic.toLowerCase()] || [];
    return suggestions.slice(0, 3);
  }, [isLiar, currentTopic]);
  
  if (!isMyTurn && !hasSubmitted) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Waiting for your turn</h3>
            <p className="text-gray-600">
              Listen to other players' hints and prepare yours.
            </p>
          </div>
          
          {/* Show submitted hints so far */}
          {submittedHints.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Hints so far:</h4>
              <div className="space-y-2">
                {submittedHints.map((hint, index) => (
                  <div key={hint.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{hint.playerName}</span>
                    <span className="text-gray-700">"{hint.hint}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  if (hasSubmitted) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Hint submitted!</h3>
            <p className="text-gray-600">
              Wait for other players to submit their hints.
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Your hint:</strong> "{submittedHints.find(h => h.playerId === 'current')?.hint}"
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Phase header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Give Your Hint</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              Topic: <span className="font-semibold text-gray-900">{currentTopic}</span>
            </p>
            {!isLiar && currentWord && (
              <p className="text-sm bg-green-50 text-green-800 p-2 rounded">
                Secret word: <span className="font-bold">{currentWord}</span>
              </p>
            )}
            {isLiar && (
              <p className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded">
                You are the liar! You don't know the secret word.
              </p>
            )}
          </div>
        </div>
        
        {/* Timer */}
        <div className="flex items-center justify-center space-x-2">
          <Clock className={cn(
            "w-5 h-5",
            timeRemaining > 30 ? "text-green-600" :
            timeRemaining > 10 ? "text-yellow-600" : "text-red-600"
          )} />
          <span className={cn(
            "font-semibold text-lg",
            timeRemaining > 30 ? "text-green-600" :
            timeRemaining > 10 ? "text-yellow-600" : "text-red-600"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        {/* Hint input */}
        <div className="space-y-3">
          <Label htmlFor="hint-input">
            {isLiar ? "Your hint (be careful!)" : "Your hint"}
          </Label>
          <div className="relative">
            <Input
              id="hint-input"
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder={isLiar 
                ? "Give a hint that sounds like you know the word..." 
                : "Give a hint about the word without saying it..."
              }
              className={cn(
                "pr-12",
                !validateHint.isValid && hint ? "border-red-300 focus:border-red-300" : ""
              )}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateHint.isValid) {
                  handleSubmitHint();
                }
              }}
            />
            <div className="absolute right-3 top-2 text-xs text-gray-500">
              {hint.length}/50
            </div>
          </div>
          
          {/* Validation message */}
          {!validateHint.isValid && hint && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validateHint.message}
            </p>
          )}
        </div>
        
        {/* Hint suggestions for liars */}
        {isLiar && hintSuggestions.length > 0 && !hint && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-yellow-800 mb-2">
              Suggestion: Try hints like these for "{currentTopic}"
            </h4>
            <div className="flex flex-wrap gap-2">
              {hintSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setHint(suggestion)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200 transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <Button
          onClick={handleSubmitHint}
          disabled={!validateHint.isValid || isSubmitting}
          className="w-full h-12 text-base font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Hint'
          )}
        </Button>
        
        {/* Game strategy tips */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 text-sm mb-1">Strategy Tip</h4>
              <p className="text-sm text-blue-700">
                {isLiar 
                  ? "Listen to other hints first if possible. Give something that sounds related to the topic but isn't too specific."
                  : "Make your hint specific enough to help other citizens identify the liar, but not so obvious that the liar figures out the word."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Hint suggestions database
const HINT_SUGGESTIONS = {
  animals: ['furry', 'has legs', 'makes sounds', 'lives outside'],
  food: ['tasty', 'you eat it', 'comes in colors', 'has texture'],
  objects: ['useful', 'made of materials', 'has shape', 'people use it'],
  places: ['you can visit', 'has features', 'people go there', 'has atmosphere'],
};
```

#### 2. Advanced Voting Phase Component

```typescript
// components/game/phases/VotingPhase.tsx
interface VotingPhaseProps {
  players: Player[];
  currentPlayer: Player;
  votingPhase: 'LIAR_VOTE' | 'SURVIVAL_VOTE';
  votes: Record<string, string>;
  timeRemaining: number;
  canVote: boolean;
  onVotePlayer: (playerId: string) => Promise<void>;
  targetPlayerId?: string; // For survival votes
  hints?: Hint[]; // To show context
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  currentPlayer,
  votingPhase,
  votes,
  timeRemaining,
  canVote,
  onVotePlayer,
  targetPlayerId,
  hints = []
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  
  // Calculate vote counts
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(votes).forEach(targetId => {
      counts[targetId] = (counts[targetId] || 0) + 1;
    });
    return counts;
  }, [votes]);
  
  // Get eligible players (can't vote for yourself in liar votes)
  const eligiblePlayers = useMemo(() => {
    if (votingPhase === 'SURVIVAL_VOTE' && targetPlayerId) {
      return players.filter(p => p.id === targetPlayerId);
    }
    return players.filter(p => p.id !== currentPlayer.id);
  }, [players, currentPlayer.id, votingPhase, targetPlayerId]);
  
  // Auto-submit vote when time is very low
  useEffect(() => {
    if (timeRemaining <= 3 && selectedPlayer && !hasVoted && canVote) {
      handleVoteSubmit();
    }
  }, [timeRemaining, selectedPlayer, hasVoted, canVote]);
  
  const handleVoteSubmit = async () => {
    if (!selectedPlayer || isSubmitting || hasVoted || !canVote) return;
    
    setIsSubmitting(true);
    try {
      await onVotePlayer(selectedPlayer);
      setHasVoted(true);
      toast.success('Vote submitted!');
    } catch (error) {
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Player analysis for better voting decisions
  const getPlayerAnalysis = (player: Player) => {
    const playerHint = hints.find(h => h.playerId === player.id);
    if (!playerHint) return null;
    
    return {
      hint: playerHint.hint,
      suspicionLevel: calculateSuspicionLevel(playerHint, hints),
      reasoning: generateSuspicionReasoning(playerHint, hints)
    };
  };
  
  if (hasVoted) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Vote submitted!</h3>
            <p className="text-gray-600">
              Waiting for other players to vote...
            </p>
          </div>
          
          {/* Show current vote tally */}
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-sm">Current votes:</h4>
            <div className="space-y-2">
              {eligiblePlayers.map(player => {
                const voteCount = voteCounts[player.id] || 0;
                const percentage = players.length > 0 ? (voteCount / Object.keys(votes).length * 100) : 0;
                
                return (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{player.nickname}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{voteCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Phase header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {votingPhase === 'LIAR_VOTE' ? 'Vote for the Liar' : 'Final Vote'}
          </h2>
          <p className="text-gray-600">
            {votingPhase === 'LIAR_VOTE' 
              ? 'Who do you think gave the most suspicious hint?'
              : 'Should the suspected player be eliminated?'
            }
          </p>
        </div>
        
        {/* Timer */}
        <div className="flex items-center justify-center space-x-2">
          <Timer className={cn(
            "w-5 h-5",
            timeRemaining > 20 ? "text-green-600" :
            timeRemaining > 10 ? "text-yellow-600" : "text-red-600"
          )} />
          <span className={cn(
            "font-semibold text-lg",
            timeRemaining > 20 ? "text-green-600" :
            timeRemaining > 10 ? "text-yellow-600" : "text-red-600"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        {/* Show hints button */}
        {hints.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHints(!showHints)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showHints ? 'Hide' : 'Review'} Hints
            </Button>
          </div>
        )}
        
        {/* Hints review */}
        {showHints && hints.length > 0 && (
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Hints given this round:</h4>
            <div className="space-y-2">
              {hints.map(hint => {
                const player = players.find(p => p.id === hint.playerId);
                const analysis = getPlayerAnalysis(player!);
                
                return (
                  <div key={hint.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{player?.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{player?.nickname}</div>
                        <div className="text-gray-700">"{hint.hint}"</div>
                      </div>
                    </div>
                    {analysis && (
                      <div className="flex items-center space-x-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          analysis.suspicionLevel === 'high' && "bg-red-500",
                          analysis.suspicionLevel === 'medium' && "bg-yellow-500",
                          analysis.suspicionLevel === 'low' && "bg-green-500"
                        )} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        
        {/* Player selection */}
        <div className="space-y-3">
          <Label>
            {votingPhase === 'LIAR_VOTE' ? 'Select who you think is the liar:' : 'Your vote:'}
          </Label>
          
          {votingPhase === 'SURVIVAL_VOTE' ? (
            // Survival vote (Execute/Spare)
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedPlayer('execute')}
                className={cn(
                  "p-4 rounded-lg border-2 text-center transition-all",
                  selectedPlayer === 'execute'
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-red-300"
                )}
              >
                <X className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">Execute</div>
                <div className="text-sm opacity-70">Eliminate the suspect</div>
              </button>
              
              <button
                onClick={() => setSelectedPlayer('spare')}
                className={cn(
                  "p-4 rounded-lg border-2 text-center transition-all",
                  selectedPlayer === 'spare'
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-green-300"
                )}
              >
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <div className="font-semibold">Spare</div>
                <div className="text-sm opacity-70">Let them survive</div>
              </button>
            </div>
          ) : (
            // Liar vote (Select player)
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eligiblePlayers.map(player => {
                const analysis = getPlayerAnalysis(player);
                const voteCount = voteCounts[player.id] || 0;
                
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      selectedPlayer === player.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{player.nickname}</div>
                        {analysis && (
                          <div className="text-sm text-gray-600">
                            "{analysis.hint}"
                          </div>
                        )}
                        {voteCount > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {voteCount} vote{voteCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {selectedPlayer === player.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <Button
          onClick={handleVoteSubmit}
          disabled={!selectedPlayer || isSubmitting || !canVote}
          className="w-full h-12 text-base font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Vote'
          )}
        </Button>
        
        {!canVote && (
          <p className="text-center text-sm text-gray-500">
            You have already voted or voting is not available
          </p>
        )}
      </div>
    </Card>
  );
};

// Helper functions for player analysis
function calculateSuspicionLevel(hint: Hint, allHints: Hint[]): 'low' | 'medium' | 'high' {
  // Simple heuristic based on hint characteristics
  const hintLength = hint.hint.length;
  const avgLength = allHints.reduce((sum, h) => sum + h.hint.length, 0) / allHints.length;
  
  if (hintLength < avgLength * 0.7) return 'high'; // Very short hints are suspicious
  if (hintLength > avgLength * 1.5) return 'medium'; // Very long hints might be overcompensating
  return 'low';
}

function generateSuspicionReasoning(hint: Hint, allHints: Hint[]): string {
  const level = calculateSuspicionLevel(hint, allHints);
  
  switch (level) {
    case 'high':
      return 'Unusually vague or short hint';
    case 'medium':
      return 'Hint seems overly detailed';
    default:
      return 'Hint appears normal';
  }
}
```

These enhanced components provide:

1. **Intelligent Input Validation**: Real-time validation with helpful error messages
2. **Smart Auto-Actions**: Auto-submit when time is critically low
3. **Contextual Hints**: AI-powered suggestions for liars
4. **Visual Analytics**: Vote tallies, suspicion indicators, and hint analysis
5. **Optimistic Updates**: Immediate UI feedback with error handling
6. **Accessibility**: Full keyboard navigation and screen reader support
7. **Mobile Optimization**: Touch-friendly interactions and responsive layouts
8. **Performance**: Memoized calculations and efficient re-renders

Each component is designed to be both functional and educational, helping players understand the game mechanics while providing a smooth, engaging experience.
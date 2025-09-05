import {useCallback, useEffect, useRef, useState} from 'react';
import {Achievement, ChatMessage} from '../types';

// Simulated real-time events
interface DynamicEvent {
  id: string;
  type: 'player_join' | 'player_leave' | 'chat_message' | 'vote_cast' | 'phase_change' | 'achievement_unlock';
  timestamp: Date;
  data: any;
}

// Achievement progress tracking
const ACHIEVEMENTS_CONFIG = [
  {
    id: 'first_demo',
    title: '첫 데모 체험',
    description: '데모 페이지를 처음 방문했습니다',
    icon: '🎮',
    condition: (stats: any) => stats.pageVisits >= 1
  },
  {
    id: 'section_explorer',
    title: '탐험가',
    description: '모든 섹션을 방문하세요',
    icon: '🗺️',
    condition: (stats: any) => stats.sectionsVisited >= 4
  },
  {
    id: 'voting_expert',
    title: '투표의 달인',
    description: '10번 투표하세요',
    icon: '🗳️',
    condition: (stats: any) => stats.votescast >= 10
  },
  {
    id: 'theme_switcher',
    title: '테마 스위처',
    description: '테마를 5번 변경하세요',
    icon: '🌓',
    condition: (stats: any) => stats.themeSwitches >= 5
  },
  {
    id: 'accessibility_champion',
    title: '접근성 챔피언',
    description: '키보드만으로 10개 이상의 액션을 수행하세요',
    icon: '⌨️',
    condition: (stats: any) => stats.keyboardActions >= 10
  },
  {
    id: 'social_player',
    title: '소셜 플레이어',
    description: '모든 플레이어를 클릭해보세요',
    icon: '👥',
    condition: (stats: any) => stats.playersInteracted >= 8
  },
  {
    id: 'time_watcher',
    title: '시간 관찰자',
    description: '5분 이상 데모를 사용하세요',
    icon: '⏰',
    condition: (stats: any) => stats.timeSpent >= 300000 // 5 minutes
  },
  {
    id: 'help_seeker',
    title: '도움말 마스터',
    description: '도움말을 확인하고 모든 단축키를 사용하세요',
    icon: '📚',
    condition: (stats: any) => stats.helpViewed && stats.shortcutsUsed >= 5
  }
];

// Dynamic chat messages
const DYNAMIC_CHAT_MESSAGES = [
  { author: 'AI Bot', content: '새로운 플레이어가 참가했습니다!', type: 'system' as const },
  { author: 'AI Bot', content: '투표가 시작되었습니다. 신중하게 선택하세요!', type: 'system' as const },
  { author: 'GameMaster', content: '라이어를 찾아보세요! 단서를 놓치지 마세요.', type: 'system' as const },
  { author: 'AI Bot', content: '플레이어들이 활발하게 토론 중입니다.', type: 'system' as const },
  { author: 'System', content: '연결 상태가 안정적입니다.', type: 'system' as const }
];

// Player status changes
const PLAYER_STATUS_CHANGES = [
  { status: 'away' as const, reason: '잠시 자리를 비웠습니다' },
  { status: 'online' as const, reason: '다시 돌아왔습니다' },
  { status: 'offline' as const, reason: '연결이 끊어졌습니다' }
];

interface UserStats {
  pageVisits: number;
  sectionsVisited: number;
  votescast: number;
  themeSwitches: number;
  keyboardActions: number;
  playersInteracted: number;
  timeSpent: number;
  helpViewed: boolean;
  shortcutsUsed: number;
  visitedSections: Set<string>;
  interactedPlayers: Set<string>;
  usedShortcuts: Set<string>;
}

export const useDynamicContent = () => {
  const [events, setEvents] = useState<DynamicEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    pageVisits: 1,
    sectionsVisited: 1,
    votescast: 0,
    themeSwitches: 0,
    keyboardActions: 0,
    playersInteracted: 0,
    timeSpent: 0,
    helpViewed: false,
    shortcutsUsed: 0,
    visitedSections: new Set(['overview']),
    interactedPlayers: new Set(),
    usedShortcuts: new Set()
  });
  
  const [dynamicMessages, setDynamicMessages] = useState<ChatMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false); // Disabled by default for better performance
  
  const startTimeRef = useRef(Date.now());
  const eventIntervalRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize achievements
  useEffect(() => {
    const initialAchievements = ACHIEVEMENTS_CONFIG.map(config => ({
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      unlocked: false,
      progress: 0,
      maxProgress: 1
    }));
    setAchievements(initialAchievements);
  }, []);

  // Update time spent (less frequently for better performance)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSpent = Date.now() - startTimeRef.current;
      setUserStats(prev => ({ ...prev, timeSpent }));
    }, 5000); // Update every 5 seconds instead of every second

    statsIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  // Check achievements
  useEffect(() => {
    ACHIEVEMENTS_CONFIG.forEach(config => {
      if (config.condition(userStats)) {
        setAchievements(prev => prev.map(achievement => 
          achievement.id === config.id && !achievement.unlocked
            ? { ...achievement, unlocked: true, progress: 1 }
            : achievement
        ));
      }
    });
  }, [userStats]);

  // Simulate dynamic events
  useEffect(() => {
    if (!isSimulating) return;

    const simulateEvent = () => {
      const eventTypes = ['chat_message', 'player_status', 'vote_cast'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const event: DynamicEvent = {
        id: `event_${Date.now()}_${Math.random()}`,
        type: 'chat_message',
        timestamp: new Date(),
        data: {}
      };

      switch (eventType) {
        case 'chat_message':
          const message = DYNAMIC_CHAT_MESSAGES[Math.floor(Math.random() * DYNAMIC_CHAT_MESSAGES.length)];
          event.data = {
            ...message,
            id: event.id,
            timestamp: event.timestamp
          };
          setDynamicMessages(prev => [...prev.slice(-10), event.data]);
          break;
          
        case 'vote_cast':
          event.type = 'vote_cast';
          event.data = {
            playerId: `player_${Math.floor(Math.random() * 8) + 1}`,
            targetId: `player_${Math.floor(Math.random() * 8) + 1}`
          };
          break;
          
        case 'player_status':
          const statusChange = PLAYER_STATUS_CHANGES[Math.floor(Math.random() * PLAYER_STATUS_CHANGES.length)];
          event.data = {
            playerId: `player_${Math.floor(Math.random() * 8) + 1}`,
            newStatus: statusChange.status,
            reason: statusChange.reason
          };
          break;
      }
      
      setEvents(prev => [...prev.slice(-50), event]);
    };

    // Simulate events every 10-20 seconds (less frequent for performance)
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of event (reduced frequency)
        simulateEvent();
      }
    }, 10000 + Math.random() * 10000);

    eventIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Track user actions
  const trackSectionVisit = useCallback((sectionId: string) => {
    setUserStats(prev => {
      const newVisitedSections = new Set(prev.visitedSections).add(sectionId);
      return {
        ...prev,
        visitedSections: newVisitedSections,
        sectionsVisited: newVisitedSections.size
      };
    });
  }, []);

  const trackVote = useCallback((playerId: string, targetId: string) => {
    setUserStats(prev => ({ ...prev, votescast: prev.votescast + 1 }));
    
    // Add event
    const event: DynamicEvent = {
      id: `vote_${Date.now()}`,
      type: 'vote_cast',
      timestamp: new Date(),
      data: { playerId, targetId }
    };
    setEvents(prev => [...prev.slice(-50), event]);
  }, []);

  const trackThemeSwitch = useCallback(() => {
    setUserStats(prev => ({ ...prev, themeSwitches: prev.themeSwitches + 1 }));
  }, []);

  const trackKeyboardAction = useCallback((shortcut: string) => {
    setUserStats(prev => {
      const newUsedShortcuts = new Set(prev.usedShortcuts).add(shortcut);
      return {
        ...prev,
        keyboardActions: prev.keyboardActions + 1,
        usedShortcuts: newUsedShortcuts,
        shortcutsUsed: newUsedShortcuts.size
      };
    });
  }, []);

  const trackPlayerInteraction = useCallback((playerId: string) => {
    setUserStats(prev => {
      const newInteractedPlayers = new Set(prev.interactedPlayers).add(playerId);
      return {
        ...prev,
        interactedPlayers: newInteractedPlayers,
        playersInteracted: newInteractedPlayers.size
      };
    });
  }, []);

  const trackHelpView = useCallback(() => {
    setUserStats(prev => ({ ...prev, helpViewed: true }));
  }, []);

  // Simulate player activity
  const simulatePlayerActivity = useCallback(() => {
    const activities = [
      'vote_cast',
      'message_sent', 
      'status_change',
      'connection_issue'
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const playerId = `player_${Math.floor(Math.random() * 8) + 1}`;
    
    const event: DynamicEvent = {
      id: `activity_${Date.now()}`,
      type: 'vote_cast',
      timestamp: new Date(),
      data: { activity, playerId }
    };
    
    setEvents(prev => [...prev.slice(-50), event]);
  }, []);

  // Get recent events
  const getRecentEvents = useCallback((count: number = 10) => {
    return events.slice(-count).reverse();
  }, [events]);

  // Get achievement progress
  const getAchievementProgress = useCallback(() => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.unlocked).length;
    return { unlocked, total, percentage: total > 0 ? (unlocked / total) * 100 : 0 };
  }, [achievements]);

  // Toggle simulation
  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  // Reset stats (for demo purposes)
  const resetStats = useCallback(() => {
    setUserStats({
      pageVisits: 1,
      sectionsVisited: 1,
      votescast: 0,
      themeSwitches: 0,
      keyboardActions: 0,
      playersInteracted: 0,
      timeSpent: 0,
      helpViewed: false,
      shortcutsUsed: 0,
      visitedSections: new Set(['overview']),
      interactedPlayers: new Set(),
      usedShortcuts: new Set()
    });
    
    setAchievements(prev => prev.map(a => ({ ...a, unlocked: false, progress: 0 })));
    setEvents([]);
    setDynamicMessages([]);
    startTimeRef.current = Date.now();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, []);

  return {
    // State
    events,
    achievements,
    userStats,
    dynamicMessages,
    isSimulating,
    
    // Tracking functions
    trackSectionVisit,
    trackVote,
    trackThemeSwitch,
    trackKeyboardAction,
    trackPlayerInteraction,
    trackHelpView,
    
    // Utilities
    simulatePlayerActivity,
    getRecentEvents,
    getAchievementProgress,
    toggleSimulation,
    resetStats,
    
    // Computed values
    timeSpentFormatted: new Date(userStats.timeSpent).toISOString().substr(14, 5),
    achievementProgress: getAchievementProgress()
  };
};
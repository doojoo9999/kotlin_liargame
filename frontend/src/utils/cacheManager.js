/**
 * Cache Manager for handling data caching, cache invalidation, and memory optimization
 * Manages caching for rooms, subjects, players, and other frequently accessed data
 */

/**
 * Cache configuration and settings
 */
const CACHE_CONFIG = {
  // Cache expiration times in milliseconds
  EXPIRATION_TIMES: {
    ROOMS: 30 * 1000, // 30 seconds for room list
    SUBJECTS: 5 * 60 * 1000, // 5 minutes for subjects
    PLAYERS: 60 * 1000, // 1 minute for player data
    CHAT_HISTORY: 10 * 60 * 1000, // 10 minutes for chat history
    USER_DATA: 24 * 60 * 60 * 1000 // 24 hours for user data
  },
  
  // Maximum number of items to cache
  MAX_ITEMS: {
    ROOMS: 100,
    SUBJECTS: 500,
    PLAYERS: 1000,
    CHAT_HISTORY: 50, // Number of chat history sets
    GENERAL: 200
  },
  
  // Memory usage limits (approximate)
  MEMORY_LIMITS: {
    MAX_CACHE_SIZE: 10 * 1024 * 1024, // 10MB total cache size
    CLEANUP_THRESHOLD: 0.8 // Clean up when 80% full
  }
};

/**
 * Cache storage with expiration and metadata
 */
class CacheStorage {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map(); // Stores expiration, access count, etc.
  }

  /**
   * Sets a cache entry with expiration time
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = CACHE_CONFIG.EXPIRATION_TIMES.GENERAL) {
    const now = Date.now();
    const expiration = now + ttl;
    
    this.cache.set(key, value);
    this.metadata.set(key, {
      expiration,
      created: now,
      accessed: now,
      accessCount: 1,
      size: this._estimateSize(value)
    });

    console.log(`[DEBUG_LOG] Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Gets a cache entry if not expired
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    const now = Date.now();
    const meta = this.metadata.get(key);
    
    if (!meta || now > meta.expiration) {
      this.delete(key);
      return null;
    }

    // Update access metadata
    meta.accessed = now;
    meta.accessCount++;

    const value = this.cache.get(key);
    console.log(`[DEBUG_LOG] Cache hit: ${key} (accessed ${meta.accessCount} times)`);
    return value;
  }

  /**
   * Deletes a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
    console.log(`[DEBUG_LOG] Cache deleted: ${key}`);
  }

  /**
   * Checks if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and valid
   */
  has(key) {
    const now = Date.now();
    const meta = this.metadata.get(key);
    
    if (!meta || now > meta.expiration) {
      this.delete(key);
      return false;
    }

    return this.cache.has(key);
  }

  /**
   * Clears all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.metadata.clear();
    console.log(`[DEBUG_LOG] Cache cleared: ${size} entries removed`);
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    let validCount = 0;

    for (const [key, meta] of this.metadata) {
      totalSize += meta.size;
      if (now > meta.expiration) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      estimatedSize: totalSize,
      hitRate: this._calculateHitRate()
    };
  }

  /**
   * Estimates the memory size of a value
   * @param {*} value - Value to estimate
   * @returns {number} Estimated size in bytes
   */
  _estimateSize(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Array.isArray(value)) {
      return value.reduce((size, item) => size + this._estimateSize(item), 0);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 0;
  }

  /**
   * Calculates cache hit rate
   * @returns {number} Hit rate percentage
   */
  _calculateHitRate() {
    let totalAccesses = 0;
    let totalHits = 0;

    for (const meta of this.metadata.values()) {
      totalAccesses += meta.accessCount;
      totalHits += meta.accessCount > 1 ? meta.accessCount - 1 : 0;
    }

    return totalAccesses > 0 ? (totalHits / totalAccesses) * 100 : 0;
  }
}

/**
 * Main cache manager instance
 */
class CacheManager {
  constructor() {
    this.storage = new CacheStorage();
    this.lastCleanup = Date.now();
    this.cleanupInterval = null;
    
    // Start automatic cleanup
    this.startAutoCleanup();
  }

  /**
   * Caches room list data
   * @param {Array} rooms - Array of room objects
   */
  cacheRooms(rooms) {
    if (!Array.isArray(rooms)) {
      console.warn('[DEBUG_LOG] Invalid rooms data for caching:', rooms);
      return;
    }

    this.storage.set('rooms_list', rooms, CACHE_CONFIG.EXPIRATION_TIMES.ROOMS);
    console.log(`[DEBUG_LOG] Cached ${rooms.length} rooms`);
  }

  /**
   * Gets cached room list
   * @returns {Array|null} Cached rooms or null if not found/expired
   */
  getCachedRooms() {
    return this.storage.get('rooms_list');
  }

  /**
   * Caches individual room data
   * @param {string|number} roomId - Room ID
   * @param {Object} roomData - Room data object
   */
  cacheRoom(roomId, roomData) {
    if (!roomId || !roomData) {
      console.warn('[DEBUG_LOG] Invalid room data for caching:', { roomId, roomData });
      return;
    }

    const key = `room_${roomId}`;
    this.storage.set(key, roomData, CACHE_CONFIG.EXPIRATION_TIMES.ROOMS);
  }

  /**
   * Gets cached individual room data
   * @param {string|number} roomId - Room ID
   * @returns {Object|null} Cached room data or null
   */
  getCachedRoom(roomId) {
    if (!roomId) return null;
    return this.storage.get(`room_${roomId}`);
  }

  /**
   * Caches subjects list
   * @param {Array} subjects - Array of subject objects
   */
  cacheSubjects(subjects) {
    if (!Array.isArray(subjects)) {
      console.warn('[DEBUG_LOG] Invalid subjects data for caching:', subjects);
      return;
    }

    this.storage.set('subjects_list', subjects, CACHE_CONFIG.EXPIRATION_TIMES.SUBJECTS);
    console.log(`[DEBUG_LOG] Cached ${subjects.length} subjects`);
  }

  /**
   * Gets cached subjects list
   * @returns {Array|null} Cached subjects or null if not found/expired
   */
  getCachedSubjects() {
    return this.storage.get('subjects_list');
  }

  /**
   * Caches individual subject data
   * @param {string|number} subjectId - Subject ID
   * @param {Object} subjectData - Subject data object
   */
  cacheSubject(subjectId, subjectData) {
    if (!subjectId || !subjectData) {
      console.warn('[DEBUG_LOG] Invalid subject data for caching:', { subjectId, subjectData });
      return;
    }

    const key = `subject_${subjectId}`;
    this.storage.set(key, subjectData, CACHE_CONFIG.EXPIRATION_TIMES.SUBJECTS);
  }

  /**
   * Gets cached individual subject data
   * @param {string|number} subjectId - Subject ID
   * @returns {Object|null} Cached subject data or null
   */
  getCachedSubject(subjectId) {
    if (!subjectId) return null;
    return this.storage.get(`subject_${subjectId}`);
  }

  /**
   * Caches player data
   * @param {string|number} playerId - Player ID
   * @param {Object} playerData - Player data object
   */
  cachePlayer(playerId, playerData) {
    if (!playerId || !playerData) {
      console.warn('[DEBUG_LOG] Invalid player data for caching:', { playerId, playerData });
      return;
    }

    const key = `player_${playerId}`;
    this.storage.set(key, playerData, CACHE_CONFIG.EXPIRATION_TIMES.PLAYERS);
  }

  /**
   * Gets cached player data
   * @param {string|number} playerId - Player ID
   * @returns {Object|null} Cached player data or null
   */
  getCachedPlayer(playerId) {
    if (!playerId) return null;
    return this.storage.get(`player_${playerId}`);
  }

  /**
   * Caches chat history for a room
   * @param {string|number} roomId - Room ID
   * @param {Array} messages - Array of chat messages
   */
  cacheChatHistory(roomId, messages) {
    if (!roomId || !Array.isArray(messages)) {
      console.warn('[DEBUG_LOG] Invalid chat history for caching:', { roomId, messages });
      return;
    }

    const key = `chat_history_${roomId}`;
    this.storage.set(key, messages, CACHE_CONFIG.EXPIRATION_TIMES.CHAT_HISTORY);
    console.log(`[DEBUG_LOG] Cached chat history for room ${roomId}: ${messages.length} messages`);
  }

  /**
   * Gets cached chat history for a room
   * @param {string|number} roomId - Room ID
   * @returns {Array|null} Cached chat messages or null
   */
  getCachedChatHistory(roomId) {
    if (!roomId) return null;
    return this.storage.get(`chat_history_${roomId}`);
  }

  /**
   * Caches user data
   * @param {Object} userData - User data object
   */
  cacheUserData(userData) {
    if (!userData) {
      console.warn('[DEBUG_LOG] Invalid user data for caching:', userData);
      return;
    }

    this.storage.set('user_data', userData, CACHE_CONFIG.EXPIRATION_TIMES.USER_DATA);
  }

  /**
   * Gets cached user data
   * @returns {Object|null} Cached user data or null
   */
  getCachedUserData() {
    return this.storage.get('user_data');
  }

  /**
   * Invalidates cache entries by pattern
   * @param {string} pattern - Pattern to match cache keys
   */
  invalidate(pattern) {
    const keysToDelete = [];
    
    for (const key of this.storage.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.storage.delete(key));
    console.log(`[DEBUG_LOG] Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Invalidates all room-related cache
   */
  invalidateRooms() {
    this.invalidate('room');
    console.log('[DEBUG_LOG] Invalidated all room cache entries');
  }

  /**
   * Invalidates all subject-related cache
   */
  invalidateSubjects() {
    this.invalidate('subject');
    console.log('[DEBUG_LOG] Invalidated all subject cache entries');
  }

  /**
   * Invalidates all player-related cache
   */
  invalidatePlayers() {
    this.invalidate('player');
    console.log('[DEBUG_LOG] Invalidated all player cache entries');
  }

  /**
   * Performs cache cleanup - removes expired entries and manages memory
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    // Find expired entries
    for (const [key, meta] of this.storage.metadata) {
      if (now > meta.expiration) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => this.storage.delete(key));

    // Check memory usage and clean up if needed
    this._enforceMemoryLimits();

    this.lastCleanup = now;
    console.log(`[DEBUG_LOG] Cache cleanup completed: ${expiredKeys.length} expired entries removed`);
  }

  /**
   * Enforces memory limits by removing least recently used items
   */
  _enforceMemoryLimits() {
    const stats = this.storage.getStats();
    
    if (stats.estimatedSize > CACHE_CONFIG.MEMORY_LIMITS.MAX_CACHE_SIZE * CACHE_CONFIG.MEMORY_LIMITS.CLEANUP_THRESHOLD) {
      console.log('[DEBUG_LOG] Cache approaching memory limit, performing LRU cleanup');
      
      // Sort entries by access time (least recently used first)
      const entries = Array.from(this.storage.metadata.entries())
        .sort((a, b) => a[1].accessed - b[1].accessed);

      // Remove entries until we're under the threshold
      let removedSize = 0;
      const targetSize = CACHE_CONFIG.MEMORY_LIMITS.MAX_CACHE_SIZE * (1 - CACHE_CONFIG.MEMORY_LIMITS.CLEANUP_THRESHOLD);
      
      for (const [key, meta] of entries) {
        if (stats.estimatedSize - removedSize <= targetSize) {
          break;
        }
        
        this.storage.delete(key);
        removedSize += meta.size;
      }
      
      console.log(`[DEBUG_LOG] LRU cleanup completed: ${removedSize} bytes freed`);
    }
  }

  /**
   * Starts automatic cache cleanup interval
   */
  startAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    console.log('[DEBUG_LOG] Cache auto-cleanup started');
  }

  /**
   * Stops automatic cache cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('[DEBUG_LOG] Cache auto-cleanup stopped');
  }

  /**
   * Gets comprehensive cache statistics
   * @returns {Object} Detailed cache statistics
   */
  getStatistics() {
    const stats = this.storage.getStats();
    return {
      ...stats,
      config: CACHE_CONFIG,
      lastCleanup: this.lastCleanup,
      autoCleanupActive: !!this.cleanupInterval
    };
  }

  /**
   * Clears all cache data
   */
  clearAll() {
    this.storage.clear();
    console.log('[DEBUG_LOG] All cache data cleared');
  }

  /**
   * Exports cache data for debugging
   * @returns {Object} Cache data export
   */
  exportCacheData() {
    const data = {};
    for (const [key, value] of this.storage.cache) {
      data[key] = {
        value,
        metadata: this.storage.metadata.get(key)
      };
    }
    return data;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
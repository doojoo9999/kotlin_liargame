/**
 * State Synchronization Manager
 * Handles synchronization between local state and server state,
 * optimistic updates, conflict resolution, and state consistency
 */

/**
 * Synchronization configuration
 */
const SYNC_CONFIG = {
  // Retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  
  // Timeout settings
  SYNC_TIMEOUT_MS: 10000,
  HEARTBEAT_INTERVAL_MS: 30000,
  
  // Conflict resolution strategies
  CONFLICT_RESOLUTION: {
    SERVER_WINS: 'server_wins',
    CLIENT_WINS: 'client_wins',
    MERGE: 'merge',
    MANUAL: 'manual'
  },
  
  // State priorities for conflict resolution
  STATE_PRIORITIES: {
    GAME_STATUS: 'server_wins',
    PLAYER_ROLES: 'server_wins',
    VOTING_RESULTS: 'server_wins',
    CHAT_MESSAGES: 'merge',
    USER_PREFERENCES: 'client_wins'
  }
};

/**
 * Pending operations tracker
 */
class PendingOperations {
  constructor() {
    this.operations = new Map();
    this.operationCounter = 0;
  }

  /**
   * Adds a pending operation
   * @param {string} type - Operation type
   * @param {*} data - Operation data
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @returns {string} Operation ID
   */
  add(type, data, onSuccess, onError) {
    const operationId = `${type}_${++this.operationCounter}_${Date.now()}`;
    
    this.operations.set(operationId, {
      id: operationId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      onSuccess,
      onError,
      status: 'pending'
    });

    console.log(`[DEBUG_LOG] Added pending operation: ${operationId} (${type})`);
    return operationId;
  }

  /**
   * Marks an operation as completed
   * @param {string} operationId - Operation ID
   * @param {*} result - Operation result
   */
  complete(operationId, result) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'completed';
      operation.result = result;
      operation.completedAt = Date.now();
      
      if (operation.onSuccess) {
        operation.onSuccess(result);
      }
      
      this.operations.delete(operationId);
      console.log(`[DEBUG_LOG] Completed operation: ${operationId}`);
    }
  }

  /**
   * Marks an operation as failed
   * @param {string} operationId - Operation ID
   * @param {*} error - Error information
   */
  fail(operationId, error) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'failed';
      operation.error = error;
      operation.failedAt = Date.now();
      
      if (operation.onError) {
        operation.onError(error);
      }
      
      console.error(`[DEBUG_LOG] Failed operation: ${operationId}`, error);
      // Keep failed operations for debugging, but mark them as failed
    }
  }

  /**
   * Gets all pending operations
   * @returns {Array} Array of pending operations
   */
  getPending() {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'pending');
  }

  /**
   * Clears all operations
   */
  clear() {
    const count = this.operations.size;
    this.operations.clear();
    console.log(`[DEBUG_LOG] Cleared ${count} pending operations`);
  }
}

/**
 * State difference tracker
 */
class StateDiffer {
  /**
   * Compares two state objects and returns differences
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   * @returns {Object} Differences object
   */
  diff(oldState, newState) {
    const differences = {};
    
    // Compare all keys in new state
    for (const key in newState) {
      if (this._isDifferent(oldState[key], newState[key])) {
        differences[key] = {
          old: oldState[key],
          new: newState[key],
          type: this._getChangeType(oldState[key], newState[key])
        };
      }
    }
    
    // Check for deleted keys
    for (const key in oldState) {
      if (!(key in newState)) {
        differences[key] = {
          old: oldState[key],
          new: undefined,
          type: 'deleted'
        };
      }
    }
    
    return differences;
  }

  /**
   * Checks if two values are different
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} True if different
   */
  _isDifferent(a, b) {
    if (a === b) return false;
    if (a == null || b == null) return a !== b;
    
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    
    return a !== b;
  }

  /**
   * Determines the type of change
   * @param {*} oldValue - Old value
   * @param {*} newValue - New value
   * @returns {string} Change type
   */
  _getChangeType(oldValue, newValue) {
    if (oldValue == null && newValue != null) return 'added';
    if (oldValue != null && newValue == null) return 'deleted';
    if (typeof oldValue !== typeof newValue) return 'type_changed';
    return 'modified';
  }
}

/**
 * Main State Synchronization Manager
 */
class StateSyncManager {
  constructor() {
    this.pendingOps = new PendingOperations();
    this.stateDiffer = new StateDiffer();
    this.localState = {};
    this.serverState = {};
    this.lastSyncTime = 0;
    this.syncInProgress = false;
    this.conflictHandlers = new Map();
    this.stateValidators = new Map();
  }

  /**
   * Sets the current local state
   * @param {Object} state - Current local state
   */
  setLocalState(state) {
    this.localState = { ...state };
    console.log('[DEBUG_LOG] Local state updated');
  }

  /**
   * Updates the server state from received data
   * @param {Object} serverState - Server state data
   */
  updateServerState(serverState) {
    const oldServerState = { ...this.serverState };
    this.serverState = { ...serverState };
    this.lastSyncTime = Date.now();
    
    // Check for conflicts
    const conflicts = this._detectConflicts(oldServerState, serverState);
    if (Object.keys(conflicts).length > 0) {
      this._handleConflicts(conflicts);
    }
    
    console.log('[DEBUG_LOG] Server state updated');
  }

  /**
   * Performs optimistic update to local state
   * @param {string} operationType - Type of operation
   * @param {Object} stateChanges - State changes to apply
   * @param {Function} serverSync - Function to sync with server
   * @returns {Promise} Promise resolving with operation result
   */
  async optimisticUpdate(operationType, stateChanges, serverSync) {
    // Apply changes optimistically to local state
    const previousState = { ...this.localState };
    this.localState = { ...this.localState, ...stateChanges };
    
    console.log(`[DEBUG_LOG] Applied optimistic update: ${operationType}`, stateChanges);
    
    // Create pending operation
    const operationId = this.pendingOps.add(
      operationType,
      stateChanges,
      (result) => {
        console.log(`[DEBUG_LOG] Optimistic update confirmed: ${operationType}`, result);
      },
      (error) => {
        console.error(`[DEBUG_LOG] Optimistic update failed, reverting: ${operationType}`, error);
        // Revert optimistic changes
        this.localState = previousState;
        return this._handleOptimisticFailure(operationType, error, previousState);
      }
    );

    try {
      // Sync with server
      const result = await serverSync();
      this.pendingOps.complete(operationId, result);
      return result;
    } catch (error) {
      this.pendingOps.fail(operationId, error);
      throw error;
    }
  }

  /**
   * Handles optimistic update failure
   * @param {string} operationType - Operation type
   * @param {*} error - Error that occurred
   * @param {Object} previousState - State to revert to
   */
  _handleOptimisticFailure(operationType, error, previousState) {
    // Could emit an event here for UI to handle
    console.error(`[DEBUG_LOG] Optimistic update failed: ${operationType}`, error);
    
    // Additional error handling based on operation type
    switch (operationType) {
      case 'SEND_CHAT_MESSAGE':
        // Show error message to user
        break;
      case 'CAST_VOTE':
        // Reset vote UI
        break;
      default:
        break;
    }
  }

  /**
   * Detects conflicts between local and server state
   * @param {Object} oldServerState - Previous server state
   * @param {Object} newServerState - New server state
   * @returns {Object} Detected conflicts
   */
  _detectConflicts(oldServerState, newServerState) {
    const conflicts = {};
    const serverDiff = this.stateDiffer.diff(oldServerState, newServerState);
    
    // Check each server change against local state
    for (const [key, change] of Object.entries(serverDiff)) {
      const localValue = this.localState[key];
      const serverValue = change.new;
      
      // If local value differs from server value, we have a conflict
      if (this.stateDiffer._isDifferent(localValue, serverValue)) {
        conflicts[key] = {
          local: localValue,
          server: serverValue,
          serverChange: change
        };
      }
    }
    
    return conflicts;
  }

  /**
   * Handles detected conflicts using configured strategies
   * @param {Object} conflicts - Detected conflicts
   */
  _handleConflicts(conflicts) {
    console.log('[DEBUG_LOG] Handling state conflicts:', Object.keys(conflicts));
    
    for (const [key, conflict] of Object.entries(conflicts)) {
      const strategy = SYNC_CONFIG.STATE_PRIORITIES[key] || SYNC_CONFIG.CONFLICT_RESOLUTION.SERVER_WINS;
      const resolution = this._resolveConflict(key, conflict, strategy);
      
      if (resolution !== null) {
        this.localState[key] = resolution;
        console.log(`[DEBUG_LOG] Resolved conflict for ${key} using strategy: ${strategy}`);
      }
    }
  }

  /**
   * Resolves a single conflict using the specified strategy
   * @param {string} key - State key
   * @param {Object} conflict - Conflict information
   * @param {string} strategy - Resolution strategy
   * @returns {*} Resolved value
   */
  _resolveConflict(key, conflict, strategy) {
    switch (strategy) {
      case SYNC_CONFIG.CONFLICT_RESOLUTION.SERVER_WINS:
        return conflict.server;
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.CLIENT_WINS:
        return conflict.local;
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.MERGE:
        return this._mergeValues(conflict.local, conflict.server);
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.MANUAL:
        // Use custom conflict handler if registered
        const handler = this.conflictHandlers.get(key);
        if (handler) {
          return handler(conflict.local, conflict.server);
        }
        // Default to server wins if no handler
        return conflict.server;
        
      default:
        return conflict.server;
    }
  }

  /**
   * Merges two values (used for merge conflict resolution)
   * @param {*} localValue - Local value
   * @param {*} serverValue - Server value
   * @returns {*} Merged value
   */
  _mergeValues(localValue, serverValue) {
    // Handle array merging (e.g., for chat messages)
    if (Array.isArray(localValue) && Array.isArray(serverValue)) {
      // Merge arrays, removing duplicates based on id if available
      const merged = [...localValue];
      for (const serverItem of serverValue) {
        const exists = localValue.some(localItem => 
          (localItem.id && serverItem.id && localItem.id === serverItem.id) ||
          JSON.stringify(localItem) === JSON.stringify(serverItem)
        );
        if (!exists) {
          merged.push(serverItem);
        }
      }
      return merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }
    
    // Handle object merging
    if (typeof localValue === 'object' && typeof serverValue === 'object' &&
        localValue !== null && serverValue !== null) {
      return { ...localValue, ...serverValue };
    }
    
    // For primitive values, server wins
    return serverValue;
  }

  /**
   * Registers a custom conflict handler for a specific state key
   * @param {string} key - State key
   * @param {Function} handler - Conflict handler function
   */
  registerConflictHandler(key, handler) {
    this.conflictHandlers.set(key, handler);
    console.log(`[DEBUG_LOG] Registered conflict handler for: ${key}`);
  }

  /**
   * Registers a state validator for a specific key
   * @param {string} key - State key
   * @param {Function} validator - Validator function
   */
  registerStateValidator(key, validator) {
    this.stateValidators.set(key, validator);
    console.log(`[DEBUG_LOG] Registered state validator for: ${key}`);
  }

  /**
   * Validates state changes
   * @param {Object} stateChanges - Proposed state changes
   * @returns {Object} Validation results
   */
  validateStateChanges(stateChanges) {
    const validationResults = {};
    
    for (const [key, value] of Object.entries(stateChanges)) {
      const validator = this.stateValidators.get(key);
      if (validator) {
        try {
          const result = validator(value, this.localState[key]);
          validationResults[key] = {
            valid: result === true || result.valid === true,
            message: result.message || null,
            correctedValue: result.correctedValue || value
          };
        } catch (error) {
          validationResults[key] = {
            valid: false,
            message: `Validation error: ${error.message}`,
            correctedValue: value
          };
        }
      } else {
        validationResults[key] = { valid: true, correctedValue: value };
      }
    }
    
    return validationResults;
  }

  /**
   * Forces a full state synchronization
   * @param {Function} fetchServerState - Function to fetch full server state
   */
  async forceSync(fetchServerState) {
    if (this.syncInProgress) {
      console.log('[DEBUG_LOG] Sync already in progress, skipping force sync');
      return;
    }
    
    this.syncInProgress = true;
    console.log('[DEBUG_LOG] Starting forced state synchronization');
    
    try {
      const serverState = await fetchServerState();
      this.updateServerState(serverState);
      
      // Apply server state to local state (server wins for force sync)
      this.localState = { ...serverState };
      
      console.log('[DEBUG_LOG] Force sync completed successfully');
    } catch (error) {
      console.error('[DEBUG_LOG] Force sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Gets synchronization statistics
   * @returns {Object} Sync statistics
   */
  getStats() {
    return {
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: Date.now() - this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.pendingOps.getPending().length,
      registeredConflictHandlers: this.conflictHandlers.size,
      registeredValidators: this.stateValidators.size
    };
  }

  /**
   * Cleans up resources
   */
  cleanup() {
    this.pendingOps.clear();
    this.conflictHandlers.clear();
    this.stateValidators.clear();
    console.log('[DEBUG_LOG] StateSyncManager cleaned up');
  }
}

// Create singleton instance
const stateSyncManager = new StateSyncManager();

export default stateSyncManager;
export { SYNC_CONFIG };
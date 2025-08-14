/**
 * State Validators
 * Provides state validation, integrity checking, data type validation,
 * and error correction with customizable validation rules
 */

/**
 * Validation result structure
 */
class ValidationResult {
  constructor(valid = true, message = null, correctedValue = null, severity = 'error') {
    this.valid = valid;
    this.message = message;
    this.correctedValue = correctedValue;
    this.severity = severity; // 'error', 'warning', 'info'
  }

  static success(correctedValue = null) {
    return new ValidationResult(true, null, correctedValue);
  }

  static error(message, correctedValue = null) {
    return new ValidationResult(false, message, correctedValue, 'error');
  }

  static warning(message, correctedValue = null) {
    return new ValidationResult(false, message, correctedValue, 'warning');
  }
}

/**
 * Base validator class
 */
class BaseValidator {
  constructor(options = {}) {
    this.options = {
      required: false,
      allowNull: true,
      autoCorrect: true,
      ...options
    };
  }

  /**
   * Validates a value
   * @param {*} value - Value to validate
   * @param {*} context - Additional context for validation
   * @returns {ValidationResult} Validation result
   */
  validate(value, context = {}) {
    // Check required
    if (this.options.required && (value === undefined || value === null)) {
      return ValidationResult.error('Value is required');
    }

    // Check null allowed
    if (!this.options.allowNull && value === null) {
      return ValidationResult.error('Null value not allowed');
    }

    // Skip further validation for null/undefined if allowed
    if (value === null || value === undefined) {
      return ValidationResult.success(value);
    }

    return this._validateValue(value, context);
  }

  /**
   * Abstract method for specific validation logic
   * @param {*} value - Value to validate
   * @param {*} context - Validation context
   * @returns {ValidationResult} Validation result
   */
  _validateValue(value, context) {
    return ValidationResult.success(value);
  }
}

/**
 * String validator
 */
class StringValidator extends BaseValidator {
  constructor(options = {}) {
    super({
      minLength: 0,
      maxLength: Infinity,
      pattern: null,
      trim: true,
      ...options
    });
  }

  _validateValue(value, context) {
    if (typeof value !== 'string') {
      if (this.options.autoCorrect) {
        const corrected = String(value);
        return ValidationResult.warning(
          `Value converted from ${typeof value} to string`,
          this.options.trim ? corrected.trim() : corrected
        );
      }
      return ValidationResult.error('Value must be a string');
    }

    let processedValue = this.options.trim ? value.trim() : value;

    // Length validation
    if (processedValue.length < this.options.minLength) {
      return ValidationResult.error(
        `String length ${processedValue.length} is less than minimum ${this.options.minLength}`
      );
    }

    if (processedValue.length > this.options.maxLength) {
      if (this.options.autoCorrect) {
        const corrected = processedValue.substring(0, this.options.maxLength);
        return ValidationResult.warning(
          `String truncated to maximum length ${this.options.maxLength}`,
          corrected
        );
      }
      return ValidationResult.error(
        `String length ${processedValue.length} exceeds maximum ${this.options.maxLength}`
      );
    }

    // Pattern validation
    if (this.options.pattern && !this.options.pattern.test(processedValue)) {
      return ValidationResult.error('String does not match required pattern');
    }

    return ValidationResult.success(processedValue);
  }
}

/**
 * Number validator
 */
class NumberValidator extends BaseValidator {
  constructor(options = {}) {
    super({
      min: -Infinity,
      max: Infinity,
      integer: false,
      ...options
    });
  }

  _validateValue(value, context) {
    let numValue = value;

    if (typeof value !== 'number') {
      if (this.options.autoCorrect) {
        numValue = Number(value);
        if (isNaN(numValue)) {
          return ValidationResult.error('Cannot convert value to number');
        }
        return ValidationResult.warning(
          `Value converted from ${typeof value} to number`,
          numValue
        );
      }
      return ValidationResult.error('Value must be a number');
    }

    if (isNaN(numValue)) {
      return ValidationResult.error('Value is NaN');
    }

    if (this.options.integer && !Number.isInteger(numValue)) {
      if (this.options.autoCorrect) {
        const corrected = Math.round(numValue);
        return ValidationResult.warning(
          'Value rounded to nearest integer',
          corrected
        );
      }
      return ValidationResult.error('Value must be an integer');
    }

    if (numValue < this.options.min) {
      if (this.options.autoCorrect) {
        return ValidationResult.warning(
          `Value ${numValue} increased to minimum ${this.options.min}`,
          this.options.min
        );
      }
      return ValidationResult.error(`Value ${numValue} is below minimum ${this.options.min}`);
    }

    if (numValue > this.options.max) {
      if (this.options.autoCorrect) {
        return ValidationResult.warning(
          `Value ${numValue} reduced to maximum ${this.options.max}`,
          this.options.max
        );
      }
      return ValidationResult.error(`Value ${numValue} exceeds maximum ${this.options.max}`);
    }

    return ValidationResult.success(numValue);
  }
}

/**
 * Array validator
 */
class ArrayValidator extends BaseValidator {
  constructor(options = {}) {
    super({
      minLength: 0,
      maxLength: Infinity,
      itemValidator: null,
      uniqueItems: false,
      ...options
    });
  }

  _validateValue(value, context) {
    if (!Array.isArray(value)) {
      if (this.options.autoCorrect && value != null) {
        const corrected = [value];
        return ValidationResult.warning(
          'Value converted to array',
          corrected
        );
      }
      return ValidationResult.error('Value must be an array');
    }

    // Length validation
    if (value.length < this.options.minLength) {
      return ValidationResult.error(
        `Array length ${value.length} is less than minimum ${this.options.minLength}`
      );
    }

    if (value.length > this.options.maxLength) {
      if (this.options.autoCorrect) {
        const corrected = value.slice(0, this.options.maxLength);
        return ValidationResult.warning(
          `Array truncated to maximum length ${this.options.maxLength}`,
          corrected
        );
      }
      return ValidationResult.error(
        `Array length ${value.length} exceeds maximum ${this.options.maxLength}`
      );
    }

    let processedValue = [...value];
    const validationMessages = [];

    // Validate items
    if (this.options.itemValidator) {
      const validatedItems = [];
      for (let i = 0; i < processedValue.length; i++) {
        const itemResult = this.options.itemValidator.validate(processedValue[i], { ...context, index: i });
        if (!itemResult.valid && itemResult.severity === 'error') {
          return ValidationResult.error(`Item at index ${i}: ${itemResult.message}`);
        }
        if (itemResult.message) {
          validationMessages.push(`Item ${i}: ${itemResult.message}`);
        }
        validatedItems.push(itemResult.correctedValue ?? processedValue[i]);
      }
      processedValue = validatedItems;
    }

    // Check unique items
    if (this.options.uniqueItems) {
      const unique = [...new Set(processedValue.map(item => JSON.stringify(item)))];
      if (unique.length !== processedValue.length) {
        if (this.options.autoCorrect) {
          const corrected = processedValue.filter((item, index, arr) => {
            const itemStr = JSON.stringify(item);
            return arr.findIndex(other => JSON.stringify(other) === itemStr) === index;
          });
          validationMessages.push('Duplicate items removed');
          processedValue = corrected;
        } else {
          return ValidationResult.error('Array contains duplicate items');
        }
      }
    }

    const message = validationMessages.length > 0 ? validationMessages.join('; ') : null;
    return validationMessages.length > 0 
      ? ValidationResult.warning(message, processedValue)
      : ValidationResult.success(processedValue);
  }
}

/**
 * Object validator
 */
class ObjectValidator extends BaseValidator {
  constructor(schema = {}, options = {}) {
    super({
      allowExtraFields: true,
      removeExtraFields: false,
      ...options
    });
    this.schema = schema;
  }

  _validateValue(value, context) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return ValidationResult.error('Value must be an object');
    }

    let processedValue = { ...value };
    const validationMessages = [];

    // Validate schema fields
    for (const [fieldName, fieldValidator] of Object.entries(this.schema)) {
      const fieldValue = processedValue[fieldName];
      const fieldResult = fieldValidator.validate(fieldValue, { ...context, field: fieldName });
      
      if (!fieldResult.valid && fieldResult.severity === 'error') {
        return ValidationResult.error(`Field '${fieldName}': ${fieldResult.message}`);
      }
      
      if (fieldResult.message) {
        validationMessages.push(`Field '${fieldName}': ${fieldResult.message}`);
      }
      
      processedValue[fieldName] = fieldResult.correctedValue ?? fieldValue;
    }

    // Handle extra fields
    if (!this.options.allowExtraFields || this.options.removeExtraFields) {
      const schemaFields = Object.keys(this.schema);
      const extraFields = Object.keys(processedValue).filter(key => !schemaFields.includes(key));
      
      if (extraFields.length > 0) {
        if (this.options.removeExtraFields) {
          extraFields.forEach(field => delete processedValue[field]);
          validationMessages.push(`Removed extra fields: ${extraFields.join(', ')}`);
        } else if (!this.options.allowExtraFields) {
          return ValidationResult.error(`Extra fields not allowed: ${extraFields.join(', ')}`);
        }
      }
    }

    const message = validationMessages.length > 0 ? validationMessages.join('; ') : null;
    return validationMessages.length > 0 
      ? ValidationResult.warning(message, processedValue)
      : ValidationResult.success(processedValue);
  }
}

/**
 * Enum validator
 */
class EnumValidator extends BaseValidator {
  constructor(allowedValues, options = {}) {
    super(options);
    this.allowedValues = Array.isArray(allowedValues) ? allowedValues : Object.values(allowedValues);
  }

  _validateValue(value, context) {
    if (!this.allowedValues.includes(value)) {
      if (this.options.autoCorrect && this.allowedValues.length > 0) {
        const corrected = this.allowedValues[0];
        return ValidationResult.warning(
          `Invalid value '${value}', corrected to '${corrected}'`,
          corrected
        );
      }
      return ValidationResult.error(
        `Value '${value}' is not one of allowed values: ${this.allowedValues.join(', ')}`
      );
    }

    return ValidationResult.success(value);
  }
}

/**
 * Game-specific validators
 */

/**
 * Player data validator
 */
const createPlayerValidator = () => new ObjectValidator({
  id: new StringValidator({ required: true, minLength: 1 }),
  nickname: new StringValidator({ required: true, minLength: 1, maxLength: 50 }),
  isHost: new BaseValidator(),
  isAlive: new BaseValidator(),
  isReady: new BaseValidator(),
  role: new EnumValidator(['LIAR', 'CITIZEN', null], { allowNull: true }),
  votedFor: new StringValidator({ allowNull: true }),
  survivalVote: new BaseValidator({ allowNull: true })
});

/**
 * Room data validator
 */
const createRoomValidator = () => new ObjectValidator({
  gameNumber: new NumberValidator({ required: true, integer: true, min: 1 }),
  title: new StringValidator({ required: true, minLength: 1, maxLength: 100 }),
  host: new StringValidator({ required: true, minLength: 1 }),
  currentPlayers: new NumberValidator({ integer: true, min: 0 }),
  maxPlayers: new NumberValidator({ integer: true, min: 1, max: 10 }),
  hasPassword: new BaseValidator(),
  state: new EnumValidator(['WAITING', 'SPEAKING', 'VOTING', 'RESULTS', 'FINISHED']),
  players: new ArrayValidator({ itemValidator: createPlayerValidator() })
});

/**
 * Chat message validator
 */
const createChatMessageValidator = () => new ObjectValidator({
  id: new StringValidator({ required: true }),
  content: new StringValidator({ required: true, maxLength: 500 }),
  sender: createPlayerValidator(),
  timestamp: new NumberValidator({ integer: true, min: 0 }),
  type: new EnumValidator(['CHAT', 'SYSTEM', 'GAME'])
});

/**
 * Game state validator
 */
const createGameStateValidator = () => new ObjectValidator({
  gameStatus: new EnumValidator(['WAITING', 'SPEAKING', 'VOTING', 'RESULTS', 'FINISHED']),
  currentRound: new NumberValidator({ integer: true, min: 0 }),
  playerRole: new EnumValidator(['LIAR', 'CITIZEN', null], { allowNull: true }),
  assignedWord: new StringValidator({ allowNull: true, maxLength: 100 }),
  gameTimer: new NumberValidator({ integer: true, min: 0 }),
  currentTurnPlayerId: new StringValidator({ allowNull: true })
});

/**
 * Subject data validator
 */
const createSubjectValidator = () => new ObjectValidator({
  id: new NumberValidator({ required: true, integer: true, min: 1 }),
  content: new StringValidator({ required: true, minLength: 1, maxLength: 200 }),
  keywords: new ArrayValidator({ itemValidator: new StringValidator({ maxLength: 50 }) }),
  createdAt: new StringValidator({ allowNull: true }),
  createdBy: new StringValidator({ allowNull: true })
});

/**
 * Main State Validators Manager
 */
class StateValidators {
  constructor() {
    this.validators = new Map();
    this.globalValidators = new Map();
    
    // Register built-in validators
    this._registerBuiltInValidators();
  }

  /**
   * Registers built-in validators
   */
  _registerBuiltInValidators() {
    this.validators.set('player', createPlayerValidator());
    this.validators.set('room', createRoomValidator());
    this.validators.set('chatMessage', createChatMessageValidator());
    this.validators.set('gameState', createGameStateValidator());
    this.validators.set('subject', createSubjectValidator());
  }

  /**
   * Registers a custom validator
   * @param {string} name - Validator name
   * @param {BaseValidator} validator - Validator instance
   */
  register(name, validator) {
    this.validators.set(name, validator);
    console.log(`[DEBUG_LOG] Registered validator: ${name}`);
  }

  /**
   * Registers a global validator for all validations
   * @param {string} name - Global validator name
   * @param {Function} validatorFn - Validator function
   */
  registerGlobal(name, validatorFn) {
    this.globalValidators.set(name, validatorFn);
    console.log(`[DEBUG_LOG] Registered global validator: ${name}`);
  }

  /**
   * Validates data using a registered validator
   * @param {string} validatorName - Validator name
   * @param {*} data - Data to validate
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   */
  validate(validatorName, data, context = {}) {
    const validator = this.validators.get(validatorName);
    if (!validator) {
      return ValidationResult.error(`Validator '${validatorName}' not found`);
    }

    try {
      // Run main validation
      const result = validator.validate(data, context);
      
      // Run global validators
      for (const [name, globalValidator] of this.globalValidators) {
        const globalResult = globalValidator(data, context);
        if (!globalResult.valid) {
          return ValidationResult.error(`Global validator '${name}': ${globalResult.message}`);
        }
      }

      console.log(`[DEBUG_LOG] Validation ${result.valid ? 'passed' : 'failed'} for ${validatorName}:`, result.message || 'OK');
      return result;

    } catch (error) {
      console.error(`[DEBUG_LOG] Validation error for ${validatorName}:`, error);
      return ValidationResult.error(`Validation error: ${error.message}`);
    }
  }

  /**
   * Validates multiple data items
   * @param {Object} validations - Object with validator names as keys and data as values
   * @returns {Object} Validation results
   */
  validateMultiple(validations) {
    const results = {};
    
    for (const [validatorName, data] of Object.entries(validations)) {
      results[validatorName] = this.validate(validatorName, data);
    }
    
    return results;
  }

  /**
   * Validates room data integrity
   * @param {Object} roomData - Room data to validate
   * @returns {ValidationResult} Validation result
   */
  validateRoomData(roomData) {
    return this.validate('room', roomData);
  }

  /**
   * Validates player data integrity
   * @param {Object} playerData - Player data to validate
   * @returns {ValidationResult} Validation result
   */
  validatePlayerData(playerData) {
    return this.validate('player', playerData);
  }

  /**
   * Validates game state consistency
   * @param {Object} gameState - Game state to validate
   * @returns {ValidationResult} Validation result
   */
  validateGameState(gameState) {
    return this.validate('gameState', gameState);
  }

  /**
   * Validates chat message
   * @param {Object} message - Chat message to validate
   * @returns {ValidationResult} Validation result
   */
  validateChatMessage(message) {
    return this.validate('chatMessage', message);
  }

  /**
   * Validates subject data
   * @param {Object} subject - Subject data to validate
   * @returns {ValidationResult} Validation result
   */
  validateSubjectData(subject) {
    return this.validate('subject', subject);
  }

  /**
   * Gets all registered validator names
   * @returns {Array} Array of validator names
   */
  getValidatorNames() {
    return Array.from(this.validators.keys());
  }

  /**
   * Clears all validators
   */
  clear() {
    this.validators.clear();
    this.globalValidators.clear();
    this._registerBuiltInValidators();
    console.log('[DEBUG_LOG] State validators cleared and reset');
  }
}

// Create singleton instance
const stateValidators = new StateValidators();

export default stateValidators;
export { 
  ValidationResult, 
  BaseValidator, 
  StringValidator, 
  NumberValidator, 
  ArrayValidator, 
  ObjectValidator, 
  EnumValidator 
};
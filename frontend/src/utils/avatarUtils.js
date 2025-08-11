// Centralized avatar utilities for consistent Avatar generation across the application

/**
 * Generate consistent color based on a string identifier (nickname or userId)
 * Uses string hashing to ensure the same input always produces the same color
 * @param {string} identifier - The string to generate color from (nickname, userId, etc.)
 * @returns {string} HSL color string
 */
export function generateAvatarColor(identifier) {
  if (!identifier) return 'hsl(210, 25%, 60%)'; // Default gray color
  
  // Generate hash from string
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to HSL color (fixed saturation and lightness for better readability)
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Generate avatar initial from nickname
 * Ensures consistent capitalization (first letter uppercase)
 * @param {string} nickname - The nickname to extract initial from
 * @returns {string} Single uppercase character
 */
export function getAvatarInitial(nickname) {
  if (!nickname || typeof nickname !== 'string') return '?';
  return nickname.charAt(0).toUpperCase();
}

/**
 * Get standardized avatar size configurations
 * @param {string} size - Size variant ('small', 'medium', 'large')
 * @returns {object} Size configuration object
 */
export function getAvatarSizeConfig(size = 'medium') {
  const sizeConfigs = {
    small: {
      width: 24,
      height: 24,
      fontSize: '0.75rem'
    },
    medium: {
      width: 40,
      height: 40,
      fontSize: '1rem'
    },
    large: {
      width: 56,
      height: 56,
      fontSize: '1.25rem'
    }
  };
  
  return sizeConfigs[size] || sizeConfigs.medium;
}

/**
 * Generate complete avatar props for MUI Avatar component
 * @param {object} options - Configuration options
 * @param {string} options.nickname - User nickname
 * @param {string} options.userId - User ID (fallback for color generation)
 * @param {string} options.avatarUrl - Optional avatar image URL
 * @param {string} options.size - Size variant ('small', 'medium', 'large')
 * @param {boolean} options.showOnlineStatus - Whether to show online indicator
 * @param {object} options.additionalSx - Additional sx props to merge
 * @returns {object} Props object for MUI Avatar component
 */
export function generateAvatarProps({
  nickname,
  userId,
  avatarUrl,
  size = 'medium',
  showOnlineStatus = false,
  additionalSx = {}
}) {
  const identifier = nickname || userId || 'User';
  const sizeConfig = getAvatarSizeConfig(size);
  
  const avatarProps = {
    alt: identifier,
    sx: {
      ...sizeConfig,
      bgcolor: generateAvatarColor(identifier),
      color: 'white',
      fontWeight: 'bold',
      ...additionalSx
    },
    children: getAvatarInitial(identifier)
  };
  
  // Use provided avatar URL if available
  if (avatarUrl) {
    avatarProps.src = avatarUrl;
  }
  
  return avatarProps;
}
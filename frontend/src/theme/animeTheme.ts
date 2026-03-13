// Anime-style theme configuration for PerfectPractice
// Bold colors, glowing effects, dynamic gradients

export const ANIME_THEME = {
  // Primary Colors - Vibrant anime palette
  colors: {
    // Main gradient colors
    primary: '#FF6B6B',      // Energetic red-pink
    secondary: '#4ECDC4',    // Teal accent
    accent: '#FFE66D',       // Golden yellow
    
    // Gradient sets
    gradients: {
      hero: ['#667eea', '#764ba2', '#f093fb'],  // Purple-pink
      fire: ['#f12711', '#f5af19'],              // Fire orange
      ocean: ['#00d2ff', '#3a7bd5'],             // Ocean blue
      sunset: ['#ff6b6b', '#feca57', '#ff9ff3'], // Sunset
      neon: ['#00f5ff', '#ff00ff', '#ffff00'],   // Neon
      energy: ['#11998e', '#38ef7d'],            // Green energy
      cosmic: ['#8E2DE2', '#4A00E0'],            // Cosmic purple
    },
    
    // Background colors
    background: {
      dark: '#0a0a1a',       // Deep space black
      card: '#1a1a2e',       // Card background
      elevated: '#16213e',   // Elevated elements
      overlay: 'rgba(10, 10, 26, 0.9)',
    },
    
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#a0a0b0',
      accent: '#FFE66D',
      glow: '#00f5ff',
    },
    
    // Glow colors
    glow: {
      pink: '#ff6b6b',
      cyan: '#00f5ff',
      purple: '#a855f7',
      gold: '#fbbf24',
      green: '#10b981',
    },
    
    // Status colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  
  // Typography - Bold anime style
  typography: {
    title: {
      fontWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    subtitle: {
      fontWeight: '700',
      letterSpacing: 1,
    },
    body: {
      fontWeight: '500',
    },
    accent: {
      fontWeight: '800',
      fontStyle: 'italic',
    },
  },
  
  // Shadows with glow
  shadows: {
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 15,
      elevation: 10,
    }),
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    neon: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 15,
    }),
  },
  
  // Border styles
  borders: {
    glowing: (color: string) => ({
      borderWidth: 2,
      borderColor: color,
    }),
    gradient: {
      borderWidth: 3,
      borderColor: 'transparent',
    },
  },
  
  // Animation durations
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
    pulse: 1500,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export default ANIME_THEME;

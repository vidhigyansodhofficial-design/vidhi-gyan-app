/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// ✅ NEW COLOR PALETTE
const PRIMARY_WHITE = '#FFFFFF';
const ACCENT_YELLOW = '#F5C400';
const TEXT_PRIMARY = '#1C1C1C';
const TEXT_SECONDARY = '#6B6B6B';
const DIVIDERS = '#EDEDED';

export const Colors = {
  light: {
    // Primary colors
    primary: PRIMARY_WHITE,
    accent: ACCENT_YELLOW,
    
    // Text colors
    text: TEXT_PRIMARY,
    textSecondary: TEXT_SECONDARY,
    
    // Background
    background: PRIMARY_WHITE,
    
    // UI Elements
    tint: ACCENT_YELLOW,
    icon: TEXT_SECONDARY,
    tabIconDefault: TEXT_SECONDARY,
    tabIconSelected: ACCENT_YELLOW,
    divider: DIVIDERS,
    
    // Legacy support
    textLegacy: '#11181C',
  },
  dark: {
    // In dark mode, we'll still use the light palette as primary
    primary: PRIMARY_WHITE,
    accent: ACCENT_YELLOW,
    text: TEXT_PRIMARY,
    textSecondary: TEXT_SECONDARY,
    background: PRIMARY_WHITE,
    tint: ACCENT_YELLOW,
    icon: TEXT_SECONDARY,
    tabIconDefault: TEXT_SECONDARY,
    tabIconSelected: ACCENT_YELLOW,
    divider: DIVIDERS,
  },
};

// Export individual colors for easy access
export const Palette = {
  white: PRIMARY_WHITE,
  yellow: ACCENT_YELLOW,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  divider: DIVIDERS,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

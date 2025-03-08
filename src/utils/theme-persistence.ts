/**
 * Utility functions to save and restore theme preferences when changing language
 */

// Use the same key that next-themes uses
const THEME_KEY = 'theme';
const TEMP_THEME_KEY = '__theme_temp';

/**
 * Save current theme to a temporary storage
 * This preserves the theme during navigation/reload
 */
export const saveTheme = (): void => {
  try {
    // Get the current theme directly from next-themes storage
    const currentTheme = localStorage.getItem(THEME_KEY);

    if (currentTheme) {
      // Save to temporary storage that won't be overwritten by next-themes
      localStorage.setItem(TEMP_THEME_KEY, currentTheme);
      console.log(`Theme "${currentTheme}" saved to temporary storage`);
    } else {
      console.log('No theme found to save');
    }
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

/**
 * Get saved theme from temporary storage
 */
export const getSavedTheme = (): string | null => {
  try {
    return localStorage.getItem(TEMP_THEME_KEY);
  } catch (error) {
    console.error('Error getting saved theme:', error);
    return null;
  }
};

/**
 * Apply the saved theme directly and immediately
 * This should be called as soon as possible after page load
 */
export const applyTheme = (): void => {
  try {
    const savedTheme = getSavedTheme();
    if (savedTheme) {
      // Apply directly to next-themes storage
      localStorage.setItem(THEME_KEY, savedTheme);
      console.log(`Applied saved theme: ${savedTheme}`);

      // Apply dark mode class immediately if needed
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }

      // Clear temporary storage
      localStorage.removeItem(TEMP_THEME_KEY);
    }
  } catch (error) {
    console.error('Error applying saved theme:', error);
  }
};

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { designTokens, palettes } from '../theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'actus-theme';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system') setMode(savedMode);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setModePreference = useCallback(async (nextMode) => {
    if (!['light', 'dark', 'system'].includes(nextMode)) return;
    setMode(nextMode);
    try { await AsyncStorage.setItem(STORAGE_KEY, nextMode); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    void setModePreference(mode === 'light' ? 'dark' : 'light');
  }, [mode, setModePreference]);

  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(() => ({
    mode,
    resolvedMode,
    colors: palettes[resolvedMode],
    tokens: designTokens,
    setMode: setModePreference,
    toggleMode,
    ready,
  }), [mode, resolvedMode, ready, setModePreference, toggleMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) || {
    mode: 'system',
    resolvedMode: 'light',
    colors: palettes.light,
    tokens: designTokens,
    setMode: () => {},
    toggleMode: () => {},
    ready: false,
  };
}

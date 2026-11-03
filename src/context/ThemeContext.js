import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes } from '../lib/theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'actus-theme';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'dark' || savedMode === 'light') setMode(savedMode);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    try { await AsyncStorage.setItem(STORAGE_KEY, nextMode); } catch {}
  }, [mode]);

  const value = useMemo(() => ({ mode, colors: palettes[mode], toggleMode, ready }), [mode, ready, toggleMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext) || { mode: 'light', colors: palettes.light, toggleMode: () => {} }; }

import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();

  const toggleDarkLight = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeActions = [
    {
      id: 'toggleDarkLight',
      name: 'Alternar modo claro/escuro',
      shortcut: ['d', 'd'],
      section: 'Tema',
      perform: toggleDarkLight
    },
    {
      id: 'setLightTheme',
      name: 'Ativar tema claro',
      section: 'Tema',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Ativar tema escuro',
      section: 'Tema',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeActions, [theme]);
};

export default useThemeSwitching;

import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeAction = [
    {
      id: 'toggleTheme',
      name: '切换主题',
      shortcut: ['t', 't'],
      section: '主题',
      perform: toggleTheme
    },
    {
      id: 'setLightTheme',
      name: '设置为浅色',
      section: '主题',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: '设置为深色',
      section: '主题',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeAction, [theme]);
};

export default useThemeSwitching;

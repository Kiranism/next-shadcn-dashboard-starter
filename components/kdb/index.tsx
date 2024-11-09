'use client';
import {
  type Action,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  Priority
} from 'kbar';
import RenderResults from './RenderResult';
import useThemeSwitching from './use-theme-switching';
import { useRouter } from 'next/navigation';
import { navItems } from '@/constants/data';
import { useMemo } from 'react';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const actions = useMemo(
    () =>
      navItems.flatMap((navItem) => {
        const baseAction = {
          id: `${navItem.title.toLowerCase()}Action`,
          name: navItem.title,
          shortcut: navItem.shortcut,
          keywords: navItem.title.toLowerCase(),
          section: 'Navigation',
          subtitle: `Go to ${navItem.title}`,
          perform: () => {
            router.push(navItem.url);
          }
        };

        return [
          baseAction,
          ...(navItem?.items?.map((childItem) => ({
            id: `${childItem.title.toLowerCase()}Action`,
            name: childItem.title,
            shortcut: childItem.shortcut,
            keywords: childItem.title.toLowerCase(),
            section: navItem.title,
            subtitle: `Go to ${childItem.title}`,
            perform: () => {
              router.push(childItem.url);
            }
          })) ?? [])
        ];
      }),
    [router]
  );

  return (
    <KBarProvider actions={actions}>
      <ActualComponent>{children}</ActualComponent>
    </KBarProvider>
  );
}
const ActualComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className="scrollbar-hide fixed inset-0 z-[99999] bg-black/40 !p-0 backdrop-blur-sm dark:bg-black/60">
          <KBarAnimator className="relative !mt-64 w-full max-w-[600px] !-translate-y-12 overflow-hidden rounded-lg border bg-white text-foreground shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <div className="bg-white dark:bg-gray-800">
              <div className="border-x-0 border-b-2 dark:border-gray-700">
                <KBarSearch className="w-full border-none bg-white px-6 py-4 text-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 dark:bg-gray-800" />
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};

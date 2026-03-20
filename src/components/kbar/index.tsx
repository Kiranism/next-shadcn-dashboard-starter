'use client';
import { navItems } from '@/config/nav-config';
import { CreateTripDialog } from '@/features/trips/components/create-trip-dialog';
import { useCreateTripDialogStore } from '@/features/trips/stores/use-create-trip-dialog-store';
import { useFilteredNavItems } from '@/hooks/use-nav';
import { usePassengerSearchStore } from '@/features/clients/stores/use-passenger-search-store';
import { PassengerSearchOverlay } from '@/features/clients/components/passenger-search-overlay';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch
} from 'kbar';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';

export default function KBar({
  children,
  docSearchData = []
}: {
  children: React.ReactNode;
  docSearchData?: any[];
}) {
  const router = useRouter();
  const filteredItems = useFilteredNavItems(navItems);

  // These action are for the navigation
  const actions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const navigateActions = filteredItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction =
        navItem.url !== '#'
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: 'Navigation',
              subtitle: `Go to ${navItem.title}`,
              perform: () => navigateTo(navItem.url)
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Go to ${childItem.title}`,
          perform: () => navigateTo(childItem.url)
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });

    const newTripAction = {
      id: 'newTripAction',
      name: 'Neue Fahrt',
      section: 'Aktionen',
      shortcut: ['t', 't'],
      keywords: 'neue fahrt fahrt erstellen',
      subtitle: 'Neue Fahrt von überall erstellen (Schnell: t t)',
      perform: () => {
        // Open the global create-trip dialog without a preset client
        useCreateTripDialogStore.getState().openDialog();
      }
    };

    const passengerSearchAction = {
      id: 'passengerSearchAction',
      name: 'Fahrgast-Suche öffnen',
      section: 'Aktionen',
      keywords: 'fahrgast fahrgäste kunde passenger suche',
      subtitle: 'Fahrgast suchen und Fahrten einsehen',
      perform: () => {
        usePassengerSearchStore.getState().openSearch();
      }
    };

    const docSearchActions = docSearchData.map((data) => ({
      ...data,
      perform: () => router.push(data.url)
    }));

    return [
      newTripAction,
      passengerSearchAction,
      ...navigateActions,
      ...docSearchActions
    ];
  }, [router, filteredItems, docSearchData]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
      <ClientOnlyDialogs />
    </KBarProvider>
  );
}

const ClientOnlyDialogs = () => {
  const [mounted, setMounted] = useState(false);
  const { open, closeDialog, preselectedClientId } = useCreateTripDialogStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <CreateTripDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeDialog();
          }
        }}
        preselectedClientId={preselectedClientId}
      />
      <PassengerSearchOverlay />
    </>
  );
};

const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};

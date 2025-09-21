'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Brain, Play, Users, BarChart, Video, Target, Dumbbell, Heart, GraduationCap, Search, FileText, Calendar } from 'lucide-react';

interface MELCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: 'navigation' | 'analysis' | 'quick-action';
}

export function MELCommandPrompt() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // M.E.L. AI capabilities
  const melCommands: MELCommand[] = [
    {
      id: 'executive-suite',
      label: 'Executive Suite',
      description: 'Power BI dashboards and executive analytics',
      icon: <BarChart className="h-4 w-4" />,
      action: () => router.push('/portal/modules/executive-suite'),
      keywords: ['executive', 'dashboard', 'analytics', 'suite', 'powerbi'],
      category: 'navigation',
    },
    {
      id: 'power-playbooks',
      label: 'Power Playbooks',
      description: 'Interactive digital playbooks with Triangle Defense',
      icon: <Play className="h-4 w-4" />,
      action: () => router.push('/portal/modules/power-playbooks'),
      keywords: ['playbooks', 'plays', 'formations', 'triangle', 'defense'],
      category: 'navigation',
    },
    {
      id: 'mel-ai',
      label: 'M.E.L. AI',
      description: 'AI coaching intelligence and Triangle Defense analysis',
      icon: <Brain className="h-4 w-4" />,
      action: () => router.push('/portal/modules/mel'),
      keywords: ['mel', 'ai', 'coaching', 'intelligence', 'triangle'],
      category: 'navigation',
    },
    {
      id: 'pro-scout',
      label: 'Pro Scout',
      description: 'Professional scouting and opponent analysis',
      icon: <Search className="h-4 w-4" />,
      action: () => router.push('/portal/modules/pro-scout'),
      keywords: ['scout', 'scouting', 'opponent', 'analysis'],
      category: 'navigation',
    },
    {
      id: 'recruit',
      label: 'Recruit',
      description: 'College recruiting and talent evaluation',
      icon: <Users className="h-4 w-4" />,
      action: () => router.push('/portal/modules/recruit'),
      keywords: ['recruit', 'recruiting', 'talent', 'evaluation'],
      category: 'navigation',
    },
    {
      id: 'analyze-formation',
      label: 'Analyze Formation',
      description: 'Get Triangle Defense analysis for any formation',
      icon: <Brain className="h-4 w-4" />,
      action: () => console.log('Analyzing formation...'),
      keywords: ['analyze', 'formation', 'triangle', 'defense'],
      category: 'analysis',
    },
    {
      id: 'create-practice-plan',
      label: 'Create Practice Plan',
      description: 'Generate a new practice plan with M.E.L. AI',
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push('/portal/modules/mel?action=practice-plan'),
      keywords: ['practice', 'plan', 'schedule', 'create'],
      category: 'quick-action',
    },
    {
      id: 'generate-report',
      label: 'Generate Scouting Report',
      description: 'Create opponent scouting report',
      icon: <FileText className="h-4 w-4" />,
      action: () => router.push('/portal/modules/pro-scout?action=report'),
      keywords: ['report', 'scouting', 'opponent', 'generate'],
      category: 'quick-action',
    },
  ];

  const filteredCommands = melCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative">
      <Command className="rounded-lg border border-amt-blue-gray/20 bg-card shadow-lg">
        <CommandInput
          placeholder="Ask M.E.L. to navigate, analyze, or create..."
          value={search}
          onValueChange={setSearch}
          className="h-14 text-lg"
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <Brain className="mx-auto h-8 w-8 text-amt-accent mb-2" />
              <p className="text-muted-foreground">
                M.E.L. AI couldn't find what you're looking for.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try "analyze formation" or "create practice plan"
              </p>
            </div>
          </CommandEmpty>

          {filteredCommands.some((c) => c.category === 'navigation') && (
            <CommandGroup heading="Navigate to Module">
              {filteredCommands
                .filter((c) => c.category === 'navigation')
                .map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.label}
                    onSelect={() => {
                      command.action();
                      setSearch('');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amt-accent/10 text-amt-accent">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{command.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {command.description}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}

          {filteredCommands.some((c) => c.category === 'analysis') && (
            <CommandGroup heading="Analyze with M.E.L.">
              {filteredCommands
                .filter((c) => c.category === 'analysis')
                .map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.label}
                    onSelect={() => {
                      command.action();
                      setSearch('');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amt-red/10 text-amt-red">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{command.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {command.description}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}

          {filteredCommands.some((c) => c.category === 'quick-action') && (
            <CommandGroup heading="Quick Actions">
              {filteredCommands
                .filter((c) => c.category === 'quick-action')
                .map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.label}
                    onSelect={() => {
                      command.action();
                      setSearch('');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amt-blue-gray/10 text-amt-blue-gray">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{command.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {command.description}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Press{' '}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-amt-blue-gray/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>{' '}
        to focus command palette
      </div>
    </div>
  );
}

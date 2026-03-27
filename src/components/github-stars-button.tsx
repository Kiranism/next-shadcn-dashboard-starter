import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── GitHub API helpers (self-contained) ─────────────────────────────────────

interface GitHubRepo {
  fullName: string;
  stars: number;
}

async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.full_name !== 'string' || typeof data.stargazers_count !== 'number') {
      return null;
    }
    return {
      fullName: data.full_name,
      stars: data.stargazers_count
    };
  } catch {
    return null;
  }
}

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}m`;
  }
  if (count >= 1_000) {
    const value = count / 1_000;
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}k`;
  }
  return count.toLocaleString('en-US');
}

// ─── Component ───────────────────────────────────────────────────────────────

type IconStyle = 'currentColor' | 'github' | 'copilot' | 'muted';

function GitHubIcon({
  iconStyle = 'currentColor',
  className
}: {
  iconStyle?: IconStyle;
  className?: string;
}) {
  return (
    <svg
      viewBox='0 0 16 16'
      aria-hidden='true'
      className={cn(
        className,
        iconStyle === 'github' && 'text-[#0FBF3E]',
        iconStyle === 'copilot' && 'text-[#8534F3]',
        iconStyle === 'muted' && 'opacity-50 grayscale'
      )}
      fill='currentColor'
    >
      <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
    </svg>
  );
}

const githubStarsButtonVariants = cva(
  'inline-flex items-center shrink-0 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        default:
          'rounded-md border border-border bg-muted/50 text-muted-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
        primary: 'rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'rounded-md border border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        outline:
          'rounded-md border border-border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        ghost:
          'rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        subtle:
          'rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
      },
      size: {
        sm: 'h-7 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5',
        default: 'h-8 gap-2 px-3 text-sm [&_svg]:size-4',
        lg: 'h-9 gap-2.5 px-4 text-sm [&_svg]:size-4'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

interface GitHubStarsButtonProps
  extends
    Omit<React.ComponentProps<'a'>, 'children'>,
    VariantProps<typeof githubStarsButtonVariants> {
  owner: string;
  repo: string;
  stars?: number;
  showRepo?: boolean;
  iconStyle?: IconStyle;
}

async function GitHubStarsButton({
  owner,
  repo,
  stars: starsProp,
  showRepo = false,
  iconStyle = 'currentColor',
  variant,
  size,
  className,
  ...props
}: GitHubStarsButtonProps) {
  const data = starsProp == null ? await fetchGitHubRepo(owner, repo) : null;
  const stars = starsProp ?? data?.stars ?? null;
  const fullName = data?.fullName ?? `${owner}/${repo}`;

  return (
    <a
      href={`https://github.com/${owner}/${repo}`}
      target='_blank'
      rel='noopener noreferrer'
      data-slot='github-stars-button'
      aria-label={`${fullName} on GitHub${stars !== null ? ` — ${stars.toLocaleString('en-US')} stars` : ''}`}
      className={cn(githubStarsButtonVariants({ variant, size, className }))}
      {...props}
    >
      <GitHubIcon iconStyle={iconStyle} className='shrink-0' />
      {showRepo && <span>{fullName}</span>}
      {stars !== null && (
        <>
          {showRepo && <span className='bg-border h-3.5 w-px shrink-0' aria-hidden='true' />}
          <span className='tabular-nums'>{formatCount(stars)}</span>
        </>
      )}
    </a>
  );
}

export { GitHubStarsButton, githubStarsButtonVariants, type GitHubStarsButtonProps };

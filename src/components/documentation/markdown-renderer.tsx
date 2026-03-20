import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  IconInfoCircle,
  IconAlertTriangle,
  IconBulb
} from '@tabler/icons-react';
import React from 'react';
import { cn } from '@/lib/utils';
import {
  URGENCY_STYLES,
  type UrgencyLevelKey
} from '../../features/trips/constants/urgency-config';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className='prose prose-slate dark:prose-invert prose-headings:font-bold prose-p:leading-8 prose-li:my-2 prose-strong:text-foreground prose-a:text-primary max-w-none'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            return (
              <h1
                id={id}
                className='mt-12 mb-6 text-4xl font-black tracking-tight'
              >
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            return (
              <h2
                id={id}
                className='mt-12 mb-6 border-b pb-3 text-3xl font-bold tracking-tight'
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className='mt-10 mb-4 text-2xl font-semibold tracking-tight'>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className='text-muted-foreground/90 mb-6 text-lg leading-8 font-normal'>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className='mb-8 list-disc space-y-3 pl-8'>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-8 list-decimal space-y-3 pl-8'>{children}</ol>
          ),
          li: ({ children }) => (
            <li className='text-muted-foreground/90 text-lg tracking-wide'>
              {children}
            </li>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            const content = String(children);

            // Check for urgency indicator pattern: urgency:upcoming, urgency:imminent, etc.
            if (isInline && content.startsWith('urgency:')) {
              const level = content.split(':')[1] as UrgencyLevelKey;
              const style = URGENCY_STYLES[level];

              if (style) {
                return (
                  <span className='inline-flex items-center gap-1.5 font-medium'>
                    <span className={cn('h-2 w-2 rounded-full', style.bg)} />
                    <span className={cn('text-xs', style.color)}>
                      {style.label}
                    </span>
                  </span>
                );
              }
            }

            return isInline ? (
              <code className='bg-muted rounded px-1.5 py-0.5 font-mono text-sm'>
                {children}
              </code>
            ) : (
              <pre className='bg-muted my-4 overflow-x-auto rounded-lg p-4'>
                <code className='font-mono text-sm'>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => {
            const childrenArray = React.Children.toArray(children);
            const firstChild = childrenArray[0] as any;

            // Check if the first child is a paragraph containing an alert marker
            const firstChildContent = firstChild?.props?.children;
            const contentString = Array.isArray(firstChildContent)
              ? firstChildContent.join('')
              : typeof firstChildContent === 'string'
                ? firstChildContent
                : '';

            const alertMatch = contentString.match(
              /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i
            );

            if (alertMatch) {
              const type = alertMatch[1].toUpperCase();
              const remainingChildren = React.Children.map(
                children,
                (child: any, i) => {
                  if (i === 0) {
                    const props = { ...child.props };
                    if (typeof props.children === 'string') {
                      props.children = props.children.replace(
                        /^\[!.*?\]\s*/i,
                        ''
                      );
                    } else if (Array.isArray(props.children)) {
                      const newChildren = [...props.children];
                      if (typeof newChildren[0] === 'string') {
                        newChildren[0] = newChildren[0].replace(
                          /^\[!.*?\]\s*/i,
                          ''
                        );
                      }
                      props.children = newChildren;
                    }
                    return React.cloneElement(child, props);
                  }
                  return child;
                }
              );

              const alertConfigs: Record<
                string,
                {
                  icon: any;
                  color: string;
                  bg: string;
                  border: string;
                  title: string;
                }
              > = {
                NOTE: {
                  icon: IconInfoCircle,
                  color: 'text-blue-500',
                  bg: 'bg-blue-500/10',
                  border: 'border-blue-500/20',
                  title: 'Note'
                },
                TIP: {
                  icon: IconBulb,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/20',
                  title: 'Tip'
                },
                IMPORTANT: {
                  icon: IconAlertTriangle,
                  color: 'text-indigo-500',
                  bg: 'bg-indigo-500/10',
                  border: 'border-indigo-500/20',
                  title: 'Important'
                },
                WARNING: {
                  icon: IconAlertTriangle,
                  color: 'text-amber-500',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/20',
                  title: 'Warning'
                },
                CAUTION: {
                  icon: IconAlertTriangle,
                  color: 'text-red-500',
                  bg: 'bg-red-500/10',
                  border: 'border-red-500/20',
                  title: 'Caution'
                }
              };

              const alertConfig = alertConfigs[type] || alertConfigs.NOTE;

              const Icon = alertConfig.icon;

              return (
                <Alert
                  className={cn(
                    'my-6 border-l-4',
                    alertConfig.bg,
                    alertConfig.border
                  )}
                >
                  <Icon className={cn('h-4 w-4', alertConfig.color)} />
                  <AlertTitle
                    className={cn('text-sm font-semibold', alertConfig.color)}
                  >
                    {alertConfig.title}
                  </AlertTitle>
                  <AlertDescription className='text-muted-foreground'>
                    {remainingChildren}
                  </AlertDescription>
                </Alert>
              );
            }

            return (
              <blockquote className='border-primary my-6 border-l-4 pl-4 italic'>
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className='border-muted/60 bg-background/20 my-8 overflow-x-auto rounded-xl border shadow-sm backdrop-blur-sm'>
              <table className='w-full border-collapse text-left text-sm'>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className='bg-muted/40 border-muted/60 border-b'>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className='text-foreground bg-muted/20 px-6 py-4 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase'>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className='border-muted/30 text-muted-foreground/90 border-b px-6 py-4 align-top leading-relaxed last:border-b-0'>
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className='hover:bg-muted/20 transition-colors duration-200'>
              {children}
            </tr>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

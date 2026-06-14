'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecentProject } from '../data-access';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export function RecentProjects({ projects }: { projects: RecentProject[] }) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <Card className='h-full border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50'>
        <CardHeader>
          <CardTitle>Недавние проекты</CardTitle>
          <CardDescription>
            Здесь появятся ваши последние проекты
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-[200px] items-center justify-center text-sm text-zinc-500'>
          Нет активных проектов
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='glass-card col-span-1 h-full border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold'>
          Недавние проекты
        </CardTitle>
        <CardDescription>
          Последние запущенные программы лояльности
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {projects.map((project, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={project.id}
              className='group flex items-center justify-between'
            >
              <div className='flex items-center space-x-4'>
                <div className='relative'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'>
                    <Star className='h-5 w-5 fill-white/20' />
                  </div>
                  {project.botStatus === 'ACTIVE' && (
                    <span className='absolute -right-1 -bottom-1 flex h-3 w-3'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
                      <span className='relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900'></span>
                    </span>
                  )}
                </div>

                <div className='space-y-1'>
                  <button
                    type='button'
                    className='cursor-pointer rounded text-left text-sm leading-none font-medium text-zinc-900 transition-colors group-hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-zinc-100 dark:group-hover:text-indigo-400'
                    onClick={() =>
                      router.push(`/dashboard/projects/${project.id}`)
                    }
                  >
                    {project.name}
                  </button>
                  <div className='flex items-center text-xs text-zinc-500 dark:text-zinc-400'>
                    <span>{project.userCount} участников</span>
                    <span className='mx-1.5 h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700' />
                    <span>
                      {formatDistanceToNow(new Date(project.createdAt), {
                        addSuffix: true,
                        locale: ru
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'>
                <Badge
                  variant={
                    project.botStatus === 'ACTIVE' ? 'default' : 'secondary'
                  }
                  className='hidden sm:inline-flex'
                >
                  {project.botStatus === 'ACTIVE' ? 'Активен' : 'Остановлен'}
                </Badge>
                <button
                  type='button'
                  aria-label={`Открыть проект ${project.name}`}
                  onClick={() =>
                    router.push(`/dashboard/projects/${project.id}`)
                  }
                  className='rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                >
                  <ExternalLink className='h-4 w-4' />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

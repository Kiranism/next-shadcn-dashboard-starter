/**
 * @file: dashboard-welcome.tsx
 * @description: Приветственный экран для новых пользователей без проектов
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui, lucide-react, framer-motion
 * @created: 2026-06-11
 * @author: AI Assistant + User
 */

'use client';

import Link from 'next/link';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Plus,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const steps = [
  { step: 1, title: 'Создайте проект', description: 'Название и домен сайта' },
  { step: 2, title: 'Подключите бота', description: 'Telegram для клиентов' },
  { step: 3, title: 'Настройте бонусы', description: 'Процент и срок действия' }
] as const;

const features = [
  {
    icon: Zap,
    title: 'Быстрый старт',
    description: 'Создайте проект и подключите бота за несколько минут',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    icon: SlidersHorizontal,
    title: 'Гибкие настройки',
    description: 'Процент бонусов, срок действия и режимы начисления',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  },
  {
    icon: CheckCircle2,
    title: 'Готовые шаблоны',
    description: 'Используйте шаблоны ботов и сценариев из библиотеки',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  }
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function DashboardWelcome() {
  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <Heading
        title='Добро пожаловать в Gupil'
        description='Создайте первый проект, чтобы запустить бонусную программу для вашего бизнеса'
      />

      <Separator />

      <Card className='glass-card border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-base font-medium'>
            Как начать работу
          </CardTitle>
          <CardDescription>
            Три шага до запуска программы лояльности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 sm:grid-cols-3'>
            {steps.map((step) => (
              <div key={step.step} className='flex items-start gap-3'>
                <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
                  {step.step}
                </div>
                <div>
                  <p className='text-sm font-medium'>{step.title}</p>
                  <p className='text-muted-foreground text-xs'>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <motion.div
        variants={container}
        initial='hidden'
        animate='show'
        className='grid gap-4 md:grid-cols-3'
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={item}>
            <Card className='glass-card h-full border-zinc-200 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50'>
              <CardHeader className='pb-3'>
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bgColor}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <CardTitle className='text-base'>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Card className='border-primary/20 bg-primary/5 border-dashed'>
        <CardContent className='flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left'>
          <div className='flex items-start gap-4'>
            <div className='bg-primary/10 text-primary hidden rounded-xl p-3 sm:block'>
              <Bot className='h-6 w-6' />
            </div>
            <div className='space-y-1'>
              <p className='font-medium'>Готовы начать?</p>
              <p className='text-muted-foreground text-sm'>
                Укажите название и домен — остальное можно настроить позже
              </p>
            </div>
          </div>
          <div className='flex shrink-0 flex-col gap-2 sm:flex-row'>
            <Button asChild size='lg'>
              <Link href='/dashboard/projects?create=true'>
                <Plus className='mr-2 h-4 w-4' />
                Создать первый проект
              </Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='/docs'>
                <BookOpen className='mr-2 h-4 w-4' />
                Документация
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

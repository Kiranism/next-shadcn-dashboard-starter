/**
 * @file: homepage-pricing.tsx
 * @description: Секция тарифов — данные из БД (синхрон с биллингом)
 * @project: SaaS Bonus System
 * @dependencies: React, Next.js, db, billing-plan.utils
 * @created: 2026-01-06
 * @updated: 2026-06-06
 * @author: AI Assistant + User
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { formatPlan, toNumber } from '@/lib/services/billing-plan.utils';

const FALLBACK_PLANS = [
  {
    name: 'Free',
    priceLabel: '0 ₽',
    period: '/мес',
    description: 'Для тестирования и небольших проектов',
    features: ['1 проект', '10 пользователей', 'Email поддержка'],
    popular: false,
    cta: 'Начать'
  },
  {
    name: 'Pro',
    priceLabel: '2 990 ₽',
    period: '/мес',
    description: 'Для растущих бизнесов',
    features: [
      '5 проектов',
      '1000 пользователей на проект',
      'Аналитика',
      'Приоритетная поддержка'
    ],
    popular: true,
    cta: 'Начать'
  },
  {
    name: 'Enterprise',
    priceLabel: '9 990 ₽',
    period: '/мес',
    description: 'Для крупных компаний',
    features: [
      '10 проектов',
      'Безлимит пользователей',
      'Кастомные интеграции',
      'Персональный менеджер',
      'SLA 99.9%'
    ],
    popular: false,
    cta: 'Связаться'
  }
];

const formatPrice = (price: number, currency: string, interval: string) => {
  if (price <= 0) {
    return { priceLabel: '0 ₽', period: '' };
  }

  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);

  return {
    priceLabel: formatted,
    period: interval === 'year' ? '/год' : '/мес'
  };
};

export async function HomepagePricing() {
  let plans: Array<{
    name: string;
    priceLabel: string;
    period: string;
    description: string;
    features: string[];
    popular: boolean;
    cta: string;
  }> = FALLBACK_PLANS;

  try {
    const dbPlans = await db.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' }
    });

    if (dbPlans.length > 0) {
      plans = dbPlans.map((plan) => {
        const formatted = formatPlan(plan);
        const { priceLabel, period } = formatPrice(
          toNumber(plan.price),
          plan.currency,
          plan.interval
        );

        return {
          name: formatted.name,
          priceLabel,
          period,
          description: formatted.description ?? '',
          features:
            formatted.features.length > 0
              ? formatted.features
              : [
                  `${formatted.limits.projects === -1 ? '∞' : formatted.limits.projects} проектов`,
                  `${formatted.limits.users === -1 ? '∞' : formatted.limits.users} пользователей`,
                  `${formatted.limits.bots === -1 ? '∞' : formatted.limits.bots} Telegram ботов`
                ],
          popular: formatted.popular ?? false,
          cta: plan.slug === 'enterprise' ? 'Связаться' : 'Начать'
        };
      });
    }
  } catch {
    // Fallback при недоступности БД (build/SSG)
  }

  return (
    <section id='pricing' className='bg-white py-24'>
      <div className='mx-auto max-w-[1200px] px-6'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-[40px] leading-[1.15] font-semibold tracking-[-0.02em] text-[#1A1A1A]'>
            Простые и понятные тарифы
          </h2>
          <p className='mx-auto max-w-md text-lg text-[#666666]'>
            Выберите план, который подходит вашему бизнесу
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.popular
                  ? 'bg-[#1A1A1A] text-white shadow-2xl shadow-black/20'
                  : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]'
              }`}
            >
              {plan.popular && (
                <div className='absolute -top-3 left-8 rounded-full bg-[#FF4D00] px-4 py-1 text-xs font-medium text-white'>
                  Популярный
                </div>
              )}

              <p
                className={`mb-2 text-[13px] font-medium tracking-wider uppercase ${
                  plan.popular ? 'text-[#666666]' : 'text-[#999999]'
                }`}
              >
                {plan.name}
              </p>

              <div className='mb-2'>
                <span
                  className={`text-4xl font-semibold ${
                    plan.popular ? 'text-white' : 'text-[#1A1A1A]'
                  }`}
                >
                  {plan.priceLabel}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ${
                      plan.popular ? 'text-[#666666]' : 'text-[#999999]'
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <p
                className={`mb-8 text-[15px] ${
                  plan.popular ? 'text-[#999999]' : 'text-[#666666]'
                }`}
              >
                {plan.description}
              </p>

              <ul className='mb-8 space-y-3'>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-3'>
                    <Check
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                        plan.popular ? 'text-[#FF4D00]' : 'text-emerald-500'
                      }`}
                    />
                    <span
                      className={`text-[15px] ${
                        plan.popular ? 'text-[#CCCCCC]' : 'text-[#666666]'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-full py-6 text-[15px] font-medium ${
                  plan.popular
                    ? 'bg-[#FF4D00] text-white hover:bg-[#E64500]'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#333333]'
                }`}
              >
                <Link href='/auth/sign-up' className='flex items-center gap-2'>
                  {plan.cta}
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * @file: src/app/widget/[id]/route.ts
 * @description: Короткая ссылка-роут, который отдаёт бутлоадер виджета
 *   Пример использования: <script src="https://gupil.ru/widget/<projectId>"></script>
 *   Скрипт загружает public/tilda-bonus-widget.js и инициализирует его с projectId
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router
 * @created: 2025-09-22
 * @author: AI Assistant + User
 */

import { NextResponse, NextRequest } from 'next/server';
import { withApiRateLimit } from '@/lib';

// Генерируем компактный JS-лоадер с подстановкой projectId
function generateBootloaderJs(projectId: string, widgetVersion = 'v=5') {
  const js = `(()=>{try{var origin;(function(){try{var cur=document.currentScript;if(cur&&cur.src){origin=new URL(cur.src,window.location.href).origin;}else{origin=window.location.origin;}}catch(_){origin=window.location.origin;}})();var s=document.createElement('script');s.src=origin+'/tilda-bonus-widget.js?${widgetVersion}';s.async=true;s.onload=function(){try{if(window.TildaBonusWidget){window.TildaBonusWidget.init({projectId:'${projectId}',apiUrl:origin,bonusToRuble:1,minOrderAmount:100,debug:false});}}catch(_){}};document.head.appendChild(s);}catch(_){}})();`;
  return js;
}

async function handler(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(_req.url);
  const v = url.searchParams.get('v') || 'v=5';

  const js = generateBootloaderJs(id, v);

  const headers: Record<string, string> = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=86400, immutable', // 24h
    'X-Content-Type-Options': 'nosniff'
  };

  return new NextResponse(js, { status: 200, headers });
}

export const GET = withApiRateLimit(handler);

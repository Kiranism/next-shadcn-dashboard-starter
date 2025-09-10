/**
 * @file: ecosystem.config.cjs
 * @description: PM2 ecosystem config — единая точка запуска prod без доп. команд
 * @project: SaaS Bonus System
 * @dependencies: PM2, Node.js 20+
 * @created: 2025-09-08
 * @author: AI Assistant + User
 */

module.exports = {
  apps: [
    {
      name: 'bonus-app',
      // Продакшн запуск standalone-сборки Next.js
      // См. предупреждение: "next start" не совместим с output: standalone
      script: '.next/standalone/server.js',
      args: '',
      cwd: '/opt/next-shadcn-dashboard-starter',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      time: true,
      wait_ready: false,
      autorestart: true,
      max_restarts: 10,
      watch: false
    }
  ]
};



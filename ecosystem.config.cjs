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
      script: 'yarn',
      args: 'start',
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



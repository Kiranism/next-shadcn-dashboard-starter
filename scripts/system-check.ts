/**
 * @file: system-check.ts
 * @description: Скрипт для проверки всей системы после внедрения изменений
 * @project: SaaS Bonus System
 * @dependencies: db, services
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { db } from '../src/lib/db';
import { ProjectService } from '../src/lib/services/project.service';
import { UserService } from '../src/lib/services/user.service';
import { logger } from '../src/lib/logger';

interface SystemCheckResult {
  component: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
}

class SystemChecker {
  private results: SystemCheckResult[] = [];

  private addResult(
    component: string,
    status: 'OK' | 'WARNING' | 'ERROR',
    message: string,
    details?: any
  ) {
    this.results.push({ component, status, message, details });
    const icon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${component}: ${message}`);
    if (details) {
      console.log(`   Детали:`, details);
    }
  }

  async checkDatabase() {
    try {
      // Проверка подключения к БД
      await db.$queryRaw`SELECT 1`;
      this.addResult('Database', 'OK', 'Подключение к базе данных работает');

      // Проверка основных таблиц
      const tables = ['Project', 'User', 'Bonus', 'Transaction', 'BotSettings'];
      for (const table of tables) {
        try {
          const count = await (db as any)[table.toLowerCase()].count();
          this.addResult(
            `Table ${table}`,
            'OK',
            `Таблица доступна (${count} записей)`
          );
        } catch (error) {
          this.addResult(
            `Table ${table}`,
            'ERROR',
            'Таблица недоступна',
            error
          );
        }
      }
    } catch (error) {
      this.addResult('Database', 'ERROR', 'Ошибка подключения к БД', error);
    }
  }

  async checkApiEndpoints() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006';

    const endpoints = [
      { path: '/api/projects', method: 'GET', name: 'Projects API' },
      { path: '/health', method: 'GET', name: 'Health Check' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          this.addResult(
            `API ${endpoint.name}`,
            'OK',
            `${endpoint.method} ${endpoint.path} работает`
          );
        } else {
          this.addResult(
            `API ${endpoint.name}`,
            'WARNING',
            `${endpoint.method} ${endpoint.path} вернул ${response.status}`
          );
        }
      } catch (error) {
        this.addResult(
          `API ${endpoint.name}`,
          'ERROR',
          `Ошибка запроса к ${endpoint.path}`,
          error
        );
      }
    }
  }

  async checkServices() {
    try {
      // Проверка ProjectService
      const projectsData = await ProjectService.getProjects();
      const projects = projectsData.projects;
      this.addResult(
        'ProjectService',
        'OK',
        `Сервис проектов работает (${projects.length} проектов)`
      );

      if (projects.length > 0) {
        const firstProject = projects[0];

        // Проверка UserService
        try {
          const usersCount = await db.user.count({
            where: { projectId: firstProject.id }
          });
          this.addResult(
            'UserService',
            'OK',
            `Пользователи в БД (${usersCount} пользователей)`
          );
        } catch (error) {
          this.addResult(
            'UserService',
            'WARNING',
            'Ошибка получения пользователей',
            error
          );
        }
      }
    } catch (error) {
      this.addResult('Services', 'ERROR', 'Ошибка проверки сервисов', error);
    }
  }

  async checkFileSystem() {
    const fs = require('fs');
    const path = require('path');

    const requiredFiles = [
      'public/tilda-bonus-widget.js',
      'public/test-tilda.html',
      'src/lib/rate-limiter.ts',
      'src/lib/error-handler.ts',
      'src/lib/with-rate-limit.ts',
      'docs/tasks-to-complete.md'
    ];

    for (const file of requiredFiles) {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          this.addResult(
            `File ${file}`,
            'OK',
            `Файл существует (${Math.round(stats.size / 1024)}KB)`
          );
        } else {
          this.addResult(`File ${file}`, 'ERROR', 'Файл не найден');
        }
      } catch (error) {
        this.addResult(`File ${file}`, 'ERROR', 'Ошибка проверки файла', error);
      }
    }
  }

  async checkEnvironment() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ];

    const optionalEnvVars = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SENTRY_DSN'];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult(
          `Env ${envVar}`,
          'OK',
          'Переменная окружения установлена'
        );
      } else {
        this.addResult(
          `Env ${envVar}`,
          'ERROR',
          'Обязательная переменная окружения не установлена'
        );
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addResult(
          `Env ${envVar}`,
          'OK',
          'Опциональная переменная установлена'
        );
      } else {
        this.addResult(
          `Env ${envVar}`,
          'WARNING',
          'Опциональная переменная не установлена'
        );
      }
    }
  }

  async checkRateLimiting() {
    try {
      const { defaultLimiter } = await import('../src/lib/rate-limiter');
      const stats = defaultLimiter.getStats();
      this.addResult('Rate Limiter', 'OK', `Rate limiter работает`, stats);
    } catch (error) {
      this.addResult(
        'Rate Limiter',
        'ERROR',
        'Ошибка загрузки rate limiter',
        error
      );
    }
  }

  async run() {
    console.log('🚀 Запуск полной проверки системы SaaS Bonus System...\n');

    await this.checkEnvironment();
    await this.checkDatabase();
    await this.checkServices();
    await this.checkFileSystem();
    await this.checkRateLimiting();
    // await this.checkApiEndpoints(); // Закомментировано, так как требует запущенного сервера

    console.log('\n📊 Результаты проверки:');
    console.log('='.repeat(50));

    const okCount = this.results.filter((r) => r.status === 'OK').length;
    const warningCount = this.results.filter(
      (r) => r.status === 'WARNING'
    ).length;
    const errorCount = this.results.filter((r) => r.status === 'ERROR').length;

    console.log(`✅ Успешно: ${okCount}`);
    console.log(`⚠️  Предупреждения: ${warningCount}`);
    console.log(`❌ Ошибки: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n🔴 Критические ошибки:');
      this.results
        .filter((r) => r.status === 'ERROR')
        .forEach((r) => console.log(`   - ${r.component}: ${r.message}`));
    }

    if (warningCount > 0) {
      console.log('\n🟡 Предупреждения:');
      this.results
        .filter((r) => r.status === 'WARNING')
        .forEach((r) => console.log(`   - ${r.component}: ${r.message}`));
    }

    const overallStatus =
      errorCount === 0 ? 'HEALTHY' : errorCount < 3 ? 'DEGRADED' : 'CRITICAL';
    console.log(`\n🎯 Общий статус системы: ${overallStatus}`);

    if (overallStatus === 'HEALTHY') {
      console.log('\n🎉 Система готова к работе!');
      console.log('📋 Следующие шаги:');
      console.log('   1. Запустите сервер: yarn dev');
      console.log('   2. Создайте тестовый проект');
      console.log(
        '   3. Протестируйте Tilda интеграцию на /public/test-tilda.html'
      );
      console.log("   4. Проверьте webhook'ы и API");
    }

    // Закрываем подключение к БД
    await db.$disconnect();

    return {
      overall: overallStatus,
      results: this.results,
      summary: { ok: okCount, warnings: warningCount, errors: errorCount }
    };
  }
}

// Запуск если скрипт выполняется напрямую
if (require.main === module) {
  const checker = new SystemChecker();
  checker.run().catch((error) => {
    console.error('❌ Критическая ошибка при проверке системы:', error);
    process.exit(1);
  });
}

export default SystemChecker;

import { db } from '../src/lib/db';

async function checkBotSettings() {
  try {
    console.log('Проверяем настройки ботов...\n');

    const settings = await db.botSettings.findMany();

    console.log('Bot Settings:');
    settings.forEach(
      (s: {
        projectId: string;
        botToken: string | null;
        botUsername: string | null;
        isActive: boolean;
      }) => {
        console.log(`- Project ID: ${s.projectId}`);
        console.log(`  Bot Token: ${s.botToken ? '✅ Есть' : '❌ Нет'}`);
        console.log(`  Bot Username: ${s.botUsername || 'не установлен'}`);
        console.log(`  Is Active: ${s.isActive}`);
        console.log('');
      }
    );
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkBotSettings();

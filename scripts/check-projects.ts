import { db } from '../src/lib/db';

async function checkProjects() {
  try {
    console.log('Проверяем проекты...\n');

    const projects = await db.project.findMany({
      where: { isActive: true },
      include: { botSettings: true }
    });

    console.log('Активные проекты:');
    projects.forEach(
      (p: {
        id: string;
        name: string;
        botToken: string | null;
        botUsername: string | null;
        botSettings: any | null;
      }) => {
        console.log(`- ${p.name} (ID: ${p.id})`);
        console.log(`  Bot Token: ${p.botToken ? '✅ Есть' : '❌ Нет'}`);
        console.log(`  Bot Username: ${p.botUsername || 'не установлен'}`);
        console.log(`  Bot Settings: ${p.botSettings ? '✅ Есть' : '❌ Нет'}`);
        console.log('');
      }
    );
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkProjects();

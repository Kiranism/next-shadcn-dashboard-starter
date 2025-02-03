import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 清除现有数据
  await prisma.user.deleteMany();

  // 创建测试用户数据
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      roleId: 1,
      isAdmin: true
    },
    {
      username: 'zhangsan',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      roleId: 2,
      isAdmin: false
    },
    {
      username: 'lisi',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
      roleId: 3,
      isAdmin: false
    },
    {
      username: 'wangwu',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
      roleId: 3,
      isAdmin: false
    },
    {
      username: 'zhaoliu',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
      roleId: 3,
      isAdmin: false
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        username: user.username,
        password: hashedPassword,
        image: user.image,
        roleId: user.roleId,
        isAdmin: user.isAdmin
      }
    });
    console.log(`Created user: ${user.username}`);
  }

  // 创建测试分镜头数据
  const scenes = [
    {
      name: '美白霜介绍 第3分镜',
      dialogue:
        '亲们，大家好，我是你们的化妆师小明，今天我要给大家介绍一款全新的化妆品，这款化妆品不仅能够让你变得更加美丽，还能够让你变得更加自信。',
      duration: 15.5,
      size: 1024000,
      resolution: '1920x1080',
      startTime: 0.0,
      endTime: 15.5
    },
    {
      name: '防晒霜介绍 第1分镜',
      dialogue: '30秒防晒霜涂在手上',
      duration: 15.5,
      size: 1024000,
      resolution: '1920x1080',
      startTime: 2.0,
      endTime: 5.5
    },
    {
      name: '隔离霜介绍 第2分镜',
      dialogue: '这个产品是隔离霜，它能够隔离紫外线，保护我们的皮肤不受伤害。',
      duration: 15.5,
      size: 1024000,
      resolution: '1920x1080',
      startTime: 6.0,
      endTime: 15.5
    },
    {
      name: '隔离霜介绍 第3分镜',
      dialogue:
        '这个美白霜简直是太神奇了，我用了之后，皮肤变得白皙透亮，而且没有任何副作用。',
      duration: 20.3,
      size: 1536000,
      resolution: '1920x1080',
      startTime: 15.5,
      endTime: 35.8
    },
    {
      name: '隔离霜使用教程 第1分镜',
      dialogue:
        '这个产品的价格非常实惠，性价比非常高，非常适合我们这些普通消费者。',
      duration: 25.7,
      size: 2048000,
      resolution: '1920x1080',
      startTime: 35.8,
      endTime: 61.5
    }
  ];

  // Create scenes first and store their IDs
  const createdScenes = [];
  for (const scene of scenes) {
    const createdScene = await prisma.scene.create({
      data: scene
    });
    createdScenes.push(createdScene);
    console.log(`Created scene: ${createdScene.name}`);
  }

  // 创建测试任务数据
  const adminUser = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  const wangwuUser = await prisma.user.findUnique({
    where: { username: 'wangwu' }
  });
  const zhaoliuUser = await prisma.user.findUnique({
    where: { username: 'zhaoliu' }
  });

  if (!adminUser) throw new Error('Admin user not found');

  const tasks = [
    {
      description: '美白霜介绍 第1分镜 膏体涂在手上',
      videoUrl: 'https://example.com/scenes/intro.mp4',
      sceneNumber: 1,
      status: 'PENDING' as const,
      createdByUserId: adminUser.id,
      assignedToUserId: null,
      sceneId: createdScenes[0].id
    },
    {
      description: '防晒霜介绍 第1分镜 防晒霜涂在手上',
      videoUrl: 'https://example.com/scenes/intro.mp4',
      sceneNumber: 1,
      status: 'PENDING' as const,
      createdByUserId: adminUser.id,
      assignedToUserId: null,
      sceneId: createdScenes[1].id
    },
    {
      description: '隔离霜介绍 第1分镜 隔离霜涂在手上',
      videoUrl: 'https://example.com/scenes/intro.mp4',
      sceneNumber: 1,
      status: 'PENDING' as const,
      createdByUserId: adminUser.id,
      assignedToUserId: null,
      sceneId: createdScenes[2].id
    },
    {
      description: '隔离霜介绍 第3分镜 隔离霜涂在手上',
      videoUrl: 'https://example.com/scenes/features.mp4',
      sceneNumber: 2,
      status: 'ASSIGNED' as const,
      createdByUserId: adminUser.id,
      assignedToUserId: adminUser.id,
      sceneId: createdScenes[3].id
    },
    {
      description: '隔离霜使用教程 第1分镜 隔离霜涂在手上',
      videoUrl: 'https://example.com/scenes/tutorial.mp4',
      sceneNumber: 3,
      status: 'IN_PROGRESS' as const,
      createdByUserId: adminUser.id,
      assignedToUserId: null,
      sceneId: createdScenes[4].id
    }
  ];

  // Create tasks
  for (const task of tasks) {
    const createdTask = await prisma.sceneTask.create({
      data: task
    });
    console.log(`Created task: ${createdTask.description}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

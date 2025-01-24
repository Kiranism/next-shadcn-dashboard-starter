import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 清除现有数据
  await prisma.user.deleteMany()

  // 创建测试用户数据
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    },
    {
      username: 'zhangsan',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
    },
    {
      username: 'lisi',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi'
    },
    {
      username: 'wangwu',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu'
    },
    {
      username: 'zhaoliu',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu'
    }
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    await prisma.user.create({
      data: {
        username: user.username,
        password: hashedPassword,
        image: user.image
      }
    })
    console.log(`Created user: ${user.username}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return new NextResponse('Missing username or password', { status: 400 })
    }

    // 验证用户名长度
    if (username.length < 3) {
      return new NextResponse('Username must be at least 3 characters', { status: 400 })
    }

    // 验证密码长度
    if (password.length < 6) {
      return new NextResponse('Password must be at least 6 characters', { status: 400 })
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        username
      }
    })

    if (existingUser) {
      return new NextResponse('Username already exists', { status: 400 })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` // 基于用户名生成头像
      }
    })

    // 不在响应中返回密码
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Registration error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

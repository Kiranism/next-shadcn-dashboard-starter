import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { deletedAt: null };
    
    if (search) {
      const cpfClean = search.replace(/\D/g, '');
      if (cpfClean.length >= 3) {
        where.cpf = { contains: cpfClean };
      } else {
        where.nomeCompleto = { contains: search, mode: 'insensitive' };
      }
    }

    // Get total count
    const total = await prisma.cliente.count({ where });

    // Get clientes with related data
    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        telefones: {
          where: { deletedAt: null },
          orderBy: { ranking: 'desc' },
          take: 1
        },
        enderecos: {
          where: { deletedAt: null },
          take: 1
        },
        dataNasc: true
      },
      skip,
      take: limit,
      orderBy: { nomeCompleto: 'asc' }
    });

    return NextResponse.json({
      clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get clientes error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { cpf, nomeCompleto, telefone, endereco, dataNasc } = body;

    if (!cpf || !nomeCompleto) {
      return NextResponse.json(
        { error: 'CPF e nome completo são obrigatórios' },
        { status: 400 }
      );
    }

    // Clean CPF
    const cpfClean = cpf.replace(/\D/g, '');

    // Check if cliente already exists
    const existing = await prisma.cliente.findUnique({
      where: { cpf: cpfClean }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cliente com este CPF já existe' },
        { status: 400 }
      );
    }

    // Create cliente with related data
    const cliente = await prisma.cliente.create({
      data: {
        cpf: cpfClean,
        nomeCompleto,
        ...(telefone && {
          telefones: {
            create: {
              telefone: telefone.numero,
              tipo: telefone.tipo || 'celular',
              ranking: 1
            }
          }
        }),
        ...(endereco && {
          enderecos: {
            create: endereco
          }
        }),
        ...(dataNasc && {
          dataNasc: {
            create: {
              dataNasc: dataNasc.data,
              idade: dataNasc.idade
            }
          }
        })
      },
      include: {
        telefones: true,
        enderecos: true,
        dataNasc: true
      }
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    console.error('Create cliente error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

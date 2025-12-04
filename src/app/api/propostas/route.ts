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
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { deletedAt: null };
    
    if (search) {
      const cpfClean = search.replace(/\D/g, '');
      where.OR = [
        { clienteNomeCompleto: { contains: search, mode: 'insensitive' } },
        { clienteCpf: { contains: cpfClean } },
        { codigoUnico: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.proposta.count({ where });

    // Get propostas with related data
    const propostas = await prisma.proposta.findMany({
      where,
      include: {
        cliente: {
          select: {
            cpf: true,
            nomeCompleto: true
          }
        },
        tabela: {
          select: {
            id: true,
            nome: true,
            banco: true,
            orgao: true
          }
        },
        boletos: {
          where: { deletedAt: null }
        },
        rpcs: {
          where: { deletedAt: null }
        }
      },
      skip,
      take: limit,
      orderBy: { dataProposta: 'desc' }
    });

    return NextResponse.json({
      propostas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get propostas error:', error);
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
    const { 
      clienteCpf, 
      clienteNomeCompleto, 
      tabelaId, 
      orgao, 
      banco, 
      tipo, 
      prazo, 
      valorParcela,
      ...rest 
    } = body;

    if (!clienteCpf || !clienteNomeCompleto) {
      return NextResponse.json(
        { error: 'CPF e nome do cliente são obrigatórios' },
        { status: 400 }
      );
    }

    // Clean CPF
    const cpfClean = clienteCpf.replace(/\D/g, '');

    // Create proposta
    const proposta = await prisma.proposta.create({
      data: {
        clienteCpf: cpfClean,
        clienteNomeCompleto,
        tabelaId,
        orgao,
        banco,
        tipo: tipo || 'novo',
        prazo,
        valorParcela,
        responsavelUsuario: session.username,
        status: 'AGUARD_DIGITACAO',
        ...rest
      },
      include: {
        cliente: true,
        tabela: true
      }
    });

    return NextResponse.json({ proposta }, { status: 201 });
  } catch (error) {
    console.error('Create proposta error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

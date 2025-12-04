import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@webconsig.com',
      password: hashedPassword,
      nome: 'Administrador',
      isAdmin: true,
      isActive: true
    }
  });

  console.log('✅ Admin user created:', admin.username);

  // Create default permissions
  const permissions = [
    { code: 'clientes.view', name: 'Visualizar Clientes', module: 'clientes', description: 'Permite visualizar clientes' },
    { code: 'clientes.create', name: 'Criar Cliente', module: 'clientes', description: 'Permite criar novos clientes' },
    { code: 'clientes.edit', name: 'Editar Cliente', module: 'clientes', description: 'Permite editar clientes' },
    { code: 'clientes.delete', name: 'Excluir Cliente', module: 'clientes', description: 'Permite excluir clientes' },
    { code: 'propostas.view', name: 'Visualizar Propostas', module: 'propostas', description: 'Permite visualizar propostas' },
    { code: 'propostas.create', name: 'Criar Proposta', module: 'propostas', description: 'Permite criar novas propostas' },
    { code: 'propostas.edit', name: 'Editar Proposta', module: 'propostas', description: 'Permite editar propostas' },
    { code: 'propostas.delete', name: 'Excluir Proposta', module: 'propostas', description: 'Permite excluir propostas' },
    { code: 'propostas.averbar', name: 'Averbar Proposta', module: 'propostas', description: 'Permite averbar propostas' },
    { code: 'users.view', name: 'Visualizar Usuários', module: 'users', description: 'Permite visualizar usuários' },
    { code: 'users.create', name: 'Criar Usuário', module: 'users', description: 'Permite criar novos usuários' },
    { code: 'users.edit', name: 'Editar Usuário', module: 'users', description: 'Permite editar usuários' },
    { code: 'users.delete', name: 'Excluir Usuário', module: 'users', description: 'Permite excluir usuários' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create default groups
  const adminGroup = await prisma.userGroup.upsert({
    where: { name: 'Administradores' },
    update: {},
    create: {
      name: 'Administradores',
      description: 'Grupo com acesso total ao sistema',
      isActive: true,
      isSystem: true
    }
  });

  const userGroup = await prisma.userGroup.upsert({
    where: { name: 'Usuários' },
    update: {},
    create: {
      name: 'Usuários',
      description: 'Grupo de usuários padrão',
      isActive: true,
      isSystem: true
    }
  });

  console.log('✅ Created default groups');

  // Assign all permissions to admin group
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: adminGroup.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        groupId: adminGroup.id,
        permissionId: perm.id
      }
    });
  }

  // Add admin user to admin group
  await prisma.userGroupMember.upsert({
    where: {
      userId_groupId: {
        userId: admin.id,
        groupId: adminGroup.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      groupId: adminGroup.id
    }
  });

  console.log('✅ Assigned permissions and group memberships');

  // Create sample data
  console.log('🌱 Creating sample data...');

  // Sample cliente
  const sampleCliente = await prisma.cliente.upsert({
    where: { cpf: '12345678900' },
    update: {},
    create: {
      cpf: '12345678900',
      nomeCompleto: 'João da Silva Santos',
      telefones: {
        create: {
          telefone: '21987654321',
          tipo: 'celular',
          ranking: 1
        }
      },
      dataNasc: {
        create: {
          dataNasc: '1980-05-15',
          idade: 44
        }
      }
    }
  });

  console.log('✅ Sample cliente created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

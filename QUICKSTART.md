# 🚀 Guia Rápido de Início - Webconsig v2.1

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL (ou usar `npx prisma dev` para PostgreSQL local)
- npm ou yarn

## Instalação Rápida

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

#### Opção A: PostgreSQL Local Automático (Recomendado para Desenvolvimento)

```bash
# Inicia PostgreSQL local automaticamente
npx prisma dev
```

#### Opção B: Usar seu próprio PostgreSQL

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/webconsig"
JWT_SECRET="mude-para-um-secret-seguro"
```

### 3. Criar Tabelas e Dados Iniciais

```bash
# Gera o Prisma Client
npm run prisma:generate

# Cria as tabelas e popula com dados iniciais
npm run db:setup
```

Este comando:
- ✅ Cria todas as tabelas no banco
- ✅ Cria usuário admin (username: `admin`, senha: `admin123`)
- ✅ Cria permissões e grupos padrão
- ✅ Cria dados de exemplo

### 4. Iniciar o Projeto

```bash
# Modo desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

## 🔐 Login

Use as credenciais padrão:

```
Usuário: admin
Senha: admin123
```

⚠️ **IMPORTANTE:** Altere a senha após o primeiro acesso!

## 📁 Estrutura Principal

```
src/
├── app/
│   ├── api/              # Backend API Routes
│   │   ├── auth/        # Login, logout, sessão
│   │   ├── clientes/    # CRUD de clientes
│   │   └── propostas/   # CRUD de propostas
│   └── dashboard/        # Páginas do Dashboard
│       ├── clientes/    # Página de clientes
│       ├── propostas/   # Página de propostas
│       └── kanban/      # Kanban board
├── lib/
│   ├── prisma.ts        # Cliente Prisma
│   └── auth.ts          # Utilitários JWT
prisma/
├── schema.prisma        # Schema do banco
└── seed.ts             # Script de dados iniciais
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Prisma
npm run prisma:generate   # Gera o cliente Prisma
npm run prisma:push       # Sincroniza schema com o banco (dev)
npm run prisma:migrate    # Cria migration
npm run prisma:seed       # Popula banco com dados

# Banco de dados completo
npm run db:setup          # Push + Seed

# Code Quality
npm run lint              # Verifica erros
npm run lint:fix          # Corrige erros
npm run format            # Formata código
```

## 📊 Módulos Disponíveis

### 1. Dashboard Overview
- URL: `/dashboard/overview`
- Visão geral do sistema

### 2. Clientes
- URL: `/dashboard/clientes`
- API: `GET /api/clientes`, `POST /api/clientes`
- Cadastro completo: CPF, nome, telefone, endereço, etc.

### 3. Propostas
- URL: `/dashboard/propostas`
- API: `GET /api/propostas`, `POST /api/propostas`
- Workflow com 18 status diferentes
- Controle de RPCs, boletos e comissões

### 4. Kanban
- URL: `/dashboard/kanban`
- Quadro visual drag & drop
- Gerenciamento de tarefas

## 🔐 API de Autenticação

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Verificar Sessão

```bash
GET /api/auth/me
```

### Logout

```bash
POST /api/auth/logout
```

## 🗄️ Exemplos de API

### Listar Clientes

```bash
GET /api/clientes?search=joao&page=1&limit=20
```

### Criar Cliente

```bash
POST /api/clientes
Content-Type: application/json

{
  "cpf": "12345678900",
  "nomeCompleto": "João da Silva",
  "telefone": {
    "numero": "21987654321",
    "tipo": "celular"
  }
}
```

### Listar Propostas

```bash
GET /api/propostas?status=AGUARD_DIGITACAO&page=1&limit=20
```

### Criar Proposta

```bash
POST /api/propostas
Content-Type: application/json

{
  "clienteCpf": "12345678900",
  "clienteNomeCompleto": "João da Silva",
  "tipo": "novo",
  "banco": "Banco do Brasil",
  "orgao": "INSS",
  "prazo": 84,
  "valorParcela": 500.00
}
```

## 🛠️ Troubleshooting

### Erro: "Can't reach database server"

```bash
# Verifique se o PostgreSQL está rodando
# Ou inicie o PostgreSQL local do Prisma:
npx prisma dev
```

### Erro: "Prisma Client is not generated"

```bash
npm run prisma:generate
```

### Erro: "Table does not exist"

```bash
# Recrie o banco de dados
npm run db:setup
```

### Resetar Banco de Dados

```bash
# Apaga e recria tudo
npx prisma db push --force-reset
npm run prisma:seed
```

## 📚 Documentação Adicional

- **MIGRATION.md** - Detalhes completos da migração do Flask para Next.js
- **README.md** - Visão geral e recursos do projeto
- [Prisma Docs](https://www.prisma.io/docs) - Documentação do Prisma ORM
- [Next.js Docs](https://nextjs.org/docs) - Documentação do Next.js
- [Shadcn UI](https://ui.shadcn.com) - Componentes de UI

## 🎯 Próximos Passos

1. ✅ Login com admin/admin123
2. ✅ Explorar o Dashboard
3. ✅ Testar as APIs com ferramentas como Postman ou Insomnia
4. ✅ Ver o Kanban funcionando
5. ⏭️ Implementar tabelas de dados nas páginas
6. ⏭️ Customizar conforme suas necessidades

## 💡 Dicas

- Use `npx prisma studio` para visualizar o banco de dados em uma interface web
- O Kanban salva estado localmente no navegador (Zustand)
- JWT tokens expiram em 7 dias
- Todas as senhas são hasheadas com bcrypt
- Use o Prisma Client para queries type-safe

---

**Desenvolvido com ❤️ usando Next.js, Prisma e Shadcn UI**

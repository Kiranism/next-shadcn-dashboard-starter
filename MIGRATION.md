# Migração do Backend - Sistema Webconsig

## Visão Geral

Este projeto migrou o backend Flask do [webconsig_v2](https://github.com/josecarlosdvf/webconsig_v2) para uma aplicação Next.js full-stack, mantendo o frontend como base.

## Mudanças Realizadas

### Backend

1. **Banco de Dados**
   - Criado schema Prisma com todos os modelos do sistema Flask
   - Suporte para PostgreSQL (pode ser adaptado para SQL Server)
   - Modelos principais:
     - Users (Usuários e autenticação)
     - Clientes (gestão de clientes com CPF como chave)
     - Propostas (propostas de empréstimo consignado)
     - Tabelas (configurações de empréstimo)
     - Sistema de permissões (RBAC)

2. **API Routes**
   - `/api/auth/login` - Autenticação com JWT
   - `/api/auth/logout` - Logout
   - `/api/auth/me` - Informações do usuário atual
   - `/api/clientes` - CRUD de clientes
   - `/api/propostas` - CRUD de propostas

3. **Autenticação**
   - Migrado de Flask-Login para JWT
   - Tokens armazenados em cookies HTTP-only
   - Sessões de 7 dias

### Frontend

1. **Menu de Navegação**
   - Removido: "Product" (dados mock)
   - Adicionado: "Clientes" - Gestão de clientes
   - Adicionado: "Propostas" - Gestão de propostas
   - Mantido: "Kanban" - Quadro Kanban existente
   - Atualizado: Menu de conta para português

2. **Dados**
   - Removidos todos os dados mock (recentSalesData, fakeProducts)
   - Criados tipos TypeScript para Cliente e Proposta
   - Adicionada configuração de status de propostas

## Configuração

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL (ou outro banco suportado pelo Prisma)
- npm ou yarn

### 2. Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp env.example.txt .env

# Editar .env com suas configurações
nano .env
```

### 3. Configurar Banco de Dados

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/webconsig"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 4. Inicializar Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar tabelas e dados iniciais
npm run db:setup
```

Este comando criará:
- Todas as tabelas do sistema
- Usuário admin (username: `admin`, password: `admin123`)
- Permissões padrão
- Grupos de usuários
- Dados de exemplo

### 5. Executar o Projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Acesse: http://localhost:3000

## Credenciais Padrão

- **Usuário:** admin
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha após o primeiro acesso!

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Autenticação
│   │   ├── clientes/          # Gestão de clientes
│   │   └── propostas/         # Gestão de propostas
│   ├── dashboard/             # Páginas do dashboard
│   └── auth/                  # Páginas de autenticação
├── lib/
│   ├── prisma.ts              # Cliente Prisma
│   └── auth.ts                # Utilitários de autenticação
├── components/                # Componentes React
├── features/                  # Features do dashboard
│   ├── kanban/               # Kanban board (mantido)
│   └── ...
└── constants/
    └── data.ts               # Dados e configurações

prisma/
├── schema.prisma             # Schema do banco de dados
└── seed.ts                   # Script de seed
```

## Módulos do Sistema

### 1. Clientes
- Cadastro completo com CPF
- Telefones, endereços, emails
- Dados bancários e matrículas
- Documentos de identidade

### 2. Propostas
- Gestão de propostas de empréstimo
- Workflow com 18 status diferentes
- Vínculos com tabelas e bancos
- Controle de comissões
- Gestão de RPCs (Refinanciamento/Portabilidade/Cartão)
- Boletos e comprovantes

### 3. Kanban
- Mantido do projeto original
- Drag & Drop com dnd-kit
- Persistência local com Zustand

### 4. Autenticação
- Sistema de usuários e grupos
- Permissões granulares (RBAC)
- JWT com cookies seguros

## Próximos Passos

1. **Frontend:**
   - Criar páginas de listagem de Clientes
   - Criar páginas de listagem de Propostas
   - Integrar formulários com a API
   - Atualizar dashboard com dados reais

2. **Backend:**
   - Adicionar mais endpoints (tabelas, configurações, relatórios)
   - Implementar upload de arquivos
   - Adicionar middleware de autenticação nas rotas
   - Implementar sistema de logs

3. **Testes:**
   - Adicionar testes unitários
   - Adicionar testes de integração
   - Configurar CI/CD

## Migração de Dados

Para migrar dados do sistema Flask antigo para este novo sistema:

1. Exporte os dados do banco SQL Server original
2. Transforme os dados para o formato do novo schema
3. Use o Prisma para importar os dados

Scripts de migração podem ser criados conforme necessário.

## Suporte

Para questões ou problemas:
1. Verifique a documentação do Prisma: https://www.prisma.io/docs
2. Verifique a documentação do Next.js: https://nextjs.org/docs
3. Abra uma issue no repositório

## Licença

MIT License - Livre para uso comercial e pessoal.

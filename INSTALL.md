# Guia de Instalação e Deploy

## Pré-requisitos

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+
- Conta no [Supabase](https://supabase.com) (banco de dados + storage)
- Conta no [Resend](https://resend.com) (envio de e-mails)
- Conta na [Vercel](https://vercel.com) (deploy, opcional)

---

## 1. Configuração Inicial

### Clone / Abra o Projeto

```bash
cd SistemaNewsletter
```

### Instale as dependências

```bash
npm install
```

---

## 2. Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` preenchendo todas as variáveis:

| Variável | Onde obter |
|----------|-----------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection String (Transaction Pooler) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection String (Session Mode / Direct) |
| `AUTH_SECRET` | `openssl rand -base64 32` no terminal |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `RESEND_API_KEY` | Resend → API Keys |

---

## 3. Supabase Storage

No painel do Supabase, crie um bucket chamado `reconhecimento`:

1. Storage → New Bucket
2. Nome: `reconhecimento`
3. Marque como **Privado** (Private)
4. Policies: adicione política de acesso com `service_role` para INSERT/SELECT

---

## 4. Banco de Dados (Prisma)

Execute as migrations para criar o schema:

```bash
npm run db:migrate
```

> Este comando roda `prisma migrate deploy` que aplica todas as migrations em `prisma/migrations/`.

Popule o banco com dados iniciais:

```bash
npm run db:seed
```

Ao final do seed, as credenciais de acesso serão exibidas no console.

### Credenciais padrão após seed:

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@empresa.com | Admin@123456 |
| Diretor | diretor1@empresa.com | Diretor@123 |
| Gestor | gestor1@empresa.com | Gestor@123 |
| Colaborador | colaborador1@empresa.com | Colab@123 |

> Altere todas as senhas imediatamente após o primeiro acesso em produção.

---

## 5. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 6. Build de Produção

```bash
npm run build
npm start
```

---

## 7. Deploy na Vercel

### Via CLI:

```bash
npm install -g vercel
vercel
```

### Via GitHub:

1. Suba o código para um repositório GitHub
2. Importe na Vercel: vercel.com/new
3. Configure as variáveis de ambiente no painel da Vercel
4. A Vercel detecta automaticamente Next.js

### Variáveis na Vercel:

Adicione todas as variáveis de `.env.example` nas configurações do projeto:
**Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

---

## 8. Pós-Deploy

Após o primeiro deploy em produção:

1. Execute as migrations no banco de produção:
   ```bash
   vercel env pull .env.production
   DATABASE_URL=<url_producao> npx prisma migrate deploy
   ```

2. Execute o seed (apenas uma vez):
   ```bash
   DATABASE_URL=<url_producao> npx ts-node prisma/seed.ts
   ```

3. Altere as senhas padrão acessando `/settings/profile`

4. Configure os prazos em `/settings/deadlines`

5. Cadastre áreas e usuários reais em `/areas` e `/users`

---

## 9. Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Inicia servidor de produção |
| `npm run db:migrate` | Aplica migrations no banco |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:reset` | **CUIDADO**: Apaga e recria o banco |
| `npm test` | Executa testes unitários |
| `npm run test:e2e` | Executa testes E2E (Playwright) |

---

## 10. Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          # Páginas de autenticação
│   ├── (dashboard)/     # Páginas protegidas
│   └── api/             # API Routes
├── components/
│   ├── ui/              # ShadCN components
│   ├── layout/          # Sidebar, Header, RightPanel
│   ├── compliments/     # Módulo de Elogios
│   ├── trainings/       # Módulo de Treinamentos
│   ├── rankings/        # Módulo de Rankings
│   ├── users/           # Gestão de Usuários
│   ├── areas/           # Gestão de Áreas
│   ├── notifications/   # Notificações
│   ├── audit/           # Auditoria
│   ├── reports/         # Relatórios
│   └── settings/        # Configurações
├── lib/
│   ├── auth/            # Auth.js config + session helpers
│   ├── db/              # Prisma client
│   ├── email/           # Templates + envio via Resend
│   ├── storage/         # Upload para Supabase Storage
│   ├── utils/           # Ranking, deadlines, quarters
│   └── validations/     # Schemas Zod
├── services/            # Camada de serviços (business logic)
│   ├── compliment.service.ts
│   ├── training.service.ts
│   ├── ranking.service.ts
│   ├── notification.service.ts
│   ├── audit.service.ts
│   ├── dashboard.service.ts
│   ├── user.service.ts
│   └── area.service.ts
└── middleware.ts         # RBAC + proteção de rotas
prisma/
├── schema.prisma         # Schema completo do banco
├── seed.ts               # Dados iniciais
└── migrations/           # Histórico de migrations
```

---

## 11. Fluxo de Elogios

```
COLLABORATOR registra → PENDENTE_APROVACAO
    ↓ MANAGER aprova
PENDENTE_AVALIACAO
    ↓ DIRECTOR avalia + atribui medalha
AVALIADO (🏆 Especial | 🥇 Ouro | 🥈 Prata | 🥉 Bronze)

MANAGER pode:
  - Rejeitar → REJEITADO
  - Devolver → DEVOLVIDO_PARA_AJUSTE (colaborador edita → volta para PENDENTE_APROVACAO)
```

---

## 12. Sistema de Pontos

| Medalha | Pontos |
|---------|--------|
| 🏆 Especial | 10 pts |
| 🥇 Ouro | 7 pts |
| 🥈 Prata | 5 pts |
| 🥉 Bronze | 3 pts |

Desempate: Medalhas Especiais → Medalhas Ouro → Total de Elogios → Total de Treinamentos

---

## 13. Perfis e Permissões

| Perfil | Permissões |
|--------|-----------|
| COLLABORATOR | Registrar elogios/treinamentos, ver próprio dashboard e rankings |
| MANAGER | Aprovar/rejeitar/devolver elogios da equipe |
| DIRECTOR | Avaliar elogios com medalha, ver ranking da área |
| ADMIN | Acesso total: usuários, áreas, auditoria, relatórios, prazos |

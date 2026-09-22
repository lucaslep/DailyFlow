# TaskPulse

Aplicação full-stack para gerenciamento de tarefas e acompanhamento de produtividade.

## Funcionalidades

- Cadastro e login com senha criptografada e JWT
- Sessão protegida por cookie `HttpOnly`
- Recuperação de senha por e-mail
- Administração e bloqueio de usuários
- Proteção contra excesso de tentativas e headers de segurança
- Tarefas isoladas por usuário
- Criação, edição, conclusão e exclusão de tarefas
- Prioridades, status e prazos
- Dashboard com totais, tarefas atrasadas e taxa de conclusão
- Tema claro e escuro
- Ambiente completo com Docker Compose
- Blueprint para deploy no Render

## Tecnologias

- React 19, TypeScript e Vite
- Node.js, Express e TypeScript
- Prisma ORM e PostgreSQL 17
- bcryptjs e jose
- Docker, Nginx e Render Blueprint

## Execução local

### Sem Docker

Crie `backend/.env` a partir de `backend/.env.example` e configure o PostgreSQL.

```powershell
cd backend
npm install
npm exec prisma migrate deploy
npm run dev
```

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3333
- Saúde da API: http://localhost:3333/health

### Com Docker

Opcionalmente, crie `.env` na raiz a partir de `.env.example`. Depois execute:

```powershell
docker compose up --build
```

- Aplicação: http://localhost:8080
- API: http://localhost:3333

## Deploy no Render

O arquivo `render.yaml` cria uma aplicação web e um PostgreSQL gerenciado. No painel do Render:

1. Envie o repositório para um provedor Git compatível.
2. Crie um novo Blueprint apontando para o repositório.
3. Confirme os recursos encontrados no `render.yaml`.
4. Inicie o deploy.

O deploy executa as migrations automaticamente antes de iniciar a aplicação. O segredo JWT é gerado pela própria plataforma e o banco não aceita conexões externas.

Consulte [docs/PRODUCAO.md](docs/PRODUCAO.md) para configurar e homologar uma entrega para cliente.

## Variáveis de ambiente

Backend:

- `DATABASE_URL`: conexão PostgreSQL.
- `JWT_SECRET`: segredo com pelo menos 32 caracteres.
- `PORT`: porta HTTP; padrão `3333`.
- `CORS_ORIGIN`: origens permitidas, separadas por vírgula.

Frontend:

- `VITE_API_URL`: endereço da API. Quando vazio, usa a mesma origem da página.

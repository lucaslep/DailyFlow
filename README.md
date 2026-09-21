# TaskPulse

TaskPulse é uma aplicação de gerenciamento de tarefas focada em produtividade. O projeto permite criar, editar, concluir e excluir tarefas, além de definir prioridades, status e prazos.

A aplicação foi desenvolvida com React, Node.js, TypeScript, Express, Prisma e PostgreSQL. Futuramente, também contará com Python para análise de produtividade e geração de métricas.

## 🚀 Tecnologias

Frontend:
- React
- TypeScript
- Vite
- CSS

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM

Banco de dados:
- PostgreSQL

Planejado:
- Python
- FastAPI
- Pandas
- Docker

## 📌 Funcionalidades

O TaskPulse permite:

- Criar tarefas
- Editar tarefas
- Excluir tarefas
- Marcar tarefas como concluídas
- Definir prioridade
- Definir status
- Definir prazo de conclusão
- Persistir os dados no PostgreSQL

Os status disponíveis são:

```text
TODO
IN_PROGRESS
DONE
```

As prioridades disponíveis são:

LOW
MEDIUM
HIGH

🧱 Estrutura
taskpulse/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── database/
│       │   └── prisma.ts
│       ├── routes/
│       │   └── task.routes.ts
│       └── server.ts
│
└── frontend/
    └── src/
        ├── services/
        │   └── api.ts
        ├── types/
        │   └── Task.ts
        ├── App.tsx
        ├── App.css
        └── main.tsx

Arquitetura atual:

React
  ↓
Node.js + Express
  ↓
Prisma
  ↓
PostgreSQL

Arquitetura planejada:

React
  ↓
Node.js + Express
  ↓
PostgreSQL
  ↓
Python Analytics

⚙️ Como executar

Clone o projeto:

git clone SEU_LINK_DO_REPOSITORIO
cd taskpulse

Configure o backend:

cd backend
npm install

Crie um arquivo .env:

DATABASE_URL="postgresql://postgres:masterkey@localhost:5432/productivity_manager?schema=public"

Execute as migrations:

npx prisma migrate dev
npx prisma generate

Inicie o backend:

npm run dev

Em outro terminal, inicie o frontend:

cd frontend
npm install
npm run dev

A aplicação estará disponível normalmente em:

Frontend: http://localhost:5173
Backend:  http://localhost:3333

Importante: não envie o arquivo .env para o GitHub.

📈 Status e próximos passos

Status atual:

Node.js       ✅
TypeScript    ✅
Express       ✅
PostgreSQL    ✅
Prisma        ✅
React         ✅
CRUD          ✅
Python        ⏳
Dashboard     ⏳
Autenticação  ⏳
Docker        ⏳
Deploy        ⏳

Próximas funcionalidades planejadas:

Dashboard de produtividade
Filtros por prioridade e status
Tarefas atrasadas
Taxa de conclusão
Gráficos de produtividade
Autenticação com JWT
Projetos e categorias
Análise de dados com Python
Docker
Testes automatizados
Deploy

Desenvolvido por Lucas Lepore como projeto de estudo e portfólio.

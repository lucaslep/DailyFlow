# Entrega em produção

## Arquitetura

O cliente acessa a aplicação pelo navegador. Docker, Node.js e PostgreSQL ficam no servidor, não na máquina do cliente.

## Variáveis obrigatórias

- `DATABASE_URL`: fornecida pelo PostgreSQL gerenciado.
- `JWT_SECRET`: segredo aleatório gerado pela plataforma.
- `APP_URL`: URL pública HTTPS da aplicação.
- `CORS_ORIGIN`: o mesmo endereço definido em `APP_URL`.
- `ADMIN_EMAILS`: e-mails que devem receber perfil administrativo ao se cadastrarem.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`: credenciais do serviço de e-mail.
- `EMAIL_FROM`: remetente verificado usado na recuperação de senha.

Nunca armazene valores reais dessas variáveis no Git.

## Publicação no Render

1. Envie a branch `main` ao GitHub.
2. No Render, crie um Blueprint usando o repositório.
3. Preencha as variáveis marcadas como secretas pelo `render.yaml`.
4. Use inicialmente a URL fornecida pelo Render em `APP_URL` e `CORS_ORIGIN`.
5. Após configurar domínio próprio, atualize ambas as variáveis para o domínio HTTPS.
6. Cadastre a conta cujo e-mail consta em `ADMIN_EMAILS`.
7. Teste login, recuperação de senha, tarefas e administração.

## Backup

- Use um plano PostgreSQL com retenção e backups compatíveis com o contrato do cliente.
- Faça uma restauração de teste antes da entrega.
- Registre responsável, periodicidade, retenção e procedimento de recuperação.
- Não use `docker compose down -v` em ambientes com dados reais.

## Checklist de homologação

- Domínio e HTTPS ativos.
- Remetente SMTP verificado.
- Recuperação de senha recebida e validada.
- Administrador criado e usuário comum sem acesso administrativo.
- Dados de usuários diferentes isolados.
- Backup e restauração testados.
- Política de privacidade e canal de suporte informados ao cliente.
- Monitoramento de disponibilidade e erros configurado.
- Aceite formal do cliente registrado.


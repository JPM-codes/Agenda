# Minha Agenda

Aplicativo pessoal para organizar sua rotina de trabalho: controle de expediente, agenda, tarefas, lembretes, anotações, dicas e favoritos.

## Tecnologias

- [Next.js 16](https://nextjs.org) (App Router, API Routes)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- SQLite via `node:sqlite` (embutido no Node.js, sem dependência nativa)
- PWA mínimo (`manifest.webmanifest` + `icon.svg`)

O banco de dados fica em `data/agenda.db` e é criado automaticamente no primeiro uso. Não há configuração de variáveis de ambiente.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), crie sua conta e comece a usar.

### Produção

```bash
npm run build
npm start
```

## Comandos

| Comando            | Descrição                         |
| ------------------ | --------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento       |
| `npm run build`    | Build de produção                 |
| `npm start`        | Servidor de produção              |
| `npm run lint`     | ESLint                            |
| `npx tsc --noEmit` | Verificação de tipos              |

## Funcionalidades

- **Autenticação**: cadastro, login e logout com sessões (cookie httpOnly, senha com scrypt).
- **Expediente**: check-in, início/fim de almoço e check-out com cálculo automático do total trabalhado.
- **Agenda**: visualização por dia, semana e mês.
- **Tarefas**: com data, prioridade, categoria e favoritas.
- **Lembretes**: com status (agendado / concluído / arquivado).
- **Anotações**: com opção de fixar.
- **Dicas**: sugestões registradas ao longo do dia.
- **Favoritos**: central de itens favoritados (tarefas, lembretes, anotações e dicas).
- **Pesquisa global**: busca em todos os módulos.
- **Configurações**: perfil, tema claro/escuro e troca de senha.
- **Responsivo**: sidebar no desktop, navegação inferior no mobile.

## Estrutura

```
app/          Páginas (App Router) e API Routes em app/api
components/   Componentes de UI e visões de cada módulo
lib/          Banco, autenticação, regras de negócio e utilitários
data/         Banco SQLite local (ignorado pelo git)
```

## Sobre o GitHub

O banco local em `data/` é ignorado pelo versionamento, então não precisa se preocupar com seus dados pessoais ao fazer push. Para publicar:

```bash
git init
git add .
git commit -m "Minha Agenda"
git remote add origin <url-do-repositorio>
git push -u origin main
```
"# Agenda" 

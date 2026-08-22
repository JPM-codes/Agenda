# Reordenar navbar mobile

## Objetivo
Ordem no bottom nav mobile: Início, Agenda, (+), Tarefas, Mais.

## Arquivo alterado
`components/layout/mobile-nav.tsx` (único arquivo)

## Passos

1. Substituir constante (linha 13):
   ```ts
   // antes
   const PRIMARY = ["/dashboard", "/agenda", "/tarefas"];

   // depois
   const PRIMARY_LEFT = ["/dashboard", "/agenda"];
   const PRIMARY_RIGHT = ["/tarefas"];
   ```

2. Atualizar listas no corpo do componente (linhas 22-23):
   ```ts
   const left = NAV_ITEMS.filter((i) => PRIMARY_LEFT.includes(i.href));
   const right = NAV_ITEMS.filter((i) => PRIMARY_RIGHT.includes(i.href));
   const secondary = NAV_ITEMS.filter(
     (i) => !PRIMARY_LEFT.includes(i.href) && !PRIMARY_RIGHT.includes(i.href)
   );
   ```

3. Reordenar o grid de 5 colunas (linhas 34-71):
   `{left.map(...)}` → botão FAB (+) → `{right.map(...)}` → botão "Mais"

## Sem alterações
- Visual do FAB (`h-11 w-11 -translate-y-4`), cores ativas, sheet de ações rápidas, menu "Mais", tema/logout.
- Nenhum outro arquivo. Projeto não será iniciado/reiniciado.

## Verificação
`npx tsc --noEmit` (typecheck) — sem iniciar o dev server.

# Controle financeiro

Sistema pessoal para controlar gastos: parcelas automáticas, gastos recorrentes, salário, saúde do mês, gráficos, simulador "e se eu comprar?" e backup.

## Estrutura

```
index.html        página única
manifest.webmanifest + sw.js + icons/   app instalável e offline (PWA)
vendor/chart.umd.js   Chart.js 4.4.1 local (sem CDN)
css/styles.css    estilos (claro/escuro automático)
js/utils.js       formatação, datas, avisos
js/state.js       estado, salvamento local, desfazer
js/calc.js        cálculos: salário, parcelas, recorrência, saúde do mês
js/ui.js          tela principal
js/charts.js      gráficos
js/expenses.js    cadastro, edição e exclusão de gastos
js/simulator.js   simulador de compra
js/backup.js      backup, restauração e envio ao GitHub
js/settings.js    categorias e salários editáveis
js/app.js         inicialização
```

Sem build e sem dependências locais: abra `index.html` ou publique no GitHub Pages (Settings > Pages > branch principal, pasta raiz). O Chart.js é local (`vendor/`), então o app roda offline depois da primeira visita (HTTPS, como no GitHub Pages). No celular, use *Adicionar à tela inicial*. Ao publicar mudanças, aumente `V` em `sw.js` para forçar a atualização.

## Teto saudável

Em Opções e backup você define o teto (50% a 95% do salário, padrão 70%). Indicador, gráficos, análise e simulador usam esse valor.

## Dados e backup

Os dados ficam no navegador (localStorage). Limpar o histórico apaga tudo, por isso:

- **Exportar backup (.json):** em Opções e backup. No celular abre o compartilhamento.
- **Restaurar de arquivo:** escolha o .json; o sistema mostra o resumo e pede confirmação.
- **Backup automático no GitHub (opcional):** crie um repositório privado, gere um token fine-grained com permissão *Contents: read and write* só nele e cole em Opções e backup. A cada alteração são enviados `financeiro-latest.json` e `historico/financeiro-AAAA-MM-DD.json`.
- **Depois de limpar o navegador:** cole o token, use *Restaurar o último backup do GitHub* e só depois lance novos gastos.

Offline, as alterações ficam no aparelho e o envio ao GitHub acontece quando a internet volta.

Todo excluir e todo editar mostram **Desfazer** por alguns segundos.

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
js/tabs.js        abas e botão de ocultar valores
js/quick.js       novo gasto rápido, categoria automática e atalhos
js/lock.js        bloqueio por PIN
js/version.js     versão do app (aumente a cada publicação)
js/config.js      URL e chave do Supabase
js/cloud.js       banco online (Supabase)
supabase/schema.sql  tabelas e regras do banco
```

Sem build e sem dependências locais: abra `index.html` ou publique no GitHub Pages (Settings > Pages > branch principal, pasta raiz). O Chart.js é local (`vendor/`), então o app roda offline depois da primeira visita (HTTPS, como no GitHub Pages). No celular, use *Adicionar à tela inicial*. Ao publicar mudanças, aumente `APP_VERSION` em `js/version.js` e use o botão **Atualizar versão** no rodapé do app para baixar a versão nova (seus dados não são apagados).

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

## Banco online (Supabase)

1. Crie o projeto no Supabase e, em **SQL Editor**, cole e rode `supabase/schema.sql`.
2. Em **Authentication > Users**, crie seu usuário (e-mail e senha). Em **Authentication > Sign In / Providers**, desligue novos cadastros para manter o banco só seu.
3. Em **Project Settings > API**, copie a URL e a chave *publishable* (ou anon) para `js/config.js`. Nunca use a chave secret/service_role.
4. Publique no GitHub, abra o app e entre em **Opções > Banco online**.

O app salva no aparelho e envia ao banco alguns segundos depois de cada alteração; sem internet, envia quando voltar. Se dois aparelhos mudarem os dados, o app pergunta qual versão manter. O banco guarda versões anteriores em `financeiro_historico`. O backup em arquivo e no GitHub continua funcionando junto.

## Gastos de outras pessoas

No campo **De quem é o gasto?** informe o nome (vazio = seu). Esses gastos não entram nos seus totais, no indicador, nos gráficos nem no simulador. Ficam num quadro à parte com o valor a receber de cada pessoa; marque como reembolsado quando ela pagar.

## Parcelas

Em ✎, altere o número de parcelas de uma compra e escolha entre manter o valor da parcela ou manter o total.

## Abas, lançamento rápido e privacidade

- **Abas:** Início (veredito, 3 números e atalhos), Gastos, Análises (simulador e gráficos) e Opções. O botão **+** no centro abre o novo gasto em qualquer aba.
- **Novo gasto:** pede só nome e valor (Enter lança). Categoria, parcelas, recorrente, mês e "de quem é" ficam em **Mais opções**.
- **Categoria automática:** aprende com o seu histórico e, sem histórico, usa palavras-chave (gasolina → Transporte). Se você escolher a categoria, ela não é trocada.
- **Atalhos:** na tela Início, "↻ último gasto" e os gastos que mais se repetem lançam em um toque no mês exibido, com Desfazer.
- **Ocultar valores:** o ícone de olho no topo troca todos os valores por R$ ••••; o estado fica salvo no aparelho.
- **PIN:** em Opções > Privacidade e bloqueio. É uma barreira contra curiosos, não criptografia: não substitui a senha do celular.

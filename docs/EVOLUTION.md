# Plano de Evolução — dino-chrome (Orion Run)

> Documento vivo, revisado semanalmente. Última revisão: 2026-10-23.
> Regra central: nenhuma mudança entra sem estar ligada a um objetivo desta página e sem manter ou melhorar as métricas da seção 2.

## 1. Identidade do projeto

- **Propósito:** runner horizontal no navegador inspirado no jogo offline do Chrome, controlado por teclado ou por gestos na webcam (mão aberta pula, mão fechada agacha), com leaderboard via API; serve como case de game loop, visão computacional no navegador e backend em camadas.
- **Tipo:** jogo web (ES Modules + Canvas 2D) servido por API Express com leaderboard em arquivo JSON.
- **Stack:** JavaScript ES Modules sem bundler, Canvas 2D, MediaPipe Hands legado via CDN (`@mediapipe/hands@0.4`, `@mediapipe/camera_utils@0.3`); Node.js `>=20`, Express `^5.1.0` (instalado 5.2.1), `helmet` `^8.1.0`, `cors`, `compression`, `zod` `^4.1.5` (instalado 4.3.6), `pino-http` `^11.0.0`; testes `node:test`.
- **Gerenciador de pacotes:** npm (`package-lock.json`).
- **Deploy:** nenhum configurado (sem `vercel.json`, Dockerfile ou workflow); execução local via `npm start` em `http://localhost:8080`.
- **Estrutura:** `client/` (versão atual: `index.html` e `src/` em camadas `application`, `domain`, `infrastructure`, `presentation`, `core`, `config`); `server/` (`src/` com config, middleware, controllers, services, repository JSON, validation; `tests/`; `data/leaderboard.json` versionado); `legacy/` e cópias idênticas na raiz (`index.html`, `main.js`, `styles.css`, `assets/`) da versão original.
- **Comandos:** install `npm ci` · dev `npm run dev` · lint inexistente · typecheck inexistente · test `npm test` · build inexistente (cliente servido sem build)

## 2. Estado atual (baseline)

| Verificação | Comando | Resultado | Data |
| --- | --- | --- | --- |
| Instalação | `npm ci` | PASS | 2026-10-23 |
| Lint | — | não verificado (não há linter); `node --check` em todos os `.js` de `client/src` e `server/src` sem erro | 2026-10-23 |
| Typecheck | — | não verificado (JavaScript sem verificação de tipos) | 2026-10-23 |
| Testes | `npm test` | 8 passando / 0 falhando (2 arquivos, só servidor) | 2026-10-23 |
| Cobertura | `node --test --experimental-test-coverage server/tests/*.test.js` | servidor: 96,1% linhas no total; `app.js` 76,4%, `file-leaderboard.repository.js` 91,7%; cliente 0% (sem testes) | 2026-10-23 |
| Build | `npm start` + `curl /api/v1/health` e `/` | PASS (200 e 200); não há etapa de build | 2026-10-23 |
| Vulnerabilidades (audit) | `npm audit --omit=dev --json` | 0 critical / 2 high / 0 moderate (`body-parser` 2.0.0–2.3.0, GHSA-27r3-jxmh-p828; `zod` <4.6.6, GHSA-mrhx-c7xc-m3w5; ambas com `npm audit fix`) | 2026-10-23 |
| CI no GitHub | — | nenhum workflow (`.github/` inexistente) | 2026-10-23 |

Observações: Node local 22.22.0. O fluxo de gestos com câmera real, e2e, axe e Lighthouse não foram verificados (sem navegador com câmera nesta revisão e sem suíte e2e). A correção de 2026-10-11 já exige credencial administrativa configurada em produção para as operações administrativas; restam itens de endurecimento da API, tratados em O3 (B2, B3).

## 3. Histórico e trajetória

14 commits entre 2026-01-31 e 2026-10-11.

- **2026-01-31 — protótipo:** runner com gestos em arquivo único, ajustes de robustez da detecção de mão, física independente de frame rate, README e GIF de demonstração.
- **2026-02-08 — reestruturação fullstack:** cliente em camadas, API Express versionada com `zod`, `helmet`, `pino-http`, testes do servidor e merge do histórico remoto. A versão original foi preservada em `legacy/` e também ficou na raiz, gerando três cópias idênticas (confirmado por md5) e o GIF de 10.155.965 bytes triplicado.
- **2026-10-11 — higiene e segurança:** `npm audit fix`, pastas locais ignoradas, instruções de execução no README e remoção da chave admin padrão com testes.

Padrão observado: grandes lotes em poucos dias; débitos deixados por ciclo: duplicação do legado, cliente sem testes, ranking só remoto (inexistente numa publicação estática), versão do MediaPipe por faixa no CDN e textos sem acento.

## 4. Objetivos definidos (critério de parada)

| # | Eixo | Objetivo | Métrica | Baseline | Meta | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | Funcionamento | Ranking utilizável com e sem servidor e repositório sem cópias | modos de ranking funcionais; cópias do jogo antigo | só remoto; 3 cópias | remoto + local; 0 cópias fora de `client/` | P1 | ativo |
| O2 | Cobertura de testes | Testar o domínio do cliente e manter o servidor | testes do cliente; % linhas do servidor | 0; 96,1% | ≥ 12 testes de domínio; servidor ≥ 96% e `app.js` ≥ 90% | P2 | ativo |
| O3 | Segurança | Zerar high e endurecer a API | high em `npm audit --omit=dev`; limitação de taxa nas rotas de escrita; política de origens | 2; pendente; pendente | 0; 429 após o limite; apenas origens explicitamente configuradas | P0 | ativo |
| O4 | Performance | Reduzir mídia e carga de terceiros | tamanho total de GIFs versionados; versão do MediaPipe | 30,5 MB (3 × 10,2 MB); faixa `@0.4` | ≤ 3 MB; versão exata fixada | P2 | ativo |
| O5 | Qualidade/Manutenibilidade | Lint e CI | workflows; erros de lint | 0; sem linter | CI com test + lint; 0 erros | P1 | ativo |
| O6 | Acessibilidade/UX | Estados de câmera claros e textos corretos | mensagens distintas de falha de câmera; violações axe serious/critical | 1 genérica; não verificado | 4 (negada, ausente, contexto inseguro, falha do MediaPipe); 0 | P2 | ativo |

## 5. Guardrails

- Mudança só com objetivo associado (O#) ou item de backlog (B#); refatoração sem ganho mensurável é proibida.
- Nenhuma métrica da seção 2 pode piorar; se piorar, a mudança é revertida.
- Upgrade de versão major, mudança de arquitetura, remoção de funcionalidade e alteração de deploy exigem aprovação do dono (entram em "Decisões pendentes").
- No máximo uma feature nova por semana, de risco baixo, atrás de testes.
- Não remover `legacy/` nem as cópias da raiz sem aprovação.
- O teclado continua disponível em qualquer falha de câmera; nenhum quadro de vídeo sai do navegador.
- Trocar MediaPipe Hands legado por Tasks Vision é mudança de arquitetura: só com aprovação.
- `server/data/` não recebe dados reais de jogadores no Git.

## 6. Backlog priorizado

- P0 = quebra funcionamento/segurança · P1 = risco alto · P2 = qualidade · P3 = melhoria

- [ ] **B1 (P0, O3)** Atualizar `body-parser` e `zod` dentro da major atual (`npm audit fix`) — `npm audit --omit=dev --audit-level=high` com exit 0; `npm test` verde.
- [ ] **B2 (P1, O3)** Limitação de taxa em todas as rotas de escrita da API, sem dependência nova — teste `node:test` recebe 429 acima do limite da janela.
- [ ] **B3 (P1, O3)** Política de origens restritiva por padrão e verificação de credenciais com comparação em tempo constante — testes: origem não configurada é recusada; credencial inválida retorna 401 independentemente do formato.
- [ ] **B4 (P1, O1)** Ranking local quando a API não responde (`client/src/infrastructure/api/leaderboard-api.js`, novo armazenamento local puro), com todo conteúdo fornecido pelo usuário renderizado como texto, nunca como HTML — testes de ordenação, limite de 10 e nome inválido; marcação no nome aparece literalmente.
- [ ] **B5 (P1, O5)** CI `.github/workflows/ci.yml` com `npm ci`, `npm test` e `npm audit --omit=dev --audit-level=high` em Node 22 e 24 — workflow verde em PR.
- [ ] **B6 (P1, O1)** Remover `legacy/`, cópias da raiz e GIFs duplicados, deixando uma mídia ≤ 3 MB para o README (após aprovação) — `git ls-files` sem `legacy/`, `index.html`, `main.js`, `styles.css` na raiz; README renderiza a mídia.
- [ ] **B7 (P2, O4)** Fixar versão exata do MediaPipe em `client/index.html:162-163` e `gesture-controller.js:119` — grep não encontra `@0.4/` nem `@0.3/`; jogo carrega sem erro no console.
- [ ] **B8 (P2, O2)** Testes de domínio do cliente (`player.js`, `collision.js`, `obstacle-factory.js` com gerador injetado) incluídos no `npm test` — ≥ 12 testes; pulo não ocorre no ar; agachar reduz a altura.
- [ ] **B9 (P2, O2)** Cobrir `server/src/app.js:28-35,44-48` (fallback estático/SPA) — `app.js` ≥ 90% de linhas.
- [ ] **B10 (P2, O6)** Estados de câmera distintos e tela de pré-permissão explicando os dois gestos (`game-engine.js:100-106`, `gesture-controller.js`) — teste de mapeamento de erro → mensagem; botão "Jogar com o teclado" presente em todas.
- [ ] **B11 (P2, O5)** Lint (ESLint flat config para ES Modules de navegador e Node) — `npm run lint` com 0 erros no CI.
- [ ] **B12 (P2, O6)** Microcopy PT-BR com acentos no cliente e nas mensagens do servidor ("Câmera indisponível", "Não autorizado") — grep de "Camera indisponivel", "Nao autorizado" vazio.
- [ ] **B13 (P2, O1)** `server/data/leaderboard.json` fora do Git, usando o caminho de runtime já ignorado (`server/data/leaderboard.runtime.json`) — `git ls-files server/data` vazio ou só exemplo; testes usam diretório temporário.
- [ ] **B14 (P3, O6)** Calibração do gesto (porcentagem de quadros reconhecidos em 10 s, rotulada como amostra local) — teste da agregação; nenhum dado sai do navegador.

## 7. Radar técnico

| Data | Item | Fonte | Veredito (adotar / avaliar / descartar) | Motivo |
| --- | --- | --- | --- | --- |
| 2026-10-23 | MediaPipe Hand Landmarker (Tasks Vision) para Web | https://www.npmjs.com/package/@mediapipe/tasks-vision | avaliar | O cliente usa a API legada `@mediapipe/hands@0.4` por CDN; Tasks permite self-host de WASM e modelo e versão fixa |
| 2026-10-23 | Advisory `zod` <4.6.6 (exaustão de memória) | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | adotar | Correção dentro da major 4 (B1) |
| 2026-10-23 | Advisory `body-parser` 2.0.0–2.3.0 (DoS) | https://github.com/advisories/GHSA-27r3-jxmh-p828 | adotar | Dependência transitiva do Express 5 (B1) |
| 2026-10-23 | Node.js 20 em EOL; 22 e 24 em LTS | https://nodejs.org/en/about/previous-releases | adotar | `engines` ainda declara `>=20`; CI novo deve usar 22/24 (B5) |
| 2026-10-23 | Express 5 é a linha atual suportada | https://expressjs.com/en/support/ | adotar | Projeto já está em 5.2.1; manter atualizado no patch |

## 8. Ideias de features

| # | Feature | Valor para o usuário/portfólio | Risco | Status (proposta / aprovada / implementada / descartada) |
| --- | --- | --- | --- | --- |
| F1 | Calibração do gesto antes da partida | Jogador confirma que a mão é reconhecida; demonstra medição honesta | médio (iluminação variável) | proposta |
| F2 | Ranking local com filtro por dificuldade e modo de controle | Comparação justa entre teclado e gesto | baixo | proposta |
| F3 | Anel visual de confirmação do gesto ao lado do personagem | Reduz mortes por gesto não reconhecido | baixo | proposta |
| F4 | Identidade visual própria ("sertão à noite") para obstáculos e cenário | Afasta o jogo da arte original e dá identidade ao case | médio (escopo visual amplo) | proposta |

## 9. Decisões pendentes do dono

- Apagar `legacy/`, as cópias da raiz e os GIFs duplicados, mantendo uma mídia comprimida?
- Criar publicação estática (Root Directory `client`, sem Functions) com ranking local, mantendo o Express só para desenvolvimento?
- Nome exibido: "Orion Run" sem "Pro"? Renomear o repositório agora ou depois?
- A operação administrativa de limpeza do ranking ainda tem uso, ou pode ser removida?
- Migrar de MediaPipe Hands legado para Tasks Vision (mudança de arquitetura)?

## 10. Registro semanal

| Data | Auditoria | Mudanças (commits) | Métricas | Próximo foco |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Documento inicial e baseline | — | ver seção 2 | B1, B2, B4, B5 |

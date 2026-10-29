# Plano de Evolução — dino-chrome (Orion Run)

> Documento vivo, revisado semanalmente. Última revisão: 2026-10-29.
> Regra central: nenhuma mudança entra sem estar ligada a um objetivo desta página e sem manter ou melhorar as métricas da seção 2.

## 1. Identidade do projeto

- **Propósito:** runner horizontal no navegador inspirado no jogo offline do Chrome, controlado por teclado ou por gestos na webcam (mão aberta pula, mão fechada agacha), com leaderboard via API; serve como case de game loop, visão computacional no navegador e backend em camadas.
- **Tipo:** jogo web (ES Modules + Canvas 2D) servido por API Express com leaderboard em arquivo JSON.
- **Stack:** JavaScript ES Modules sem bundler, Canvas 2D, MediaPipe Hands legado via CDN (`@mediapipe/hands@0.4`, `@mediapipe/camera_utils@0.3`); Node.js `>=20`, Express `^5.1.0` (instalado 5.2.1, `body-parser` 2.4.0), `helmet` `^8.1.0`, `cors`, `compression`, `zod` `^4.6.6` (instalado 4.6.6), `pino-http` `^11.0.0`; testes `node:test`.
- **Gerenciador de pacotes:** npm (`package-lock.json`).
- **Deploy:** nenhum configurado (sem `vercel.json`, Dockerfile ou workflow); execução local via `npm start` em `http://localhost:8080`.
- **Estrutura:** `client/` (versão atual: `index.html`, `src/` em camadas `application`, `domain`, `infrastructure`, `presentation`, `core`, `config`, e `tests/` com `node:test`); `server/` (`src/` com config, middleware, controllers, services, repository JSON, validation; `tests/`; `data/leaderboard.json` versionado); `legacy/` e cópias idênticas na raiz (`index.html`, `main.js`, `styles.css`, `assets/`) da versão original.
- **Comandos:** install `npm ci` · dev `npm run dev` · lint inexistente · typecheck inexistente · test `npm test` · build inexistente (cliente servido sem build)

## 2. Estado atual (baseline)

| Verificação | Comando | Resultado | Data |
| --- | --- | --- | --- |
| Instalação | `npm ci` | PASS | 2026-10-29 |
| Lint | — | não verificado (não há linter); `node --check` em todos os `.js` de `client/src` e `server/src` sem erro | 2026-10-29 |
| Typecheck | — | não verificado (JavaScript sem verificação de tipos) | 2026-10-29 |
| Testes | `npm test` | 30 passando / 0 falhando (18 do servidor em 4 arquivos + 12 do cliente em 2 arquivos); antes desta revisão: 8 | 2026-10-29 |
| Cobertura | `node --test --experimental-test-coverage server/tests/*.test.js client/tests/*.test.js` | total 97,74% linhas; só servidor 97,39% (antes 96,09%); `app.js` 76,4%; `file-leaderboard.repository.js` 95,2%; cliente: ranking local e fallback ≥ 94,7%, demais módulos sem testes | 2026-10-29 |
| Build | `npm start` + `curl /api/v1/health` + Chromium headless em `/` | PASS (200); ranking local exibido com a API bloqueada; não há etapa de build | 2026-10-29 |
| Vulnerabilidades (audit) | `npm audit --json` | 0 critical / 0 high / 0 moderate / 0 low (antes desta revisão já 0, após `8b4ea81`) | 2026-10-29 |
| CI no GitHub | — | nenhum workflow de CI (`.github/` inexistente); só execuções do Dependabot, ambas `success` | 2026-10-29 |

Observações: Node local 22.23.4 (2026-10-29). O fluxo de gestos com câmera real, e2e, axe e Lighthouse não foram verificados (sem navegador com câmera nesta revisão e sem suíte e2e). A correção de 2026-10-11 já exige credencial administrativa configurada em produção; em 2026-10-29 entraram a limitação de taxa nas rotas de escrita, a política de origens restritiva por padrão e a comparação da credencial em tempo constante (B2, B3).

## 3. Histórico e trajetória

14 commits entre 2026-01-31 e 2026-10-11.

- **2026-01-31 — protótipo:** runner com gestos em arquivo único, ajustes de robustez da detecção de mão, física independente de frame rate, README e GIF de demonstração.
- **2026-02-08 — reestruturação fullstack:** cliente em camadas, API Express versionada com `zod`, `helmet`, `pino-http`, testes do servidor e merge do histórico remoto. A versão original foi preservada em `legacy/` e também ficou na raiz, gerando três cópias idênticas (confirmado por md5) e o GIF de 10.155.965 bytes triplicado.
- **2026-10-11 — higiene e segurança:** `npm audit fix`, pastas locais ignoradas, instruções de execução no README e remoção da chave admin padrão com testes.

Padrão observado: grandes lotes em poucos dias; débitos deixados por ciclo: duplicação do legado, cliente sem testes, ranking só remoto (inexistente numa publicação estática), versão do MediaPipe por faixa no CDN e textos sem acento.

## 4. Objetivos definidos (critério de parada)

| # | Eixo | Objetivo | Métrica | Baseline | Meta | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | Funcionamento | Ranking utilizável com e sem servidor e repositório sem cópias | modos de ranking funcionais; cópias do jogo antigo | só remoto; 3 cópias (2026-10-29: remoto + local; 3 cópias) | remoto + local; 0 cópias fora de `client/` | P1 | ativo (falta B6, depende do dono) |
| O2 | Cobertura de testes | Testar o domínio do cliente e manter o servidor | testes do cliente; % linhas do servidor | 0; 96,1% | ≥ 12 testes de domínio; servidor ≥ 96% e `app.js` ≥ 90% | P2 | ativo |
| O3 | Segurança | Zerar high e endurecer a API | high em `npm audit --omit=dev`; limitação de taxa nas rotas de escrita; política de origens | 2; pendente; pendente (2026-10-29: 0; 429 testado; só origens configuradas) | 0; 429 após o limite; apenas origens explicitamente configuradas | P0 | monitorado (meta atingida em 2026-10-29) |
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

- [x] **B1 (P0, O3)** _(2026-10-28, `8b4ea81`, via PR do Dependabot consolidado pelo dono)_ Atualizar `body-parser` e `zod` dentro da major atual (`npm audit fix`) — `npm audit --omit=dev --audit-level=high` com exit 0; `npm test` verde.
- [x] **B2 (P1, O3)** _(2026-10-29, `c094dbe` + `fac3d5b`: janela fixa por IP em memória com teto de clientes rastreados; `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`)_ Limitação de taxa em todas as rotas de escrita da API, sem dependência nova — teste `node:test` recebe 429 acima do limite da janela.
- [x] **B3 (P1, O3)** _(2026-10-29, `a02a6b3`: `CORS_ORIGIN` vazio por padrão, lista separada por vírgula, `*` só explícito; credencial comparada por `timingSafeEqual` sobre SHA-256)_ Política de origens restritiva por padrão e verificação de credenciais com comparação em tempo constante — testes: origem não configurada é recusada; credencial inválida retorna 401 independentemente do formato.
- [x] **B4 (P1, O1)** _(2026-10-29, `265ad5a`: `client/src/domain/local-leaderboard.js`, `storage/local-leaderboard-store.js`, `api/resilient-leaderboard.js`; fallback só em falha de rede, 404 ou 5xx; ranking renderizado com `textContent`; 12 testes em `client/tests`)_ Ranking local quando a API não responde (`client/src/infrastructure/api/leaderboard-api.js`, novo armazenamento local puro), com todo conteúdo fornecido pelo usuário renderizado como texto, nunca como HTML — testes de ordenação, limite de 10 e nome inválido; marcação no nome aparece literalmente.
- [ ] **B5 (P1, O5)** CI `.github/workflows/ci.yml` com `npm ci`, `npm test` e `npm audit --omit=dev --audit-level=high` em Node 22 e 24 — workflow verde em PR.
- [ ] **B6 (P1, O1)** Remover `legacy/`, cópias da raiz e GIFs duplicados, deixando uma mídia ≤ 3 MB para o README (após aprovação) — `git ls-files` sem `legacy/`, `index.html`, `main.js`, `styles.css` na raiz; README renderiza a mídia.
- [ ] **B7 (P2, O4)** Fixar versão exata do MediaPipe em `client/index.html:162-163` e `gesture-controller.js:119` — grep não encontra `@0.4/` nem `@0.3/`; jogo carrega sem erro no console.
- [ ] **B8 (P2, O2)** Testes de domínio do cliente (`player.js`, `collision.js`, `obstacle-factory.js` com gerador injetado) incluídos no `npm test` — ≥ 12 testes; pulo não ocorre no ar; agachar reduz a altura.
- [ ] **B9 (P2, O2)** Cobrir `server/src/app.js:28-35,44-48` (fallback estático/SPA) — `app.js` ≥ 90% de linhas.
- [ ] **B10 (P2, O6)** Estados de câmera distintos e tela de pré-permissão explicando os dois gestos (`game-engine.js:100-106`, `gesture-controller.js`) — teste de mapeamento de erro → mensagem; botão "Jogar com o teclado" presente em todas.
- [ ] **B11 (P2, O5)** Lint (ESLint flat config para ES Modules de navegador e Node) — `npm run lint` com 0 erros no CI.
- [ ] **B12 (P2, O6)** Microcopy PT-BR com acentos no cliente e nas mensagens do servidor ("Câmera indisponível", "Não autorizado") — grep de "Camera indisponivel", "Nao autorizado" vazio.
- [ ] **B13 (P2, O1)** `server/data/leaderboard.json` fora do Git, usando o caminho de runtime já ignorado (`server/data/leaderboard.runtime.json`) — `git ls-files server/data` vazio ou só exemplo; testes usam diretório temporário.
- [ ] **B15 (P2, O3)** Ajustar a identificação do cliente na limitação de taxa à topologia do provedor de deploy escolhido — teste de integração com a configuração do provedor; depende da decisão do dono sobre o deploy.
- [ ] **B16 (P2, O3)** Atualizar `express` 5.2.1 → 5.3.0, `helmet` 8.1.0 → 8.3.0 e `zod` 4.6.6 → 4.6.7 (minor/patch) após ler as notas de versão — `npm test` verde e `npm audit` sem high.
- [ ] **B14 (P3, O6)** Calibração do gesto (porcentagem de quadros reconhecidos em 10 s, rotulada como amostra local) — teste da agregação; nenhum dado sai do navegador.

## 7. Radar técnico

| Data | Item | Fonte | Veredito (adotar / avaliar / descartar) | Motivo |
| --- | --- | --- | --- | --- |
| 2026-10-23 | MediaPipe Hand Landmarker (Tasks Vision) para Web | https://www.npmjs.com/package/@mediapipe/tasks-vision | avaliar | O cliente usa a API legada `@mediapipe/hands@0.4` por CDN; Tasks permite self-host de WASM e modelo e versão fixa |
| 2026-10-23 | Advisory `zod` <4.6.6 (exaustão de memória) | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | adotar | Correção dentro da major 4 (B1) |
| 2026-10-23 | Advisory `body-parser` 2.0.0–2.3.0 (DoS) | https://github.com/advisories/GHSA-27r3-jxmh-p828 | adotar | Dependência transitiva do Express 5 (B1) |
| 2026-10-23 | Node.js 20 em EOL; 22 e 24 em LTS | https://nodejs.org/en/about/previous-releases | adotar | `engines` ainda declara `>=20`; CI novo deve usar 22/24 (B5) |
| 2026-10-23 | Express 5 é a linha atual suportada | https://expressjs.com/en/support/ | adotar | Projeto já está em 5.2.1; manter atualizado no patch |
| 2026-10-29 | Node.js October 2026 security releases (22.x, 24.x e linha atual) | https://nodejs.org/en/blog/vulnerability/october-2026-security-releases | adotar | Ambiente local já em 22.23.4; o servidor não usa Brotli diretamente, mas `compression` pode negociar `br`: rodar sempre a última patch LTS (O3) |
| 2026-10-29 | `express` 5.3.0 disponível (minor) | https://www.npmjs.com/package/express | avaliar | Notas oficiais não localizadas nesta revisão; sem advisory aberto para 5.2.1 no `npm audit` (B16) |
| 2026-10-29 | `helmet` 8.3.0 disponível (minor) | https://cdn.jsdelivr.net/npm/helmet@8.3.0/CHANGELOG.md | avaliar | Mesma major; atualização de rotina ligada a O3 (B16) |
| 2026-10-29 | Limitação de taxa sem dependência nova (`node:crypto`/`Map`) | https://expressjs.com/en/advanced/best-practice-security.html | adotar | Cumpre B2 sem aumentar a superfície de dependências; `express-rate-limit` fica como alternativa se houver múltiplas instâncias |

## 8. Ideias de features

| # | Feature | Valor para o usuário/portfólio | Risco | Status (proposta / aprovada / implementada / descartada) |
| --- | --- | --- | --- | --- |
| F1 | Calibração do gesto antes da partida | Jogador confirma que a mão é reconhecida; demonstra medição honesta | médio (iluminação variável) | proposta |
| F2 | Ranking local com filtro por dificuldade e modo de controle | Comparação justa entre teclado e gesto | baixo | proposta (ranking local base entregue em B4; falta o filtro) |
| F3 | Anel visual de confirmação do gesto ao lado do personagem | Reduz mortes por gesto não reconhecido | baixo | proposta |
| F4 | Identidade visual própria ("sertão à noite") para obstáculos e cenário | Afasta o jogo da arte original e dá identidade ao case | médio (escopo visual amplo) | proposta |

## 9. Decisões pendentes do dono

- Apagar `legacy/`, as cópias da raiz e os GIFs duplicados, mantendo uma mídia comprimida?
- Criar publicação estática (Root Directory `client`, sem Functions) com ranking local, mantendo o Express só para desenvolvimento?
- Nome exibido: "Orion Run" sem "Pro"? Renomear o repositório agora ou depois?
- A operação administrativa de limpeza do ranking ainda tem uso, ou pode ser removida?
- Migrar de MediaPipe Hands legado para Tasks Vision (mudança de arquitetura)?
- Mudança de comportamento em 2026-10-29: sem `CORS_ORIGIN`, a API deixou de liberar `*`. Um frontend publicado em outro domínio precisa ter a origem listada em `CORS_ORIGIN`. Confirmar o domínio do frontend, se houver.
- Qual provedor de deploy será usado (define B15)?

## 10. Registro semanal

| Data | Auditoria | Mudanças (commits) | Métricas | Próximo foco |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Documento inicial e baseline | — | ver seção 2 | B1, B2, B4, B5 |
| 2026-10-29 | Auditoria completa: install, testes, cobertura, audit, `node --check`, smoke HTTP e Chromium headless; B1 já resolvido em `8b4ea81`; sem CI próprio | `c094dbe` B2, `a02a6b3` B3, `265ad5a` B4, `fac3d5b` testes do limitador; nenhuma feature nova (nenhuma aprovada; F2 parcialmente coberta por B4) | testes 8 → 30; cobertura servidor 96,09% → 97,39%; high 0 → 0 | B5 (CI), B7, B8, B9 |

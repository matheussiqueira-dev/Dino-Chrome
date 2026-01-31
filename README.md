# Orion Run - Gesture Runner

Casual runner inspirado na mecanica do Dino Chrome, com identidade visual autoral e controle por gestos usando webcam. O projeto foi pensado como case de portfolio para demonstrar integracao entre UX, game loop e visao computacional.

## Destaques
- Controles por gestos: mao aberta = pulo, mao fechada = agachar
- Dificuldade leve e ritmo fluido para demonstracoes
- UI autoral com foco em legibilidade e assinatura profissional
- Feedback visual imediato de reconhecimento de gestos

## Stack
- HTML, CSS, JavaScript (Canvas 2D)
- MediaPipe Hands (deteccao de mao e landmarks)
- WebRTC `getUserMedia` para camera

## Como executar
1. Inicie um servidor local na pasta do projeto:
   - `python -m http.server 8010`
2. Abra no navegador:
   - `http://localhost:8010`

> A webcam requer contexto seguro. Use `localhost` para liberar o acesso.

## Controles
- **Mao aberta**: pular
- **Mao fechada**: agachar
- Fallback: teclado (Espaco/Seta para cima = pulo, Seta para baixo = agachar)

## Estrutura
- `index.html`: layout e UI
- `styles.css`: identidade visual e responsividade
- `main.js`: game loop, fisica, obstaculos e gestos

## Boas praticas aplicadas
- Separacao de responsabilidades (input, logica, render)
- Suavizacao temporal dos gestos para reduzir falsos positivos
- Parametros de gameplay configuraveis para ajustes rapidos

## Roadmap sugerido
- Tela de calibracao de gestos e iluminacao
- Sons, particulas e trilha leve
- Placares e modo desafio

---
Autoria de Matheus Siqueira7

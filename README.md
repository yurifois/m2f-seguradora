# M2F Associados — site

Site em scrollytelling (React + GSAP ScrollTrigger + Lenis + Three.js), fundo escuro com
névoa em WebGL, logo 3D extrudada a partir do logobrand e quatro atos: hero, associados,
serviços/cotações e formulário.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático — publica em Vercel, Netlify, Hostinger, etc.)
```

## Onde mudar o conteúdo

Tudo fica em `src/data/content.ts`: contatos, bios dos sócios, serviços, tabelas de
consórcio (meia parcela) e números da faixa de destaque.

## Formulário

Sem configuração, o envio abre o WhatsApp da M2F com a mensagem já escrita (nada é
perdido). Para receber também por e-mail/CRM, defina um endpoint que aceite POST JSON:

```bash
# .env
VITE_LEAD_ENDPOINT=https://seu-endpoint/leads
```

## Estrutura

- `src/components/BackgroundStage.tsx` — camadas fixas: anéis da marca, logo 3D, logo branca estática, fumaça
- `src/components/logo3dScene.ts` — cena Three.js (carregada sob demanda)
- `src/components/SmokeCanvas.tsx` — shader da névoa
- `src/sections/*` — Hero, Partners, Services, Quotes, Contact, Footer
- `public/img` — logos e fotos otimizadas (WebP)

Acessibilidade: navegação por teclado, contraste AA e `prefers-reduced-motion` (desliga
pin, fumaça animada e logo 3D, mantendo todo o conteúdo).

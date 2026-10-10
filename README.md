# M2F Associados — site

Site em scrollytelling (React + GSAP ScrollTrigger + Lenis + Three.js), fundo de mármore
marfim com fumaça turquesa animada, logo 3D extrudada a partir do logobrand e quatro atos: hero, associados,
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
- `src/components/HeroScene.tsx` — cena do hero entre a fumaça e a logo 3D: casa (`public/img/hero/casa.webp`), carro
  (`carro.webp`, recortado e alinhado à casa) e o gráfico de vidro em SVG que cresce com a rolagem
- `src/components/logo3dScene.ts` — cena Three.js (carregada sob demanda)
- `src/components/SmokeCanvas.tsx` — shader da névoa
- `src/sections/*` — Hero, Partners, Services, Quotes, Contact, Footer
- `public/img` — logos e fotos otimizadas (WebP)

Acessibilidade: navegação por teclado, textos com contraste reforçado e `prefers-reduced-motion` (desliga
pin, fumaça animada e logo 3D, mantendo todo o conteúdo).

## Referência visual clara

A composição aprovada usa fotografias como fundo integral dos cards, com degradês
claros sobre as áreas de texto. Os assets atuais estão em `public/img/editorial/`:
oito fotografias, mármore marfim e fumaça turquesa com canal alfa. Foram gerados com
o gerador de imagens integrado a partir da referência enviada pelo usuário e
convertidos para WebP, preservando a transparência da fumaça.

Prompts e destino dos assets: [docs/visual-reference.md](docs/visual-reference.md).
Os efeitos GSAP de entrada e scroll permanecem ativos. A fumaça turquesa
(`fumaca.webp`) é uma textura dentro do shader WebGL (`SmokeCanvas.tsx`): escoa por um
campo de fluxo, ondula, sobe devagar, reage ao cursor e à rolagem; a versão estática em
CSS só aparece se o WebGL falhar. A logo 3D mantém o degradê original do logobrand
(violeta → azul → ciano) e fica à frente da fumaça no hero. As ilustrações animadas dos
cards de serviço (`ServiceArt.tsx`) rodam sobre as fotografias.
Em `prefers-reduced-motion`, o fundo permanece visível e estático.

## Créditos das fotografias anteriores

Fotos de fundo dos cards em `public/img/servicos/`, do [Unsplash](https://unsplash.com/license)
(licença gratuita para uso comercial, sem obrigação de crédito):

| Card | Foto |
|---|---|
| Consórcio de imóveis | `photo-1748063578185-3d68121b11ff` |
| Consórcio de veículos | `photo-1609452200852-98c888654e2c` |
| Investimento | `photo-1757705759617-ff88e68fe5af` |
| Plano de saúde | `photo-1666887360921-85952a86894f` |
| Seguro viagem | `photo-1729350038150-495c628bd695` |
| Seguro de vida | `photo-1529180979161-06b8b6d6f2be` |
| Seguro residencial | `photo-1570905810373-a8ae44f954cb` |
| Seguro auto | `photo-1551464484-74a2f25d01a0` |

Cada uma pode ser vista em `https://images.unsplash.com/<id>`.

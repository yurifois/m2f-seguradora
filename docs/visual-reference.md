# M2F — referência visual clara

Referência: imagem `b532608b-203f-4f99-8790-07531dfd37da.png` aprovada pelo usuário.
Produção dos assets: ferramenta integrada de geração de imagens, modo de referência.
Todos os assets estão versionados no repositório em `public/img/editorial/`.
Nenhuma imagem contém textos, botões ou interface: a composição é HTML/CSS real.

## Prompts das fotografias

Instrução comum: recriar somente a fotografia correspondente da referência,
com iluminação editorial clara, marfim, azul suave e dourado natural. Foto realista
sem interface, bordas, palavras, ícones ou marcas. Fotografias de carro e família
compostas à direita para permitir texto HTML à esquerda.

| Asset | Cena solicitada |
|---|---|
| `imovel.webp` | Casa contemporânea branca de dois andares, vidro, interiores iluminados, palmeiras e piscina reflexiva, céu azul suave ao entardecer; vista frontal pela esquerda, retrato. |
| `veiculo.webp` | SUV prateado em estrada costeira com montanhas, vista frontal de três quartos, luz natural clara e movimento sutil da estrada. |
| `saude.webp` | Close de jaleco branco e estetoscópio azul petróleo, mão segurando o diafragma no canto inferior direito, sem rosto, fundo clínico marfim. |
| `investimento.webp` | Distrito empresarial ensolarado com torres claras de vidro à direita, palmeiras e céu suave, retrato. |
| `viagem.webp` | Asa de avião sobre nuvens ao amanhecer dourado, céu azul suave, fotografia natural. |
| `vida.webp` | Pais e duas crianças de mãos dadas caminhando na praia em direção ao pôr do sol, silhuetas pequenas à direita. |
| `residencial.webp` | Casa branca contemporânea de dois andares, jardim, interiores acolhedores iluminados, luz dourada natural. |
| `auto.webp` | SUV prateado visto de três quartos em estrada costeira, carro à direita, mar azul e montanhas atrás. |

## Prompts do fundo

`marmore.webp`: textura ortogonal de mármore branco marfim, veios ramificados
finos cinza quente, grão mineral suave, luz difusa uniforme, sem fumaça ou objetos.

`fumaca.webp`: apenas as faixas de fumaça ciano/turquesa da referência, com dobras
transparentes como organza, contornos definidos, luz branca suave e espaço vazio.
Fluxo diagonal da esquerda inferior à direita superior, em paisagem, fundo com alfa
real, sem mármore, interface, palavras ou objetos. O canal alfa foi preservado no WebP.

## Composição e movimento

- Mármore e faixas de fumaça cobrem toda a página, incluindo capturas longas; a névoa WebGL permanece fixa e responsiva ao cursor/scroll.
- Paleta: texto `#062e43`, apoio `#17465b`, destaque `#0088b0` e ciano `#00a7cd`.
- Títulos em Playfair Display, com letras completas e peso suficiente para tela.
- Fotos ocupam todo o card; degradês locais protegem a leitura, sem janelas de imagem.
- Entrada dos cards, hover e zoom fotográfico mantidos; textos entram sem partir da invisibilidade.
- Navegação, tabelas de cálculo, formulário e FAQ mantêm seu comportamento.

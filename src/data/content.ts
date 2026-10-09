// Conteúdo centralizado do site. Bios, contatos e tabelas vêm do site atual
// (m2fassociados.com.br) e do Instagram @m2f_associados.

export const CONTACT = {
  whatsapp: '5561999829002',
  whatsappLabel: '(61) 99982-9002',
  email: 'filipe@m2fassociados.com.br',
  instagram: 'm2f_associados',
  hours: 'Dias úteis, das 8h30 às 18h30',
  offices: [
    {
      city: 'Brasília/DF',
      address: 'Ed. Le Quartier Hotel e Bureau — Setor Hoteleiro Norte, Qd. 01, Bl. A, Sala 1321',
    },
    { city: 'Goiânia/GO', address: 'Av. T-2, 471 — St. Bueno, 74210-005' },
  ],
};

export const waLink = (text: string) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

export const NAV = [
  { id: 'inicio', label: 'Início' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'associados', label: 'Associados' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'cotacoes', label: 'Cotações' },
  { id: 'contato', label: 'Contato' },
] as const;

export type Partner = {
  id: string;
  name: string;
  photo: string;
};

// Ordem pedida: Felipe Mitchell entra primeiro (fica à esquerda).
export const PARTNERS: Partner[] = [
  { id: 'felipe-mitchell', name: 'Felipe Mitchell', photo: '/img/felipe-mitchell.webp' },
  { id: 'filipe-menezes', name: 'Filipe Menezes', photo: '/img/filipe-menezes.webp' },
  { id: 'jhonatan-abdala', name: 'Jhonatan Abdala', photo: '/img/jhonatan-abdala.webp' },
];

export type Pillar = 'Conquistar' | 'Cuidar' | 'Proteger';
export type IconName =
  | 'house'
  | 'car'
  | 'growth'
  | 'health'
  | 'plane'
  | 'life'
  | 'home-shield'
  | 'car-shield';

export type ProductId =
  | 'consorcio-imovel'
  | 'consorcio-veiculo'
  | 'consorcio-investimento'
  | 'saude'
  | 'viagem'
  | 'vida'
  | 'residencial'
  | 'auto';

export const PRODUCT_LABEL: Record<ProductId, string> = {
  'consorcio-imovel': 'Consórcio de imóvel',
  'consorcio-veiculo': 'Consórcio de veículo',
  'consorcio-investimento': 'Consórcio para investimento',
  saude: 'Plano de saúde',
  viagem: 'Seguro viagem',
  vida: 'Seguro de vida',
  residencial: 'Seguro residencial',
  auto: 'Seguro auto',
};

export type Service = {
  id: ProductId;
  pillar: Pillar;
  icon: IconName;
  title: string;
  text: string;
  tags: string[];
  size: 'xl' | 'tall' | 'wide' | 'md';
  quoteTab: QuoteTab | null;
  cta: string;
  steps?: string[];
  isNew?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: 'consorcio-imovel',
    pillar: 'Conquistar',
    icon: 'house',
    title: 'Consórcio de imóveis',
    text: 'Conquiste seu imóvel com planejamento e sem pagar juros.',
    tags: ['Sem juros', 'Sem entrada', 'Estudo de lance'],
    size: 'xl',
    quoteTab: 'imovel',
    cta: 'Simular consórcio de imóvel',
    steps: ['Escolha o crédito e o prazo', 'Participe das assembleias mensais', 'Contemplado, use o crédito à vista'],
  },
  {
    id: 'consorcio-veiculo',
    pillar: 'Conquistar',
    icon: 'car',
    title: 'Consórcio de veículos',
    text: 'Seu próximo veículo com planejamento e liberdade de escolha.',
    tags: ['Leves e pesados'],
    size: 'md',
    quoteTab: 'veiculo',
    cta: 'Simular veículo',
  },
  {
    id: 'saude',
    pillar: 'Cuidar',
    icon: 'health',
    title: 'Plano de saúde',
    text: 'Tranquilidade para você e sua família, com orientação personalizada para a melhor escolha.',
    tags: ['Pessoa física', 'Empresa', 'MEI'],
    size: 'tall',
    quoteTab: 'saude',
    cta: 'Cotar plano de saúde',
    isNew: true,
  },
  {
    id: 'consorcio-investimento',
    pillar: 'Conquistar',
    icon: 'growth',
    title: 'Investimento e alavancagem',
    text: 'Soluções para organizar seu patrimônio e ampliar suas possibilidades, com estratégia e acompanhamento especializado.',
    tags: ['Patrimônio'],
    size: 'md',
    quoteTab: 'imovel',
    cta: 'Simular investimento',
  },
  {
    id: 'viagem',
    pillar: 'Proteger',
    icon: 'plane',
    title: 'Seguro viagem',
    text: 'Mais tranquilidade para viajar e explorar o mundo.',
    tags: ['Europa exige'],
    size: 'md',
    quoteTab: 'viagem',
    cta: 'Cotar viagem',
    isNew: true,
  },
  {
    id: 'vida',
    pillar: 'Proteger',
    icon: 'life',
    title: 'Seguro de vida',
    text: 'Proteção para o que realmente importa.',
    tags: ['Família'],
    size: 'md',
    quoteTab: 'vida',
    cta: 'Cotar seguro de vida',
  },
  {
    id: 'residencial',
    pillar: 'Proteger',
    icon: 'home-shield',
    title: 'Seguro residencial',
    text: 'Mais proteção para sua casa e para seu patrimônio.',
    tags: ['Assistência 24h'],
    size: 'md',
    quoteTab: null,
    cta: 'Cotar residencial',
  },
  {
    id: 'auto',
    pillar: 'Proteger',
    icon: 'car-shield',
    title: 'Seguro auto',
    text: 'Segurança e orientação para proteger seu veículo.',
    tags: ['Comparativo'],
    size: 'md',
    quoteTab: null,
    cta: 'Cotar seguro auto',
  },
];

export type QuoteTab = 'imovel' | 'veiculo' | 'saude' | 'viagem' | 'vida';

// Fotografias editoriais geradas a partir da proposta visual aprovada.
export const SERVICE_PHOTO: Record<ProductId, string> = {
  'consorcio-imovel': '/img/editorial/imovel.webp',
  'consorcio-veiculo': '/img/editorial/veiculo.webp',
  'consorcio-investimento': '/img/editorial/investimento.webp',
  saude: '/img/editorial/saude.webp',
  viagem: '/img/editorial/viagem.webp',
  vida: '/img/editorial/vida.webp',
  residencial: '/img/editorial/residencial.webp',
  auto: '/img/editorial/auto.webp',
};

export const QUOTE_TABS: { id: QuoteTab; label: string; short: string }[] = [
  { id: 'imovel', label: 'Consórcio de imóvel', short: 'Imóvel' },
  { id: 'veiculo', label: 'Consórcio de veículo', short: 'Veículo' },
  { id: 'saude', label: 'Plano de saúde', short: 'Saúde' },
  { id: 'viagem', label: 'Seguro viagem', short: 'Viagem' },
  { id: 'vida', label: 'Seguro de vida', short: 'Vida' },
];

// Tabelas publicadas no site atual. A parcela integral é 2× a meia parcela.
// Coeficientes derivados delas para a estimativa do slider.
export const CONSORCIO = {
  imovel: {
    months: 200,
    halfRate: 615 / 200_000,
    min: 150_000,
    max: 1_000_000,
    step: 10_000,
    initial: 300_000,
    presets: [200_000, 250_000, 300_000, 350_000, 400_000],
    uses: ['Apartamento', 'Casa de praia', 'Casa de campo', 'Construir', 'Reforma', 'Comércio', 'Quitar financiamento', 'Investir'],
  },
  veiculo: {
    months: 120,
    halfRate: 483.4 / 100_000,
    min: 50_000,
    max: 400_000,
    step: 5_000,
    initial: 120_000,
    presets: [100_000, 120_000, 130_000, 140_000],
    uses: ['Automóveis', 'Motocicletas', 'Utilitários', 'Caminhões', 'Carretas'],
  },
};

export const STATS = [
  { value: 140, prefix: 'R$ ', suffix: ' mi', label: 'em cartas de crédito vendidas' },
  { value: 3, prefix: '', suffix: '', label: 'sócios no atendimento, do início ao fim' },
  { value: 2, prefix: '', suffix: '', label: 'escritórios: Brasília e Goiânia' },
];

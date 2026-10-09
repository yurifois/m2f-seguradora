// Dúvidas e perguntas frequentes do site original (m2fassociados.com.br), com revisão leve de texto.

export type FaqBlock = string | { list: string[] };
export type FaqItem = { id: string; q: string; a: FaqBlock[] };
export type FaqGroup = { id: string; title: string; intro: string; items: FaqItem[] };

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'como-funciona',
    title: 'Tire suas dúvidas',
    intro: 'O essencial sobre consórcio: como funciona, o que dá para comprar e quando o crédito sai.',
    items: [
      {
        id: 'como-funciona-o-consorcio',
        q: 'Como funciona o consórcio?',
        a: [
          'É um sistema de compra compartilhada, que reúne pessoas que pretendem adquirir um bem ou serviço. No consórcio, você paga uma parcela mensal inferior à dos financiamentos convencionais, porque não há cobrança de juros.',
          'A administradora é responsável pelo gerenciamento de todo o processo e, por esse serviço, cobra apenas uma taxa de administração fixa, distribuída ao longo de todo o período de pagamento.',
        ],
      },
      {
        id: 'o-que-posso-comprar',
        q: 'O que posso comprar?',
        a: [
          'Imóveis novos ou usados, em qualquer lugar do Brasil. Também dá para fazer reformas e construções, ou quitar financiamentos bancários para se livrar dos juros e economizar um bom dinheiro.',
          'A modalidade ainda contempla a compra de automóveis de qualquer marca ou modelo e a realização de serviços como cirurgias plásticas, estudos, viagens e até festa de casamento. É tudo isso e muito mais!',
          'Mas atenção: a sua capacidade financeira é muito importante para garantir o melhor negócio sem comprometer o equilíbrio do seu orçamento. O indicado é que o valor das parcelas não ultrapasse 30% da renda mensal.',
        ],
      },
      {
        id: 'como-participo',
        q: 'Como participo?',
        a: [
          'Fale com um consultor da M2F e escolha o bem que deseja conquistar, o valor do crédito necessário e o plano que mais se adequa às suas condições. A partir daí, você faz as contribuições mensais ao longo do prazo do plano e já começa a participar das assembleias de contemplação — ou pode oferecer seus lances.',
          'Assim que for contemplado, ou ao término do prazo escolhido, o valor do crédito pode ser retirado, com as devidas correções monetárias.',
          'Lembre-se: é essencial ler todas as cláusulas do contrato de adesão e conhecer seus direitos e deveres junto à administradora. A proposta e o regulamento gerados no momento da compra trazem todas as informações da cota, seus dados cadastrais e as informações do bem a ser adquirido.',
          'Visando um bom relacionamento, as taxas de administração, os prazos e o crédito são transparentes.',
        ],
      },
      {
        id: 'gestao-do-consorcio',
        q: 'Como faço a gestão do meu consórcio?',
        a: [
          'Ao contratar a sua cota, você recebe o código do grupo e a senha de acesso. Basta instalar o aplicativo indicado no celular para conferir os valores pagos e acumulados, acompanhar os sorteios, ofertar lances e fazer outras operações. E a equipe da M2F continua disponível em todos os canais de atendimento.',
        ],
      },
      {
        id: 'quando-recebo-o-credito',
        q: 'Quando recebo o crédito?',
        a: [
          'As contemplações acontecem nas assembleias mensais, com sorteios baseados na Loteria Federal. O crédito pode ser liberado de duas formas: por sorteio, do qual todos os membros do grupo participam em iguais condições, ou por lance, um valor que você oferta para aumentar suas chances de contemplação.',
          'O lance vencedor pode ser pago com recursos próprios ou usando parte do crédito do próprio consórcio (conforme as características do plano e o regulamento). Após a análise da documentação e a aprovação, o crédito é liberado.',
          'Importante: pelas formas de contemplação, não há como garantir um prazo fixo para a contemplação e a retirada do crédito.',
        ],
      },
      {
        id: 'compra-do-bem',
        q: 'Como faço a compra do bem ou serviço?',
        a: [
          'Basta seguir as orientações desta página — e falar com um consultor da M2F é muito fácil: estamos no WhatsApp, no e-mail e no Instagram.',
        ],
      },
      {
        id: 'quem-garante',
        q: 'Quem garante?',
        a: [
          'Mais de 7 milhões de pessoas participam de consórcios em todo o Brasil. É uma forma segura, econômica e inteligente de conquistar o que você deseja — desde que feita com uma administradora autorizada, com solidez e credibilidade. Cabe ao Banco Central do Brasil a fiscalização do Sistema de Consórcios.',
          'As administradoras com que a M2F Associados trabalha são autorizadas e fiscalizadas pelo Banco Central do Brasil, assim como os demais consórcios que atuam no mercado. O BACEN é a única entidade responsável por regulamentar e fiscalizar o segmento, preservando os interesses dos participantes e garantindo segurança para quem adquire o seu consórcio.',
        ],
      },
    ],
  },
  {
    id: 'perguntas-frequentes',
    title: 'Perguntas frequentes',
    intro: 'Respostas rápidas para o que mais nos perguntam no dia a dia.',
    items: [
      {
        id: 'documentacao',
        q: 'Qual a documentação necessária?',
        a: [{ list: ['Documento de identidade (RG ou CNH)', 'E-mail', 'Comprovante de residência', 'Comprovante de renda'] }],
      },
      {
        id: 'tempo-de-contemplacao',
        q: 'Quanto tempo demora até eu ser contemplado?',
        a: [
          'Não podemos prometer um prazo para contemplação — isso, inclusive, é proibido e deve ser denunciado! Mas, com estratégia e disciplina financeira, conseguimos aumentar suas chances de ser contemplado mais rápido.',
        ],
      },
      {
        id: 'contemplado-no-final',
        q: 'Só vou ser contemplado no final?',
        a: [
          'Se você permanecer adimplente até o final, com certeza será contemplado. Mas você já concorre desde a primeira assembleia de que participa!',
        ],
      },
      {
        id: 'a-parcela-aumenta',
        q: 'A parcela aumenta?',
        a: [
          'Sim: a cada aniversário do grupo, a parcela é reajustada de acordo com um índice definido no momento da adesão. E isso não é ruim! O valor do seu crédito aumenta junto com a parcela, garantindo que você mantenha seu poder de compra na hora de usá-lo.',
        ],
      },
      {
        id: 'valor-em-maos',
        q: 'Posso pegar o valor em mãos?',
        a: [
          'Se você for utilizar o crédito, não é possível recebê-lo em conta: o valor é pago diretamente ao vendedor do bem ou serviço. As únicas formas de receber o valor em conta são vendendo a cota ou esperando o fim do grupo, recebendo assim o valor corrigido.',
        ],
      },
      {
        id: 'cancelamento',
        q: 'Como funciona o cancelamento?',
        a: [
          'A política de cancelamento varia de acordo com a administradora, podendo ou não gerar multa. Por isso, nossa recomendação é que você fale com a gente para entendermos o motivo — assim, ajudamos você a tomar a melhor decisão!',
        ],
      },
      {
        id: 'carta-de-credito',
        q: 'Como utilizo a carta de crédito?',
        a: [
          'Ao ser contemplado, ou ao adquirir uma carta contemplada, é só escolher o bem ou serviço desejado. No caso de imóvel, ele precisa ter matrícula e IPTU. Depois de escolher onde vai usar o crédito, basta iniciar a utilização junto à administradora.',
        ],
      },
      {
        id: 'quem-escolhe-o-bem',
        q: 'É a M2F que escolhe o imóvel ou automóvel que vou comprar?',
        a: [
          'Não! Você tem total liberdade para escolher o bem que deseja. A única condição é que ele tenha a documentação mínima exigida pelas regras de utilização da administradora.',
        ],
      },
    ],
  },
];

export const FAQ_PATH = '/duvidas/';

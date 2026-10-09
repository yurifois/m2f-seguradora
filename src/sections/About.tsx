import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion, scrubIn } from '../lib/motion';
import { FAQ_PATH } from '../data/faq';

const STATEMENT =
  'A M2F Associados é uma consultoria de consórcios e investimentos com sede em Brasília. Aqui você não compra uma cota e fica sozinho: um especialista acompanha cada passo — da escolha do crédito à contemplação — e decide com você o melhor destino para ele.';

// ícones de traço dos pilares (pessoas, gráfico, engrenagem, globo)
const PILLAR_ICONS = [
  ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5', 'M16 4.6a3.2 3.2 0 0 1 0 6.1', 'M18 14.8c2 .7 3.3 2.5 3.6 5.2'],
  ['M4 20V13', 'M10 20V8', 'M16 20V11', 'M22 20H2', 'M15 4h5v5'],
  [
    'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z',
    'M19.4 13.5l1.6 1.2-1.8 3.1-1.9-.6a7.4 7.4 0 0 1-1.9 1.1l-.4 2H11l-.4-2a7.4 7.4 0 0 1-1.9-1.1l-1.9.6L5 14.7l1.6-1.2a7 7 0 0 1 0-2.9L5 9.3l1.8-3.1 1.9.6a7.4 7.4 0 0 1 1.9-1.1l.4-2h3.6l.4 2c.7.3 1.3.6 1.9 1.1l1.9-.6 1.8 3.1-1.6 1.2a7 7 0 0 1 0 2.9Z',
  ],
  ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M3 12h18', 'M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z'],
];

const PILLARS = [
  {
    title: 'Consultoria do início ao fim',
    text: 'Especialistas ao seu lado em todas as etapas, com orientação clara e personalizada para o seu objetivo.',
  },
  {
    title: 'Lance com método',
    text: 'Análise estratégica para aumentar suas chances de contemplação, com base em dados e experiência.',
  },
  {
    title: 'Crédito que trabalha por você',
    text: 'Seu crédito como ferramenta de crescimento, com uso inteligente e alinhado ao seu momento de vida.',
  },
  {
    title: 'Do Brasil para o mundo',
    text: 'Atendemos em todo o território nacional e também quem busca oportunidades internacionais.',
  },
];

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.about .section-heading > *');
      // As palavras acendem com o scroll, mas permanecem legíveis no fundo claro.
      gsap.fromTo(
        '.about__word',
        { opacity: 0.2 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.04,
          scrollTrigger: { trigger: '.about__statement', start: 'top 90%', end: 'bottom 82%', scrub: 0.5 },
        },
      );
      gsap.fromTo(
        '.about__pillar',
        { opacity: 0, x: 70 },
        {
          opacity: 1,
          x: 0,
          ease: 'power2.out',
          stagger: 0.18,
          scrollTrigger: { trigger: '.about__pillars', start: 'top 95%', end: 'bottom 92%', scrub: 0.6 },
        },
      );
      gsap.fromTo(
        '.about__rail i',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.about__pillars', start: 'top 90%', end: 'bottom 90%', scrub: 0.6 },
        },
      );
      scrubIn('.about__trust, .about__faq', { start: 'top 98%', end: 'top 80%', stagger: 0.1 });
    },
    { scope: root },
  );

  return (
    <section id="sobre" className="about" ref={root} data-nav-flush aria-labelledby="sobre-title">
      <div className="container about__grid">
        <div className="about__main">
          <header className="section-heading section-heading--left">
            <p className="kicker">
              <span aria-hidden="true" />
              O que fazemos
            </p>
            <h2 id="sobre-title" className="display">
              Foco em <em>resultado</em>, não em promessa.
            </h2>
          </header>
          <p className="about__statement">
            {STATEMENT.split(' ').map((w, i) => (
              <span key={i} className="about__word">
                {w}{' '}
              </span>
            ))}
          </p>
          <p className="about__trust">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="13" r="8" />
              <circle cx="11" cy="13" r="4.5" />
              <circle cx="11" cy="13" r="1.2" />
              <path d="M11 13l9-9M17 4h3v3" />
            </svg>
            <span>
              <strong>Consórcio não é sorte.</strong>
              <strong>Trabalhamos com estratégia.</strong>
            </span>
          </p>
          <a className="btn btn--ghost about__faq" href={FAQ_PATH}>
            Tire suas dúvidas sobre consórcio
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>

        <div className="about__pillars">
          <span className="about__rail" aria-hidden="true">
            <i />
          </span>
          <ol>
            {PILLARS.map((p, i) => (
              <li key={p.title} className="about__pillar">
                <span className="about__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    {PILLAR_ICONS[i].map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </svg>
                </span>
                <span className="about__num">0{i + 1}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

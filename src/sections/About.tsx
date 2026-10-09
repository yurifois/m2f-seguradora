import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion, scrubIn } from '../lib/motion';

const STATEMENT =
  'A M2F Associados é uma consultoria de consórcios e investimentos com sede em Brasília. Aqui você não compra uma cota e fica sozinho: um especialista acompanha cada passo — da escolha do crédito à contemplação — e decide com você o melhor destino para ele.';

const PILLARS = [
  {
    title: 'Consultoria do início ao fim',
    text: 'Aquisição, acompanhamento mensal e estudo de lance. Você nunca decide no escuro.',
  },
  {
    title: 'Lance com método',
    text: 'Analisamos cada grupo para aumentar suas chances de contemplação — com estratégia, sem promessa vazia.',
  },
  {
    title: 'Crédito que trabalha por você',
    text: 'Use a carta para conquistar seu imóvel ou veículo, ou mantenha-a no grupo rendendo até o encerramento.',
  },
  {
    title: 'Do Brasil para o mundo',
    text: 'Atendemos todo o país e brasileiros que vivem no exterior e querem manter seus investimentos aqui.',
  },
];

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.about .section-heading > *');
      // o parágrafo acende palavra por palavra descendo e apaga subindo
      gsap.fromTo(
        '.about__word',
        { opacity: 0.14 },
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
      scrubIn('.about__trust', { start: 'top 98%', end: 'top 78%' });
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
              Quem somos
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
              <path d="M12 3.5 5 6.5v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9v-5l-7-3Z" />
              <path d="M8.8 12.2l2.2 2.2 4.2-4.6" />
            </svg>
            <span>
              <strong>Segurança em cada etapa.</strong> Trabalhamos com administradoras autorizadas e fiscalizadas
              pelo Banco Central do Brasil.
            </span>
          </p>
        </div>

        <div className="about__pillars">
          <span className="about__rail" aria-hidden="true">
            <i />
          </span>
          <ol>
            {PILLARS.map((p, i) => (
              <li key={p.title} className="about__pillar">
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

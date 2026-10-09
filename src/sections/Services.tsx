import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { SERVICES, STATS, type Service } from '../data/content';
import { finePointer, gsap, reducedMotion } from '../lib/motion';
import { SectionHeading } from '../components/SectionHeading';
import { Icon } from '../components/Icon';
import { sendToForm } from '../lib/lead';
import { selectQuoteTab } from './Quotes';

export function Services() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.from('.services .section-heading > *', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 82%' },
      });
      // todos os serviços chegam do fundo até a metade da rolagem da seção
      gsap.fromTo(
        '.svc',
        { opacity: 0, y: 140, z: -380, rotateX: 32, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          z: 0,
          rotateX: 0,
          scale: 1,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.services__grid', start: 'top 95%', end: 'top 40%', scrub: 0.6 },
        },
      );
      // números que sobem
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString('pt-BR')),
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="servicos" className="services" ref={root} aria-labelledby="servicos-title">
      <div className="container">
        <div className="services__top">
          <SectionHeading
            id="servicos-title"
            align="left"
            kicker="O que fazemos"
            title={
              <>
                Conquistar, <em>cuidar</em> e proteger.
              </>
            }
            lead="Consórcios para construir patrimônio, saúde para quem você ama e seguros para o que não pode faltar — tudo com um consultor ao seu lado do primeiro contato ao pós-venda."
          />
          <dl className="stats">
            {STATS.map((s) => (
              <div key={s.label} className="stats__item">
                <dt className="stats__value">
                  {s.prefix}
                  <span data-count={s.value}>{reducedMotion ? s.value : 0}</span>
                  {s.suffix}
                </dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="services__grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service: s }: { service: Service }) {
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!finePointer) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const quote = s.quoteTab;
  return (
    <article className={`svc svc--${s.size}`} data-pillar={s.pillar} onPointerMove={onMove}>
      <div className="svc__top">
        <span className="svc__pillar">{s.pillar}</span>
        {s.isNew ? <span className="svc__new">Novo</span> : null}
      </div>
      {s.size === 'xl' ? (
        <span className="svc__zero" aria-hidden="true">
          0%
          <small>de juros</small>
        </span>
      ) : null}
      <Icon name={s.icon} className="svc__icon" />
      <h3 className="svc__title">{s.title}</h3>
      <p className="svc__text">{s.text}</p>
      {s.steps ? (
        <ol className="svc__steps">
          {s.steps.map((st, i) => (
            <li key={st}>
              <span>0{i + 1}</span>
              {st}
            </li>
          ))}
        </ol>
      ) : null}
      {s.size === 'tall' ? (
        <svg className="svc__pulse" viewBox="0 0 240 60" aria-hidden="true">
          <path className="svc__pulse-base" d="M0 34h70l10-16 14 34 14-46 12 40 8-12h112" />
          <path className="svc__pulse-run" d="M0 34h70l10-16 14 34 14-46 12 40 8-12h112" pathLength="1" />
        </svg>
      ) : null}
      <ul className="svc__tags">
        {s.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <button
        type="button"
        className="svc__cta"
        onClick={() =>
          quote ? selectQuoteTab(quote) : sendToForm({ products: [s.id], details: '' })
        }
      >
        {s.cta}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}

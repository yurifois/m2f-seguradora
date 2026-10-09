import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { SERVICES, STATS, type Service } from '../data/content';
import { finePointer, gsap, reducedMotion, scrubIn } from '../lib/motion';
import { SectionHeading } from '../components/SectionHeading';
import { Icon } from '../components/Icon';
import { ServiceArt } from '../components/ServiceArt';
import '../styles/art.css';
import { sendToForm } from '../lib/lead';
import { selectQuoteTab } from './Quotes';

export function Services() {
  const root = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // as ilustrações só animam enquanto a grade está visível
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const io = new IntersectionObserver(([e]) => grid.classList.toggle('is-live', e.isIntersecting), {
      rootMargin: '100px 0px',
    });
    io.observe(grid);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.services .section-heading > *');
      scrubIn('.stats__item', { start: 'top 98%', end: 'top 70%' });
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
      // números que sobem descendo e voltam a zero subindo
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString('pt-BR')),
          scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 62%', scrub: 0.6 },
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

        <div className="services__grid" ref={gridRef}>
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
      {s.size === 'md' ? <ServiceArt id={s.id} /> : <Icon name={s.icon} className="svc__icon" />}
      {s.size === 'xl' ? <ServiceArt id={s.id} /> : null}
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
      {s.size === 'tall' ? <ServiceArt id={s.id} /> : null}
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

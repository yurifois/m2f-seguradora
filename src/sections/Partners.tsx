import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { PARTNERS } from '../data/content';
import { DESKTOP_MQ, gsap, reducedMotion, scrubIn } from '../lib/motion';
import { SectionHeading } from '../components/SectionHeading';

type Metrics = { startX: number; startY: number; arc: number };

/** Posição do card ao longo do arco (t: 0 → 1). Vem de baixo à direita, sobe e pousa. */
function placeOnArc(card: HTMLElement, t: number, m: Metrics) {
  const e = 1 - Math.pow(1 - t, 3);
  const x = m.startX * (1 - e);
  const y = m.startY * (1 - e) - Math.sin(Math.PI * e) * m.arc;
  const rz = 26 * (1 - e);
  const ry = -42 * (1 - e);
  const s = 0.8 + 0.2 * e;
  card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  card.style.opacity = String(Math.min(1, t * 3.2));
  card.style.setProperty('--land', e.toFixed(3));
}

function measure(card: HTMLElement, compact: boolean): Metrics {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = 0;
  let el: HTMLElement | null = card;
  while (el) {
    left += el.offsetLeft;
    el = el.offsetParent as HTMLElement | null;
  }
  return {
    startX: vw - left + vw * 0.08,
    startY: vh * (compact ? 0.12 : 0.3),
    arc: vh * (compact ? 0.1 : 0.24),
  };
}

export function Partners() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.pcard');
      if (reducedMotion) return;
      const mm = gsap.matchMedia();

      // Desktop: seção fixada; os cards entram um a um em arco e se alinham ao centro
      mm.add(DESKTOP_MQ, () => {
        let metrics = cards.map((c) => measure(c, false));
        const progress = cards.map(() => ({ t: 0 }));
        const render = () => cards.forEach((c, i) => placeOnArc(c, progress[i].t, metrics[i]));
        render();
        const windows: [number, number][] = [
          [0.2, 0.42],
          [0.45, 0.62],
          [0.65, 0.82],
        ];
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 0.7,
            onRefresh: () => {
              metrics = cards.map((c) => measure(c, false));
              render();
            },
          },
        });
        windows.forEach(([a, b], i) => {
          tl.to(progress[i], { t: 1, duration: b - a, onUpdate: render }, a);
        });
        tl.to({}, { duration: 0.18 }, 0.82);
        return () => cards.forEach((c) => (c.style.cssText = ''));
      });

      // Mobile: cada card faz o próprio arco ao entrar na tela
      mm.add(`not all and ${DESKTOP_MQ}`, () => {
        cards.forEach((card) => {
          let m = measure(card, true);
          const p = { t: 0 };
          placeOnArc(card, 0, m);
          gsap.to(p, {
            t: 1,
            ease: 'none',
            onUpdate: () => placeOnArc(card, p.t, m),
            scrollTrigger: {
              trigger: card,
              start: 'top 98%',
              end: 'top 52%',
              scrub: 0.6,
              onRefresh: () => {
                m = measure(card, true);
                placeOnArc(card, p.t, m);
              },
            },
          });
        });
        return () => cards.forEach((c) => (c.style.cssText = ''));
      });

      scrubIn('.partners .section-heading > *', { start: 'top 98%', end: 'top 55%' });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="associados" className="partners" ref={root} data-nav-settle="0.86" aria-labelledby="associados-title">
      <div className="partners__pin">
        <SectionHeading
          id="associados-title"
          kicker="Nosso time"
          title={
            <>
              Quem está por trás da <em>M2F</em>
            </>
          }
          lead="Três sócios, a mesma visão: transformar planos em conquistas."
        />
        <ul className="partners__row">
          {PARTNERS.map((p) => (
            <li key={p.id} className="pcard">
              <figure className="pcard__face">
                <img src={p.photo} alt={`Foto de ${p.name}`} loading="lazy" decoding="async" />
                <div className="pcard__shade" />
                <figcaption className="pcard__name">
                  <span className="sr-only">{p.name}</span>
                  <span aria-hidden="true">{p.name.split(' ')[0]}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

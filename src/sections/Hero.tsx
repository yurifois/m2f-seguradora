import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger, getLenis, gsap, reducedMotion, scene, scrollToSection } from '../lib/motion';

const NAME = 'M2F Associados';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // quem navega pelo teclado não pode focar um botão ainda invisível: rola até ele aparecer
  const revealOnFocus = () => {
    const el = root.current;
    if (!el || reducedMotion || scene.heroProgress > 0.5) return;
    const y = el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.55;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  };

  useGSAP(
    () => {
      // camadas fixas ficam fora do escopo da seção: referências diretas
      const $ = (sel: string) => document.querySelectorAll<HTMLElement>(sel);
      if (reducedMotion) {
        // sem animação: só troca a logo do fundo depois do hero
        const stageEl = document.querySelector('.stage');
        ScrollTrigger.create({
          trigger: root.current,
          start: 'bottom 70%',
          onEnter: () => stageEl?.classList.add('is-past-hero'),
          onLeaveBack: () => stageEl?.classList.remove('is-past-hero'),
        });
        return;
      }

      // anéis da marca se desenham na entrada
      gsap.fromTo(
        $('.stage .ring'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.12, delay: 0.2 },
      );
      gsap.from('.hero__meta > *', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.9 });

      const el = root.current!;
      const nameEl = el.querySelector<HTMLElement>('.hero__name')!;
      const chars = [...el.querySelectorAll<HTMLElement>('.hero__char')];
      const rule = el.querySelector<HTMLElement>('.hero__rule')!;
      const reveals = [...el.querySelectorAll<HTMLElement>('.hero__reveal')];
      const cue = el.querySelector<HTMLElement>('.hero__cue')!;

      // ordem de entrada das letras: do centro para as pontas
      const mid = (chars.length - 1) / 2;
      const rank = chars.map((_, i) => Math.abs(i - mid));
      const drift = chars.map(() => gsap.utils.random(-60, 60));

      // distância (sem transform) do nome até o centro da logo: o nome nasce em cima dela
      let toLogo = -200;
      const measure = () => {
        const anchor = document.querySelector<HTMLElement>('.stage__anchor');
        if (!anchor) return;
        const a = anchor.getBoundingClientRect();
        const center = nameEl.offsetTop + nameEl.offsetHeight / 2;
        toLogo = a.top + a.height / 2 - center;
      };

      const clamp = gsap.utils.clamp(0, 1);
      const out2 = (t: number) => 1 - (1 - t) * (1 - t);
      const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
      const state = { p: 0 };

      // Estado do hero é função pura do progresso: ida e volta da rolagem sempre batem.
      const render = () => {
        const p = state.p;
        const e = out2(clamp(p / 0.42));
        gsap.set(nameEl, { y: toLogo * (1 - e), scale: 2.3 - 1.3 * e });
        chars.forEach((c, i) => {
          const t = out3(clamp((p - 0.02 - rank[i] * 0.03) / 0.26));
          c.style.opacity = String(t);
          c.style.filter = t > 0.99 ? 'none' : `blur(${(14 * (1 - t)).toFixed(2)}px)`;
          c.style.transform = `translateY(${(drift[i] * (1 - t)).toFixed(1)}%)`;
        });
        rule.style.transform = `scaleX(${out3(clamp((p - 0.26) / 0.2))})`;
        reveals.forEach((r, j) => {
          const t = out3(clamp((p - 0.3 - j * 0.05) / 0.16));
          r.style.opacity = String(t);
          r.style.transform = `translateY(${(26 * (1 - t)).toFixed(1)}px)`;
          r.style.pointerEvents = t > 0.6 ? 'auto' : 'none';
        });
        cue.style.opacity = String(1 - clamp(p / 0.08));
      };
      measure();
      render();

      gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onRefresh: () => {
            measure();
            render();
          },
          onUpdate: (self) => {
            scene.heroProgress = self.progress;
          },
        },
      });

      gsap.set($('.stage__static-logo'), { opacity: 0, scale: 0.92 });
      // saída: a logo 3D para de frente, embranquece e dá lugar à logo escultural estática
      const vh = () => window.innerHeight;
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: () => `top+=${vh() * 0.7} top`,
            end: () => `bottom top+=${vh() * 0.45}`,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              scene.heroExit = self.progress;
              scene.smokeDensity = 0.62 - 0.2 * self.progress;
            },
          },
        })
        .to($('.stage__rings'), { opacity: 0.18, duration: 1 }, 0)
        .to($('.stage__aura'), { opacity: 0, duration: 0.8 }, 0)
        .to($('.stage__logo-fallback'), { opacity: 0, duration: 0.6 }, 0.4)
        .to($('.stage__static-logo'), { opacity: 0.045, scale: 1, duration: 0.55, ease: 'power1.out' }, 0.45);
    },
    { scope: root },
  );

  return (
    <section id="inicio" className="hero" ref={root} aria-label="Apresentação">
      <div className="hero__pin">
        <div className="hero__logo-space" aria-hidden="true" />
        <h1 className="hero__name">
          <span className="sr-only">M2F Associados — consórcios, saúde e seguros</span>
          <span className="hero__name-inner" aria-hidden="true">
            {NAME.split('').map((ch, i) => (
              <span key={i} className={`hero__char${ch === ' ' ? ' hero__char--space' : ''}`}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </span>
        </h1>
        <span className="hero__rule" aria-hidden="true" />
        <p className="hero__kicker hero__reveal">Consórcios · Saúde · Seguros</p>
        <p className="hero__tagline hero__reveal">
          Planejamento para <em>proteger</em> e <em>conquistar</em>.
        </p>
        <div className="hero__ctas hero__reveal" onFocusCapture={revealOnFocus}>
          <a
            className="btn btn--primary"
            href="#cotacoes"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('cotacoes');
            }}
          >
            Simular meu consórcio
          </a>
          <a
            className="btn btn--ghost"
            href="#sobre"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('sobre');
            }}
          >
            Conhecer a M2F
          </a>
        </div>

        <div className="hero__meta">
          <span>Brasília · Goiânia</span>
          <span>Atendimento em todo o Brasil e para brasileiros no exterior</span>
        </div>
        <div className="hero__cue" aria-hidden="true">
          <span>Role para descobrir</span>
          <i />
        </div>
      </div>
    </section>
  );
}

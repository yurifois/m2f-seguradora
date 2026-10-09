import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

/** Layout "desktop" das cenas fixadas (cards lado a lado, pin longo). */
export const DESKTOP_MQ = '(min-width: 900px)';

/**
 * Estado transitório compartilhado entre DOM e canvas (fumaça e logo 3D).
 * Atualizado pelo ScrollTrigger/pointer e lido a cada quadro — nunca vira state do React.
 */
export const scene = {
  heroProgress: 0, // 0 → 1 enquanto o hero está fixado
  heroExit: 0, // 0 → 1 na troca da logo 3D pela logo branca estática
  smokeDensity: 0.62,
  scrollVelocity: 0,
  mouseX: 0.5,
  mouseY: 0.5,
  heroVisible: true,
};

/**
 * Entrada amarrada à rolagem: descendo, o elemento aparece; subindo, ele sai do mesmo jeito.
 * O gatilho é o próprio elemento (ou o primeiro da lista), então funciona dentro de cenas fixadas.
 */
export function scrubIn(
  targets: gsap.TweenTarget,
  opts: { trigger?: gsap.DOMTarget; start?: string; end?: string; y?: number; stagger?: number } = {},
) {
  const list = gsap.utils.toArray<Element>(targets);
  if (!list.length) return null;
  return gsap.fromTo(
    list,
    { opacity: 0, y: opts.y ?? 40 },
    {
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      stagger: opts.stagger ?? 0.12,
      scrollTrigger: {
        trigger: opts.trigger ?? list[0],
        start: opts.start ?? 'top 95%',
        end: opts.end ?? 'top 60%',
        scrub: 0.6,
      },
    },
  );
}

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (reducedMotion || lenis) return lenis;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', (l: Lenis) => {
    scene.scrollVelocity = l.velocity;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) Object.assign(window, { lenis });
  return lenis;
}

export function getLenis() {
  return lenis;
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle('is-locked', locked);
}

/**
 * Posição de destino de cada seção pelo menu. Seções fixadas (pin) recebem um
 * deslocamento para que o conteúdo já esteja montado quando a pessoa chegar.
 */
export function scrollToSection(id: string, { immediate = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = 64;
  let y = el.getBoundingClientRect().top + window.scrollY;
  const settle = parseFloat(el.dataset.navSettle ?? '0');
  if (settle > 0) {
    y += Math.max(0, el.offsetHeight - window.innerHeight) * settle;
  } else if (id !== 'inicio' && el.dataset.navFlush === undefined) {
    // seções de tela cheia já reservam o espaço do menu: param exatamente no topo
    y -= header;
  }
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: reducedMotion || immediate ? 'auto' : 'smooth' });
  // foco acessível no destino, sem pular a rolagem
  window.setTimeout(() => {
    const heading = el.querySelector<HTMLElement>('h1, h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 900);
}

export { gsap, ScrollTrigger };

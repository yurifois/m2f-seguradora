import { ScrollTrigger, getLenis } from './motion';

/*
 * Encaixe da rolagem (só no computador, mouse/trackpad): quando a pessoa para de rolar perto
 * do próximo enquadramento, a página desliza até ele — fica fácil parar com a seção inteira na tela.
 * Os pontos são recalculados a cada refresh do ScrollTrigger (fontes, fotos, redimensionar).
 */

const DESKTOP = '(min-width: 900px) and (min-height: 560px)';

/** Posições de rolagem em que cada seção está montada e enquadrada. */
function frames(): number[] {
  const vh = window.innerHeight;
  const header = document.querySelector('.header__bar')?.getBoundingClientRect().height ?? 76;
  const at = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  const out = [0];
  // seções que travam por dentro: o ponto em que a montagem terminou e a seção ainda está presa
  const pinned: [string, number][] = [
    ['inicio', 0.6], // nome, chamada e botões na tela, antes da logo virar a escultural
    ['sobre', 0.75], // prédio pronto
    ['cotacao', 0.75], // casa e carro prontos
    ['associados', 0.85], // os três sócios no lugar
  ];
  for (const [id, f] of pinned) {
    const s = document.getElementById(id);
    if (s) out.push(at(s) + Math.max(0, s.offsetHeight - window.innerHeight) * f);
  }
  // seções com trava no fim (Hold): o começo, se forem mais altas que a tela, e o meio da trava
  document.querySelectorAll<HTMLElement>('.hold').forEach((wrap) => {
    const s = wrap.firstElementChild as HTMLElement;
    const top = at(wrap);
    if (s.offsetHeight > vh) out.push(top + parseFloat(getComputedStyle(s).paddingTop) - header - 16);
    out.push(top + Math.max(0, s.offsetHeight - vh) + vh * 0.25);
  });
  out.push(document.documentElement.scrollHeight - vh);
  return out.map((v) => Math.max(0, Math.round(v)));
}

const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function initSnap() {
  const lenis = getLenis();
  if (!lenis) return () => {};
  const mq = window.matchMedia(DESKTOP);
  let points: number[] = [];
  let dir = 1;
  let timer = 0;

  const update = () => {
    points = mq.matches ? frames().sort((a, b) => a - b) : [];
  };

  // Quando a rolagem para: puxa para o próximo enquadramento no sentido em que a pessoa rolava
  // (se estiver perto), ou corrige para trás só se ela passou um pouquinho do ponto.
  // Nunca puxa contra a rolagem — longe de tudo, a página fica onde parou.
  const settle = () => {
    if (!points.length) return;
    const vh = window.innerHeight;
    const at = lenis.targetScroll;
    const ahead = dir > 0 ? points.find((p) => p >= at) : [...points].reverse().find((p) => p <= at);
    const behind = dir > 0 ? [...points].reverse().find((p) => p < at) : points.find((p) => p > at);
    let to: number | undefined;
    if (ahead !== undefined && Math.abs(ahead - at) <= vh * 0.45) to = ahead;
    else if (behind !== undefined && Math.abs(at - behind) <= vh * 0.1) to = behind;
    if (to === undefined || Math.abs(to - at) < 2) return;
    lenis.scrollTo(to, { duration: 0.9, easing: outCubic });
  };

  const onInput = ({ deltaY, event }: { deltaY: number; event: Event }) => {
    if (!mq.matches || event.type.startsWith('touch')) return;
    if (deltaY) dir = Math.sign(deltaY);
    window.clearTimeout(timer);
    timer = window.setTimeout(settle, 240);
  };

  lenis.on('virtual-scroll', onInput);
  ScrollTrigger.addEventListener('refresh', update);
  mq.addEventListener('change', update);
  update();
  return () => {
    lenis.off('virtual-scroll', onInput);
    ScrollTrigger.removeEventListener('refresh', update);
    mq.removeEventListener('change', update);
    window.clearTimeout(timer);
  };
}

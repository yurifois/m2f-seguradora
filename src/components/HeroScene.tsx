import '../styles/scene.css';
import { Casa, Obra } from './HeroBuild';
import { boxFaces, clamp, out2, out3 } from './glass';

/*
 * Cena do hero (fica no palco fixo, entre a fumaça e a logo 3D), tudo em vidro turquesa:
 * prédio em construção e casa sendo erguida, carro chegando → os dois viram poeira → gráfico
 * subindo num canto, estetoscópio com o traçado do batimento no outro, avião cruzando o topo.
 * O Hero controla tudo pela rolagem; aqui ficam a marcação e o desenho de cada peça.
 */

/* ---------------------------------------------------------------- gráfico de vidro */

// o gráfico ainda é inclinado em diagonal (skewY no grupo), subindo da esquerda para a direita
const BASE = { x0: 20, x1: 560, y: 440, thick: 18, depth: 2.6 };
const BAR_W = 72;
const BAR_DEPTH = 1.6;
const BAR_Y = BASE.y - (BASE.depth * 14) / 2 + 2; // assentadas no meio do tampo
const BARS = [64, 112, 165, 225, 292].map((h, i) => ({ x: 56 + i * 102, h }));
const ARROW = 'M 34 356 C 210 330, 400 250, 552 96';

/** Desenha o gráfico no progresso t (0 → 1): base, barras subindo uma a uma, seta riscando o caminho. */
export function renderChart(svg: SVGSVGElement, t: number) {
  const b = out3(clamp(t / 0.18));
  const base = svg.querySelector<SVGGElement>('.hc-base')!;
  base.style.opacity = String(b);
  base.style.transform = `translateY(${(18 * (1 - b)).toFixed(1)}px)`;

  svg.querySelectorAll<SVGGElement>('.hc-bar').forEach((g, i) => {
    const s = out3(clamp((t - 0.1 - i * 0.085) / 0.3));
    const f = boxFaces(BARS[i].x, BAR_Y, BAR_W, Math.max(2, BARS[i].h * s), BAR_DEPTH);
    g.style.opacity = String(clamp(s * 5));
    g.querySelector('.hc-side')!.setAttribute('points', f.side);
    g.querySelector('.hc-lid')!.setAttribute('points', f.lid);
    g.querySelectorAll('.hc-front').forEach((el) => el.setAttribute('points', f.front));
  });

  const a = out2(clamp((t - 0.5) / 0.42));
  svg.querySelectorAll<SVGPathElement>('.hc-arrow path').forEach((p) => {
    p.style.strokeDashoffset = String(1 - a);
  });
  const head = svg.querySelector<SVGGElement>('.hc-head')!;
  const hs = out3(clamp((t - 0.84) / 0.16));
  head.style.opacity = String(clamp(hs * 2));
  head.style.transform = `translate(552px, 96px) rotate(-44deg) scale(${(0.4 + 0.6 * hs).toFixed(3)})`;
}

function Chart() {
  const base = boxFaces(BASE.x0, BASE.y + BASE.thick, BASE.x1 - BASE.x0, BASE.thick, BASE.depth);
  return (
    <svg className="scene__chart" viewBox="0 0 640 560" aria-hidden="true">
      <defs>
        <linearGradient id="hc-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6fbff" stopOpacity=".92" />
          <stop offset=".45" stopColor="#7dd3ef" stopOpacity=".6" />
          <stop offset="1" stopColor="#18a6dc" stopOpacity=".74" />
        </linearGradient>
        <linearGradient id="hc-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#43bde8" stopOpacity=".78" />
          <stop offset="1" stopColor="#0a6fa6" stopOpacity=".84" />
        </linearGradient>
        <linearGradient id="hc-lid" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset="1" stopColor="#bdf0ff" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id="hc-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset=".18" stopColor="#fff" stopOpacity="0" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".38" stopColor="#fff" stopOpacity="0" />
          <stop offset=".62" stopColor="#fff" stopOpacity="0" />
          <stop offset=".68" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".74" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hc-arrow" x1="34" y1="356" x2="552" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7fd9f2" stopOpacity=".55" />
          <stop offset=".6" stopColor="#3cc4ec" stopOpacity=".85" />
          <stop offset="1" stopColor="#14a9de" />
        </linearGradient>
        <radialGradient id="hc-floor">
          <stop offset="0" stopColor="#1aa9d6" stopOpacity=".32" />
          <stop offset="1" stopColor="#1aa9d6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform="translate(0 72) skewY(-9)">
        <ellipse cx="320" cy="468" rx="330" ry="34" fill="url(#hc-floor)" />

        <g className="hc-base">
          <polygon points={base.side} fill="url(#hc-side)" stroke="#bff1ff" strokeWidth="1" />
          <polygon points={base.lid} fill="url(#hc-lid)" fillOpacity=".7" stroke="#fff" strokeWidth="1.2" />
          <polygon points={base.front} fill="url(#hc-front)" stroke="#fff" strokeWidth="1.2" />
        </g>

        {BARS.map((_, i) => (
          <g key={i} className="hc-bar">
            <polygon className="hc-side" fill="url(#hc-side)" stroke="#bff1ff" strokeWidth="1" strokeLinejoin="round" />
            <polygon className="hc-lid" fill="url(#hc-lid)" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon className="hc-front" fill="url(#hc-front)" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            <polygon className="hc-front" fill="url(#hc-shine)" />
          </g>
        ))}

        <g className="hc-arrow" fill="none" strokeLinecap="round">
          <path d={ARROW} pathLength={1} stroke="#0aa6dc" strokeOpacity=".22" strokeWidth="30" />
          <path d={ARROW} pathLength={1} stroke="url(#hc-arrow)" strokeWidth="20" />
          <path d={ARROW} pathLength={1} stroke="#fff" strokeOpacity=".85" strokeWidth="3.5" />
        </g>
        <g className="hc-head">
          <polygon points="40,0 -10,-30 -2,0 -10,30" fill="#22b6e6" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="40,0 -10,-30 -2,0" fill="#dff8ff" fillOpacity=".75" />
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- estetoscópio + batimento */

const BIN_L = 'M128 36 C 120 84, 132 130, 182 152';
const BIN_R = 'M236 36 C 244 84, 232 130, 182 152';
const TUBE = 'M182 152 C 180 214, 230 250, 282 240 C 326 232, 346 200, 344 166';
const CHEST = { x: 344, y: 128 };
const ECG =
  'M8 292 H70 Q80 278 90 292 H104 L112 304 L124 236 L136 316 L144 292 H166 Q182 270 198 292 H240 ' +
  'Q250 278 260 292 H274 L282 304 L294 236 L306 316 L314 292 H336 Q352 270 368 292 H412';

/** Estetoscópio se formando (tubos riscando, olivas e campânula surgindo) e o batimento sendo traçado embaixo. */
export function renderHealth(svg: SVGSVGElement, t: number) {
  const bin = out2(clamp(t / 0.3));
  svg.querySelectorAll<SVGPathElement>('.hs-bin path').forEach((p) => (p.style.strokeDashoffset = String(1 - bin)));
  const tube = out2(clamp((t - 0.16) / 0.34));
  svg.querySelectorAll<SVGPathElement>('.hs-tube path').forEach((p) => (p.style.strokeDashoffset = String(1 - tube)));
  const tips = out3(clamp((t - 0.2) / 0.14));
  svg.querySelectorAll<SVGGElement>('.hs-tip').forEach((g) => {
    g.style.opacity = String(tips);
    g.style.transform = `scale(${(0.3 + 0.7 * tips).toFixed(3)})`;
  });
  const chest = out3(clamp((t - 0.42) / 0.2));
  const c = svg.querySelector<SVGGElement>('.hs-chest')!;
  c.style.opacity = String(clamp(chest * 2));
  c.style.transform = `translate(${CHEST.x}px, ${CHEST.y}px) rotate(${(-120 * (1 - chest)).toFixed(1)}deg) scale(${(0.2 + 0.8 * chest).toFixed(3)})`;

  const ecg = out2(clamp((t - 0.5) / 0.42));
  const lines = svg.querySelectorAll<SVGPathElement>('.hs-ecg .draw');
  lines.forEach((p) => (p.style.strokeDashoffset = String(1 - ecg)));
  const dot = svg.querySelector<SVGCircleElement>('.hs-dot')!;
  const path = lines[0];
  const pt = path.getPointAtLength(path.getTotalLength() * ecg);
  dot.setAttribute('cx', pt.x.toFixed(1));
  dot.setAttribute('cy', pt.y.toFixed(1));
  dot.style.opacity = ecg > 0 && ecg < 1 ? '1' : '0';
  svg.querySelector<SVGPathElement>('.hs-pulse')!.style.opacity = String(clamp((t - 0.93) / 0.07));
}

function Health() {
  return (
    <svg className="scene__health" viewBox="0 0 420 330" aria-hidden="true">
      <defs>
        <linearGradient id="hs-tube" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd9f2" />
          <stop offset=".55" stopColor="#2cb8e6" />
          <stop offset="1" stopColor="#0d8fca" />
        </linearGradient>
        <radialGradient id="hs-glass" cx=".38" cy=".34" r=".75">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".98" />
          <stop offset=".45" stopColor="#bdeefc" stopOpacity=".85" />
          <stop offset="1" stopColor="#1ba7dc" stopOpacity=".9" />
        </radialGradient>
        <linearGradient id="hs-ecg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7fd9f2" stopOpacity=".5" />
          <stop offset=".5" stopColor="#14a9de" />
          <stop offset="1" stopColor="#0aa6dc" />
        </linearGradient>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g className="hs-bin">
          {[BIN_L, BIN_R].map((d) => (
            <g key={d}>
              <path d={d} pathLength={1} stroke="#0aa6dc" strokeOpacity=".2" strokeWidth="18" />
              <path d={d} pathLength={1} stroke="url(#hs-tube)" strokeWidth="9" />
              <path d={d} pathLength={1} stroke="#fff" strokeOpacity=".85" strokeWidth="2.2" />
            </g>
          ))}
        </g>
        <g className="hs-tube">
          <path d={TUBE} pathLength={1} stroke="#0aa6dc" strokeOpacity=".2" strokeWidth="22" />
          <path d={TUBE} pathLength={1} stroke="url(#hs-tube)" strokeWidth="12" />
          <path d={TUBE} pathLength={1} stroke="#fff" strokeOpacity=".85" strokeWidth="2.6" />
        </g>
      </g>

      {[
        [128, 30],
        [236, 30],
      ].map(([x, y]) => (
        <g key={x} className="hs-tip" style={{ transformOrigin: `${x}px ${y}px` }}>
          <ellipse cx={x} cy={y} rx="11" ry="9" fill="url(#hs-glass)" stroke="#fff" strokeWidth="2" />
        </g>
      ))}

      <g className="hs-chest">
        <rect x="-7" y="30" width="14" height="12" rx="3" fill="url(#hs-tube)" stroke="#fff" strokeWidth="1.5" />
        <circle r="36" fill="url(#hs-glass)" stroke="#fff" strokeWidth="2.5" />
        <circle r="24" fill="none" stroke="#0e9bd3" strokeOpacity=".55" strokeWidth="2" />
        <path d="M-22 -14 A26 26 0 0 1 4 -27" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g className="hs-ecg" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="draw" d={ECG} pathLength={1} stroke="#0aa6dc" strokeOpacity=".22" strokeWidth="11" />
        <path className="draw" d={ECG} pathLength={1} stroke="url(#hs-ecg)" strokeWidth="4.5" />
        <path className="draw" d={ECG} pathLength={1} stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" />
        <path className="hs-pulse" d={ECG} pathLength={1} stroke="#fff" strokeWidth="4" />
        <circle className="hs-dot" r="6" fill="#fff" stroke="#14a9de" strokeWidth="3" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- avião cruzando o topo */

const skyCache = new WeakMap<SVGSVGElement, { key: string; len: number }>();

/** Avião voando de um canto ao outro do topo, deixando um rastro que se apaga. */
export function renderPlane(svg: SVGSVGElement, t: number) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const route = svg.querySelector<SVGPathElement>('.sky-route')!;
  let cache = skyCache.get(svg);
  const key = `${W}x${H}`;
  if (!cache || cache.key !== key) {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 70;
    const y0 = header + H * 0.085;
    const y1 = header + H * 0.03;
    const d = `M ${-140} ${y0} C ${W * 0.3} ${y0 - H * 0.05}, ${W * 0.68} ${y1 + H * 0.035}, ${W + 140} ${y1}`;
    svg.querySelectorAll('.sky-route, .sky-trail').forEach((p) => p.setAttribute('d', d));
    cache = { key, len: route.getTotalLength() };
    skyCache.set(svg, cache);
  }
  const L = cache.len;
  const s = L * t;
  const pt = route.getPointAtLength(s);
  const ahead = route.getPointAtLength(Math.min(L, s + 2));
  const behind = route.getPointAtLength(Math.max(0, s - 2));
  const deg = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
  const size = W < 700 ? 54 : 88;
  svg.querySelector('.sky-plane')!.setAttribute(
    'transform',
    `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${deg.toFixed(2)}) scale(${size / 100}) translate(-56 -30)`,
  );
  const seg = Math.min(s, L * 0.36);
  const tail = route.getPointAtLength(s - seg);
  svg.querySelectorAll<SVGPathElement>('.sky-trail').forEach((p) => {
    p.style.strokeDasharray = `${seg.toFixed(1)} ${(L * 2).toFixed(0)}`;
    p.style.strokeDashoffset = String(-(s - seg));
  });
  const g = svg.querySelector('#sky-fade')!;
  g.setAttribute('x1', tail.x.toFixed(1));
  g.setAttribute('y1', tail.y.toFixed(1));
  g.setAttribute('x2', pt.x.toFixed(1));
  g.setAttribute('y2', pt.y.toFixed(1));
  svg.style.opacity = t > 0 && t < 1 ? '1' : '0';
}

function Sky() {
  return (
    <svg className="scene__sky" aria-hidden="true">
      <defs>
        <linearGradient id="sky-fade" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".95" />
        </linearGradient>
        <linearGradient id="sky-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#bfeefc" />
        </linearGradient>
        <filter id="sky-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#00507a" floodOpacity=".28" />
        </filter>
      </defs>
      <path className="sky-route" fill="none" stroke="none" />
      <path className="sky-trail" fill="none" stroke="#0aa6dc" strokeOpacity=".25" strokeWidth="7" strokeLinecap="round" />
      <path className="sky-trail" fill="none" stroke="url(#sky-fade)" strokeWidth="2.4" strokeLinecap="round" />
      <g className="sky-plane" filter="url(#sky-shadow)">
        {/* vista de cima, apontando para a direita */}
        <path
          d="M60 25 L40 2 L33 2 L44 25 Z M60 35 L40 58 L33 58 L44 35 Z"
          fill="url(#sky-body)"
          stroke="#2cb8e6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M20 25 L11 12 L6 12 L12 25 Z M20 35 L11 48 L6 48 L12 35 Z"
          fill="url(#sky-body)"
          stroke="#2cb8e6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 30 C8 26 14 25 22 25 L86 25 C96 25 104 28 104 30 C104 32 96 35 86 35 L22 35 C14 35 8 34 8 30 Z"
          fill="url(#sky-body)"
          stroke="#14a9de"
          strokeWidth="1.6"
        />
        <path d="M24 28.5 H88" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- cena */

export function HeroScene() {
  return (
    <div className="scene">
      <Obra />
      <Casa />
      <canvas className="scene__dust" />
      <Chart />
      <Health />
      <Sky />
    </div>
  );
}

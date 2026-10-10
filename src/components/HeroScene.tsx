import '../styles/scene.css';

/*
 * Cena do hero (fica no palco fixo, entre a fumaça e a logo 3D):
 * casa com piscina → carro estacionando no mesmo lugar → gráfico de vidro crescendo à esquerda.
 * O Hero controla tudo pela rolagem; aqui só a marcação e o desenho do gráfico.
 */

// projeção oblíqua: profundidade vai para a direita e para cima
const DX = 24;
const DY = -14;
const BASE = { x0: 20, x1: 560, y: 440, thick: 18, depth: 2.6 };
const BAR_W = 72;
const BAR_DEPTH = 1.6;
const BAR_Y = BASE.y - (BASE.depth * -DY) / 2 + 2; // assentadas no meio do tampo
const BARS = [64, 112, 165, 225, 292].map((h, i) => ({ x: 56 + i * 102, h }));
const ARROW = 'M 34 356 C 210 330, 400 250, 552 96';

const pts = (p: number[][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function boxFaces(x: number, yBottom: number, w: number, h: number, depth: number) {
  const dx = DX * depth;
  const dy = DY * depth;
  const top = yBottom - h;
  return {
    front: pts([[x, top], [x + w, top], [x + w, yBottom], [x, yBottom]]),
    side: pts([[x + w, top], [x + w + dx, top + dy], [x + w + dx, yBottom + dy], [x + w, yBottom]]),
    lid: pts([[x, top], [x + dx, top + dy], [x + w + dx, top + dy], [x + w, top]]),
  };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
const out2 = (t: number) => 1 - (1 - t) * (1 - t);

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
    <svg className="scene__chart" viewBox="0 0 640 500" aria-hidden="true">
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
    </svg>
  );
}

export function HeroScene() {
  return (
    <div className="scene">
      <div className="scene__house">
        <img
          className="scene__casa"
          src="/img/hero/casa.webp"
          srcSet="/img/hero/casa-1100.webp 1100w, /img/hero/casa.webp 1840w"
          sizes="(max-width: 700px) 170vw, 66vw"
          alt=""
          decoding="async"
          fetchPriority="high"
        />
        <img className="scene__carro" src="/img/hero/carro.webp" alt="" decoding="async" />
      </div>
      <Chart />
    </div>
  );
}

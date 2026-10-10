// Peças comuns aos desenhos de vidro do hero (gráfico, prédio, casa, carro):
// projeção oblíqua, curvas de easing e os degradês turquesa.

// projeção oblíqua: a profundidade vai para a direita e para cima
export const DX = 24;
export const DY = -14;

export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
export const out2 = (t: number) => 1 - (1 - t) * (1 - t);

export const pts = (p: number[][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Faces visíveis de uma caixa: frente, lateral direita e tampo. */
export function boxFaces(x: number, yBottom: number, w: number, h: number, depth: number) {
  const dx = DX * depth;
  const dy = DY * depth;
  const top = yBottom - h;
  return {
    front: pts([[x, top], [x + w, top], [x + w, yBottom], [x, yBottom]]),
    side: pts([[x + w, top], [x + w + dx, top + dy], [x + w + dx, yBottom + dy], [x + w, yBottom]]),
    lid: pts([[x, top], [x + dx, top + dy], [x + w + dx, top + dy], [x + w, top]]),
  };
}

/** Degradês de vidro com ids próprios de cada SVG (o retrato usado na poeira precisa deles dentro do próprio SVG). */
export function GlassDefs({ p }: { p: string }) {
  return (
    <>
      <linearGradient id={`${p}-front`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e6fbff" stopOpacity=".92" />
        <stop offset=".45" stopColor="#7dd3ef" stopOpacity=".6" />
        <stop offset="1" stopColor="#18a6dc" stopOpacity=".74" />
      </linearGradient>
      <linearGradient id={`${p}-side`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#43bde8" stopOpacity=".78" />
        <stop offset="1" stopColor="#0a6fa6" stopOpacity=".84" />
      </linearGradient>
      <linearGradient id={`${p}-lid`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
        <stop offset="1" stopColor="#bdf0ff" stopOpacity=".9" />
      </linearGradient>
      <linearGradient id={`${p}-shine`} x1="0" y1="0" x2="1" y2="1">
        <stop offset=".18" stopColor="#fff" stopOpacity="0" />
        <stop offset=".3" stopColor="#fff" stopOpacity=".55" />
        <stop offset=".38" stopColor="#fff" stopOpacity="0" />
        <stop offset=".62" stopColor="#fff" stopOpacity="0" />
        <stop offset=".68" stopColor="#fff" stopOpacity=".3" />
        <stop offset=".74" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${p}-tube`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7fd9f2" />
        <stop offset=".55" stopColor="#2cb8e6" />
        <stop offset="1" stopColor="#0d8fca" />
      </linearGradient>
      <radialGradient id={`${p}-light`} cx=".5" cy=".4" r=".75">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".55" stopColor="#c8f4ff" />
        <stop offset="1" stopColor="#5fd0f0" />
      </radialGradient>
      <radialGradient id={`${p}-floor`}>
        <stop offset="0" stopColor="#1aa9d6" stopOpacity=".32" />
        <stop offset="1" stopColor="#1aa9d6" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/** Base de vidro onde as peças pousam. */
export function GlassBase({ p, x0, x1, y = 470 }: { p: string; x0: number; x1: number; y?: number }) {
  const f = boxFaces(x0, y + 16, x1 - x0, 16, 2.6);
  return (
    <g className="gl-base">
      <ellipse cx={(x0 + x1) / 2} cy={y + 14} rx={(x1 - x0) / 2 + 20} ry="30" fill={`url(#${p}-floor)`} />
      <polygon points={f.side} fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1" />
      <polygon points={f.lid} fill={`url(#${p}-lid)`} fillOpacity=".7" stroke="#fff" strokeWidth="1.2" />
      <polygon points={f.front} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.2" />
    </g>
  );
}

export function renderBase(svg: SVGSVGElement, t: number) {
  const b = out3(clamp(t));
  const base = svg.querySelector<SVGGElement>('.gl-base');
  if (!base) return;
  base.style.opacity = String(b);
  base.style.transform = `translateY(${(18 * (1 - b)).toFixed(1)}px)`;
}

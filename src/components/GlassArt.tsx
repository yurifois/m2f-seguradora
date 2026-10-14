import '../styles/section-art.css';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { DESKTOP_MQ, gsap, reducedMotion } from '../lib/motion';
import { GlassBase, GlassDefs, boxFaces, clamp, out2, out3, pts, renderBase, DX, DY } from './glass';

/*
 * Desenhos de vidro turquesa que se montam no fundo das seções conforme a rolagem
 * (prédio em construção, casa com o carro chegando, estetoscópio com batimento, avião).
 * Cada desenho tem um render(svg, t) puro: t de 0 a 1, ida e volta da rolagem sempre batem.
 */

/* ---------------------------------------------------------------- prédio em construção */

const OB = { x: 128, w: 190, depth: 2.2, bottom: 458, fh: 46, floors: 5 };
const OB_DX = DX * OB.depth;
const OB_DY = DY * OB.depth;

function floorTop(i: number) {
  return OB.bottom - i * OB.fh - (OB.fh - 2);
}

// último andar ainda no esqueleto: pilares, laje e contraventamento
const FRAME = (() => {
  const yb = OB.bottom - OB.floors * OB.fh;
  const top = yb - (OB.fh - 2);
  const { x, w } = OB;
  const mid = x + w / 2;
  return [
    `M${x} ${yb} V${top} M${mid} ${yb} V${top} M${x + w} ${yb} V${top}`,
    `M${x + w + OB_DX} ${yb + OB_DY} V${top + OB_DY}`,
    `M${x} ${top} L${x + OB_DX} ${top + OB_DY} L${x + w + OB_DX} ${top + OB_DY} L${x + w} ${top} Z`,
    `M${x} ${yb} L${mid} ${top} M${mid} ${yb} L${x + w} ${top}`,
  ].join(' ');
})();

// guindaste: torre treliçada, lança e contralança
const MAST = { a: 404, b: 424, bottom: 446, top: 64 };
const JIB = { x0: 150, x1: 510, y0: 64, y1: 76 };
const zigzag = (x0: number, x1: number, y0: number, y1: number, step: number, vertical: boolean) => {
  const out: string[] = [];
  if (vertical) {
    let left = true;
    for (let y = y0; y >= y1; y -= step) {
      out.push(`${left ? x0 : x1} ${y}`);
      left = !left;
    }
  } else {
    let top = true;
    for (let x = x0; x <= x1; x += step) {
      out.push(`${x} ${top ? y0 : y1}`);
      top = !top;
    }
  }
  return `M${out.join(' L')}`;
};
const CRANE_CHORDS = `M${MAST.a} ${MAST.bottom} V${MAST.top} M${MAST.b} ${MAST.bottom} V${MAST.top} M${MAST.a} ${MAST.top} L414 34 L${MAST.b} ${MAST.top}`;
const CRANE_LATTICE = zigzag(MAST.a, MAST.b, MAST.bottom, MAST.top, 20, true);
const JIB_CHORDS = `M${JIB.x0} ${JIB.y0} H${JIB.x1} M${JIB.x0} ${JIB.y1} H${JIB.x1} M${JIB.x0} ${JIB.y0} V${JIB.y1} M${JIB.x1} ${JIB.y0} V${JIB.y1} M414 34 L170 ${JIB.y0} M414 34 L500 ${JIB.y0}`;
const JIB_LATTICE = `${zigzag(JIB.x0, MAST.a, JIB.y0, JIB.y1, 18, false)} ${zigzag(MAST.b, JIB.x1, JIB.y0, JIB.y1, 18, false)}`;
const HOOK_X = 232;
const BEAM = boxFaces(196, 152, 72, 10, 0.6);

/** Prédio no progresso t: base, torre do guindaste, lança, andares empilhando, cabo descendo com a viga. */
export function renderObra(svg: SVGSVGElement, t: number) {
  renderBase(svg, t / 0.14);
  const mast = out2(clamp((t - 0.06) / 0.22));
  svg.querySelectorAll<SVGPathElement>('.ob-mast').forEach((p) => (p.style.strokeDashoffset = String(1 - mast)));
  const jib = out2(clamp((t - 0.24) / 0.16));
  svg.querySelectorAll<SVGPathElement>('.ob-jib').forEach((p) => (p.style.strokeDashoffset = String(1 - jib)));
  svg.querySelectorAll<SVGElement>('.ob-cab').forEach((el) => (el.style.opacity = String(jib)));

  svg.querySelectorAll<SVGGElement>('.ob-floor').forEach((g, i) => {
    const f = out3(clamp((t - 0.22 - i * 0.1) / 0.16));
    g.style.opacity = String(clamp(f * 3));
    g.style.transform = `translateY(${(-60 * (1 - f)).toFixed(1)}px)`;
  });
  const frame = out2(clamp((t - 0.72) / 0.16));
  svg.querySelectorAll<SVGPathElement>('.ob-frame').forEach((p) => (p.style.strokeDashoffset = String(1 - frame)));

  const cable = out2(clamp((t - 0.4) / 0.2));
  const len = 52 * cable;
  svg.querySelector('.ob-cable')!.setAttribute('y2', (82 + len).toFixed(1));
  const hook = svg.querySelector<SVGGElement>('.ob-hook')!;
  hook.style.opacity = String(clamp(cable * 4));
  hook.style.transform = `translateY(${len.toFixed(1)}px)`;
  svg.querySelector<SVGGElement>('.ob-beam')!.style.opacity = String(out2(clamp((t - 0.52) / 0.12)));

  const lit = clamp((t - 0.82) / 0.18);
  svg.querySelectorAll<SVGElement>('.ob-win').forEach((w) => (w.style.opacity = String(0.45 + 0.55 * lit)));
}

function Obra() {
  const p = 'ob';
  return (
    <svg className="gart__svg" viewBox="0 0 640 560" aria-hidden="true">
      <defs>
        <GlassDefs p={p} />
      </defs>
      <GlassBase p={p} x0={40} x1={560} />

      {Array.from({ length: OB.floors }, (_, i) => {
        const yb = OB.bottom - i * OB.fh;
        const top = floorTop(i);
        const f = boxFaces(OB.x, yb, OB.w, OB.fh - 2, OB.depth);
        const sx = OB.x + OB.w;
        return (
          <g key={i} className="ob-floor">
            <polygon points={f.side} fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1" strokeLinejoin="round" />
            <polygon points={f.lid} fill={`url(#${p}-lid)`} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points={f.front} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            <polygon points={f.front} fill={`url(#${p}-shine)`} />
            {[0, 1, 2].map((k) => (
              <rect key={k} className="ob-win" x={OB.x + 18 + k * 60} y={top + 10} width="36" height="22" rx="2" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1" />
            ))}
            {[
              [0.15, 0.45],
              [0.6, 0.9],
            ].map(([u0, u1]) => (
              <polygon
                key={u0}
                className="ob-win"
                points={pts([
                  [sx + u0 * OB_DX, top + 10 + u0 * OB_DY],
                  [sx + u1 * OB_DX, top + 10 + u1 * OB_DY],
                  [sx + u1 * OB_DX, top + 32 + u1 * OB_DY],
                  [sx + u0 * OB_DX, top + 32 + u0 * OB_DY],
                ])}
                fill={`url(#${p}-light)`}
                fillOpacity=".8"
              />
            ))}
          </g>
        );
      })}

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="ob-frame" d={FRAME} pathLength={1} stroke="#0aa6dc" strokeOpacity=".25" strokeWidth="9" />
        <path className="ob-frame" d={FRAME} pathLength={1} stroke={`url(#${p}-tube)`} strokeWidth="4.5" />
        <path className="ob-frame" d={FRAME} pathLength={1} stroke="#fff" strokeOpacity=".85" strokeWidth="1.3" />

        <path className="ob-mast" d={CRANE_CHORDS} pathLength={1} stroke={`url(#${p}-tube)`} strokeWidth="4" />
        <path className="ob-mast" d={CRANE_LATTICE} pathLength={1} stroke="#2cb8e6" strokeWidth="2" />
        <path className="ob-mast" d={CRANE_CHORDS} pathLength={1} stroke="#fff" strokeOpacity=".8" strokeWidth="1.1" />
        <path className="ob-jib" d={JIB_CHORDS} pathLength={1} stroke={`url(#${p}-tube)`} strokeWidth="3.6" />
        <path className="ob-jib" d={JIB_LATTICE} pathLength={1} stroke="#2cb8e6" strokeWidth="1.8" />
      </g>
      <rect className="ob-cab" x="426" y="78" width="22" height="18" rx="3" fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.4" />
      <rect className="ob-cab" x="482" y="78" width="26" height="22" rx="2" fill={`url(#${p}-side)`} stroke="#fff" strokeWidth="1.4" />
      <rect className="ob-cab" x={HOOK_X - 9} y="76" width="18" height="7" rx="2" fill="#2cb8e6" stroke="#fff" strokeWidth="1" />

      <g className="ob-hang" style={{ transformOrigin: `${HOOK_X}px 82px` }}>
        <line className="ob-cable" x1={HOOK_X} y1="82" x2={HOOK_X} y2="82" stroke="#2cb8e6" strokeWidth="1.6" />
        <g className="ob-hook">
          <path d={`M${HOOK_X} 82 v6 a5 5 0 1 1 -6 5`} fill="none" stroke="#14a9de" strokeWidth="2.4" strokeLinecap="round" />
          <g className="ob-beam">
            <path d={`M${HOOK_X} 90 L200 ${152 - 10} M${HOOK_X} 90 L264 ${152 - 10}`} stroke="#7fd9f2" strokeWidth="1.2" />
            <polygon points={BEAM.side} fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1" />
            <polygon points={BEAM.lid} fill={`url(#${p}-lid)`} stroke="#fff" strokeWidth="1" />
            <polygon points={BEAM.front} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.2" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- casa + carro */

const HS = { x: 340, w: 226, h: 140, depth: 2.2, bottom: 458, roof: 84 };
const H_DX = DX * HS.depth;
const H_DY = DY * HS.depth;
const H_TOP = HS.bottom - HS.h;
const APEX: [number, number] = [HS.x + HS.w / 2, H_TOP - HS.roof];
const ROOF_L = pts([[HS.x, H_TOP], APEX, [APEX[0] + H_DX, APEX[1] + H_DY], [HS.x + H_DX, H_TOP + H_DY]]);
const ROOF_R = pts([APEX, [HS.x + HS.w, H_TOP], [HS.x + HS.w + H_DX, H_TOP + H_DY], [APEX[0] + H_DX, APEX[1] + H_DY]]);
const GABLE = pts([[HS.x, H_TOP], APEX, [HS.x + HS.w, H_TOP]]);
const SIDE_WIN = (() => {
  const sx = HS.x + HS.w;
  const [u0, u1] = [0.25, 0.72];
  return pts([
    [sx + u0 * H_DX, H_TOP + 26 + u0 * H_DY],
    [sx + u1 * H_DX, H_TOP + 26 + u1 * H_DY],
    [sx + u1 * H_DX, H_TOP + 62 + u1 * H_DY],
    [sx + u0 * H_DX, H_TOP + 62 + u0 * H_DY],
  ]);
})();

const CAR = { park: 34, from: -900, scale: 1.3, wheel: 18, wheels: [50, 164] };
const CAR_Y = HS.bottom + 6 - 76 * CAR.scale; // rodas sobre o tampo da base
const CAR_BODY =
  'M6 50 C6 42 12 38 22 36 L60 32 L84 12 C89 8 95 6 103 6 L150 6 C158 6 164 9 170 15 L190 32 C202 34 208 40 208 50 L208 58 C208 62 205 64 201 64 L10 64 C7 64 6 62 6 58 Z';
const CAR_WIN = 'M88 14 C92 11 96 10 102 10 L124 10 L124 30 L70 31 Z M130 10 L150 10 C156 10 160 12 165 17 L180 30 L130 30 Z';

/** Casa no progresso t (base, paredes subindo, telhado encaixando, portas e janelas acendendo) e o carro em tk. */
export function renderCasa(svg: SVGSVGElement, t: number, tk: number) {
  renderBase(svg, t / 0.14);
  const w = out3(clamp((t - 0.1) / 0.32));
  const hh = Math.max(1, HS.h * w);
  const walls = svg.querySelector<SVGGElement>('.cs-walls')!;
  walls.style.opacity = String(clamp(w * 5));
  const f = boxFaces(HS.x, HS.bottom, HS.w, hh, HS.depth);
  svg.querySelectorAll('.cs-front').forEach((el) => el.setAttribute('points', f.front));
  svg.querySelector('.cs-side')!.setAttribute('points', f.side);

  const r = out3(clamp((t - 0.42) / 0.22));
  const roof = svg.querySelector<SVGGElement>('.cs-roof')!;
  roof.style.opacity = String(clamp(r * 3));
  roof.style.transform = `translateY(${(-70 * (1 - r)).toFixed(1)}px)`;

  const d = out2(clamp((t - 0.62) / 0.2));
  const lit = clamp((t - 0.82) / 0.18);
  svg.querySelectorAll<SVGElement>('.cs-detail').forEach((el) => (el.style.opacity = String(d * (0.55 + 0.45 * lit))));

  const k = out3(clamp(tk));
  const x = CAR.from + (CAR.park - CAR.from) * k;
  const car = svg.querySelector<SVGGElement>('.cs-car')!;
  car.setAttribute('transform', `translate(${x.toFixed(1)} ${CAR_Y.toFixed(1)}) scale(${CAR.scale})`);
  car.style.opacity = String(clamp(tk * 6));
  const deg = (((x - CAR.park) / (2 * Math.PI * CAR.wheel * CAR.scale)) * 360) % 360;
  svg.querySelectorAll('.cs-spin').forEach((g, i) => g.setAttribute('transform', `rotate(${deg.toFixed(1)} ${CAR.wheels[i]} 58)`));
}

function Casa() {
  const p = 'cs';
  return (
    <svg className="gart__svg" viewBox="0 0 640 560" aria-hidden="true">
      <defs>
        <GlassDefs p={p} />
      </defs>
      <GlassBase p={p} x0={20} x1={580} />

      <g className="cs-walls">
        <polygon className="cs-side" fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1" strokeLinejoin="round" />
        <polygon className="cs-front" fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        <polygon className="cs-front" fill={`url(#${p}-shine)`} />
      </g>
      <g className="cs-roof">
        <polygon points={ROOF_L} fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={ROOF_R} fill={`url(#${p}-lid)`} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <polygon points={GABLE} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        <circle className="cs-detail" cx={APEX[0]} cy={H_TOP - 32} r="13" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
      </g>
      <g>
        <rect className="cs-detail" x={APEX[0] - 17} y={HS.bottom - 60} width="34" height="60" rx="4" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <rect className="cs-detail" x={HS.x + 18} y={H_TOP + 24} width="44" height="32" rx="3" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <rect className="cs-detail" x={HS.x + HS.w - 62} y={H_TOP + 24} width="44" height="32" rx="3" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <polygon className="cs-detail" points={SIDE_WIN} fill={`url(#${p}-light)`} fillOpacity=".85" />
      </g>

      <g className="cs-car">
        <ellipse cx="107" cy="76" rx="100" ry="7" fill="#0a6fa6" fillOpacity=".18" />
        <path d={CAR_BODY} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d={CAR_BODY} fill={`url(#${p}-shine)`} />
        <path d={CAR_WIN} fill={`url(#${p}-side)`} fillOpacity=".75" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14 44 H200" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="196" y="40" width="10" height="6" rx="2" fill="#fff" />
        {CAR.wheels.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="58" r={CAR.wheel} fill={`url(#${p}-side)`} stroke="#fff" strokeWidth="2" />
            <g className="cs-spin">
              <circle cx={cx} cy="58" r="8" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.2" />
              <path d={`M${cx} 44 V72 M${cx - 14} 58 H${cx + 14}`} stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
        ))}
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
    <svg className="gart__svg" viewBox="0 0 420 330" aria-hidden="true">
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

/** Avião cruzando a faixa do SVG de um canto ao outro, deixando um rastro que se apaga. */
export function renderPlane(svg: SVGSVGElement, t: number) {
  const W = svg.clientWidth || window.innerWidth;
  const H = svg.clientHeight || 200;
  const route = svg.querySelector<SVGPathElement>('.sky-route')!;
  let cache = skyCache.get(svg);
  const key = `${W}x${H}`;
  if (!cache || cache.key !== key) {
    const y0 = H * 0.78;
    const y1 = H * 0.22;
    const d = `M ${-140} ${y0} C ${W * 0.3} ${y0 - H * 0.3}, ${W * 0.66} ${y1 + H * 0.22}, ${W + 140} ${y1}`;
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
  const size = window.innerWidth < 700 ? 54 : 84;
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
    <svg className="gart__svg" aria-hidden="true">
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

/* ---------------------------------------------------------------- desenho de fundo de uma seção */

export type ArtKind = 'obra' | 'casa' | 'saude' | 'aviao';

const ART: Record<ArtKind, { Svg: () => React.JSX.Element; render: (svg: SVGSVGElement, t: number) => void }> = {
  obra: { Svg: Obra, render: renderObra },
  // a casa se ergue e, no fim, o carro chega até ela
  casa: { Svg: Casa, render: (svg, t) => renderCasa(svg, clamp(t / 0.7), clamp((t - 0.55) / 0.45)) },
  saude: { Svg: Health, render: renderHealth },
  aviao: { Svg: Sky, render: renderPlane },
};

/**
 * Desenho no fundo da seção que o contém: monta conforme a rolagem passa por ela e desmonta
 * na volta. start/end seguem a sintaxe do ScrollTrigger, com a seção como gatilho. No celular,
 * onde o desenho entra no fluxo entre os blocos (inFlowOnMobile), o gatilho é o próprio desenho.
 */
export function SectionArt({
  kind,
  start = 'top 70%',
  end = 'center 45%',
  inFlowOnMobile = false,
}: {
  kind: ArtKind;
  start?: string;
  end?: string;
  inFlowOnMobile?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { Svg, render } = ART[kind];

  useGSAP(
    () => {
      const el = ref.current!;
      const svg = el.querySelector<SVGSVGElement>('svg')!;
      // sem animação: desenho já pronto (o avião, que só passa, fica de fora)
      if (reducedMotion) {
        render(svg, kind === 'aviao' ? 0 : 1);
        return;
      }
      const state = { t: 0 };
      const mm = gsap.matchMedia();
      mm.add({ desktop: DESKTOP_MQ, mobile: `not all and ${DESKTOP_MQ}` }, (ctx) => {
        const own = inFlowOnMobile && !!ctx.conditions?.mobile;
        state.t = 0;
        render(svg, 0);
        gsap.to(state, {
          t: 1,
          ease: 'none',
          onUpdate: () => render(svg, state.t),
          scrollTrigger: own
            ? { trigger: el, start: 'top 92%', end: 'bottom 62%', scrub: 0.6 }
            : { trigger: el.closest('section'), start, end, scrub: 0.6 },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`gart gart--${kind}`} aria-hidden="true">
      <Svg />
    </div>
  );
}

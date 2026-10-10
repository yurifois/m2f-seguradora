import { GlassBase, GlassDefs, boxFaces, clamp, out2, out3, pts, renderBase, DX, DY } from './glass';

/*
 * Primeiro ato da cena do hero, no mesmo vidro turquesa do gráfico e do estetoscópio:
 * à esquerda um prédio em construção (andares empilhando, guindaste), à direita uma casa
 * sendo erguida e o carro chegando até ela. Tudo desenhado em SVG e amarrado à rolagem.
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

export function Obra() {
  const p = 'ob';
  return (
    <svg className="scene__obra" viewBox="0 0 640 560" aria-hidden="true">
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
  const walls = svg.querySelector<SVGGElement>('.hs-walls')!;
  walls.style.opacity = String(clamp(w * 5));
  const f = boxFaces(HS.x, HS.bottom, HS.w, hh, HS.depth);
  svg.querySelectorAll('.hs-front').forEach((el) => el.setAttribute('points', f.front));
  svg.querySelector('.hs-side')!.setAttribute('points', f.side);

  const r = out3(clamp((t - 0.42) / 0.22));
  const roof = svg.querySelector<SVGGElement>('.hs-roof')!;
  roof.style.opacity = String(clamp(r * 3));
  roof.style.transform = `translateY(${(-70 * (1 - r)).toFixed(1)}px)`;

  const d = out2(clamp((t - 0.62) / 0.2));
  const lit = clamp((t - 0.82) / 0.18);
  svg.querySelectorAll<SVGElement>('.hs-detail').forEach((el) => (el.style.opacity = String(d * (0.55 + 0.45 * lit))));

  const k = out3(clamp(tk));
  const x = CAR.from + (CAR.park - CAR.from) * k;
  const car = svg.querySelector<SVGGElement>('.hs-car')!;
  car.setAttribute('transform', `translate(${x.toFixed(1)} ${CAR_Y.toFixed(1)}) scale(${CAR.scale})`);
  car.style.opacity = String(clamp(tk * 6));
  const deg = (((x - CAR.park) / (2 * Math.PI * CAR.wheel * CAR.scale)) * 360) % 360;
  svg.querySelectorAll('.hs-spin').forEach((g, i) => g.setAttribute('transform', `rotate(${deg.toFixed(1)} ${CAR.wheels[i]} 58)`));
}

export function Casa() {
  const p = 'hs';
  return (
    <svg className="scene__casa" viewBox="0 0 640 560" aria-hidden="true">
      <defs>
        <GlassDefs p={p} />
      </defs>
      <GlassBase p={p} x0={20} x1={580} />

      <g className="hs-walls">
        <polygon className="hs-side" fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1" strokeLinejoin="round" />
        <polygon className="hs-front" fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        <polygon className="hs-front" fill={`url(#${p}-shine)`} />
      </g>
      <g className="hs-roof">
        <polygon points={ROOF_L} fill={`url(#${p}-side)`} stroke="#bff1ff" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={ROOF_R} fill={`url(#${p}-lid)`} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <polygon points={GABLE} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        <circle className="hs-detail" cx={APEX[0]} cy={H_TOP - 32} r="13" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
      </g>
      <g>
        <rect className="hs-detail" x={APEX[0] - 17} y={HS.bottom - 60} width="34" height="60" rx="4" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <rect className="hs-detail" x={HS.x + 18} y={H_TOP + 24} width="44" height="32" rx="3" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <rect className="hs-detail" x={HS.x + HS.w - 62} y={H_TOP + 24} width="44" height="32" rx="3" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.4" />
        <polygon className="hs-detail" points={SIDE_WIN} fill={`url(#${p}-light)`} fillOpacity=".85" />
      </g>

      <g className="hs-car">
        <ellipse cx="107" cy="76" rx="100" ry="7" fill="#0a6fa6" fillOpacity=".18" />
        <path d={CAR_BODY} fill={`url(#${p}-front)`} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d={CAR_BODY} fill={`url(#${p}-shine)`} />
        <path d={CAR_WIN} fill={`url(#${p}-side)`} fillOpacity=".75" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14 44 H200" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="196" y="40" width="10" height="6" rx="2" fill="#fff" />
        {CAR.wheels.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="58" r={CAR.wheel} fill={`url(#${p}-side)`} stroke="#fff" strokeWidth="2" />
            <g className="hs-spin">
              <circle cx={cx} cy="58" r="8" fill={`url(#${p}-light)`} stroke="#fff" strokeWidth="1.2" />
              <path d={`M${cx} 44 V72 M${cx - 14} 58 H${cx + 14}`} stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

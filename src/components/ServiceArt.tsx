import type { ProductId } from '../data/content';

// Ilustrações animadas de cada serviço (traço fino, cor do pilar via currentColor).
// O estado-base de cada elemento é o "visível": com movimento reduzido a arte fica parada e completa.

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;
const v = (vars: Record<string, string | number>) => vars as CSSVars;

const CAR_BODY =
  'M78 74V62q0-6 6-7l16-3 14-14q3-3 7-3h31q4 0 7 3l13 14h4q6 0 6 6v16';
const CAR_WINDOW = 'M118 52l6-11h26l8 11Z';

function Imovel() {
  const windows = [0, 1, 2].flatMap((c) => [0, 1, 2, 3].map((r) => ({ x: 160 + c * 20, y: 64 + r * 20 })));
  return (
    <svg className="art art--imovel" viewBox="0 0 260 170" aria-hidden="true">
      <line className="art-faint" x1="6" y1="160" x2="254" y2="160" />
      <path className="art-draw" style={v({ '--d': 0 })} pathLength="1" d="M150 160V50h72v110" />
      <path className="art-draw" style={v({ '--d': 1 })} pathLength="1" d="M170 50V34h32v16" />
      {windows.map((w, i) => (
        <rect key={i} className="art-win" style={v({ '--d': (i * 7) % 12 })} x={w.x} y={w.y} width="12" height="12" rx="2" />
      ))}
      <path className="art-draw" style={v({ '--d': 2 })} pathLength="1" d="M28 160V104l44-32 44 32v56" />
      <path className="art-draw" style={v({ '--d': 3 })} pathLength="1" d="M96 87V72h10v22" />
      <path className="art-draw" style={v({ '--d': 3 })} pathLength="1" d="M60 160v-28h22v28" />
      <rect className="art-win" style={v({ '--d': 5 })} x="90" y="114" width="14" height="14" rx="2" />
      <rect className="art-win" style={v({ '--d': 9 })} x="38" y="114" width="14" height="14" rx="2" />
    </svg>
  );
}

function Veiculo() {
  return (
    <svg className="art art--veiculo" viewBox="0 0 240 100" aria-hidden="true">
      <defs>
        <linearGradient id="art-beam" x1="0" x2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".45" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line className="art-faint" x1="0" y1="87" x2="240" y2="87" />
      <line className="art-road" x1="0" y1="95" x2="240" y2="95" />
      <g className="art-speed">
        <line style={v({ '--d': 0 })} x1="30" y1="52" x2="58" y2="52" />
        <line style={v({ '--d': 1 })} x1="18" y1="62" x2="52" y2="62" />
        <line style={v({ '--d': 2 })} x1="36" y1="72" x2="62" y2="72" />
      </g>
      <g className="art-car">
        <path className="art-beam" d="M184 60l52-10v22Z" fill="url(#art-beam)" />
        <path className="art-line" d={CAR_BODY} />
        <path className="art-line" d={CAR_WINDOW} />
        <path className="art-line" d="M138 41v11M110 74h40M170 74h12" />
        <g className="art-wheel">
          <circle cx="100" cy="76" r="10" />
          <path d="M100 66v20M90 76h20" />
        </g>
        <g className="art-wheel">
          <circle cx="160" cy="76" r="10" />
          <path d="M160 66v20M150 76h20" />
        </g>
      </g>
    </svg>
  );
}

function Investimento() {
  const bars = [22, 34, 46, 60, 76];
  return (
    <svg className="art art--invest" viewBox="0 0 240 100" aria-hidden="true">
      <path className="art-faint" d="M16 92H226M16 92V8" />
      {bars.map((h, i) => (
        <rect key={i} className="art-bar" style={v({ '--d': i })} x={34 + i * 38} y={92 - h} width="22" height={h} rx="3" />
      ))}
      <path className="art-trend" pathLength="1" d="M45 62L83 50L121 38L159 26L197 12" />
      <path className="art-line art-arrow" d="M187 10l12 2-5 11" />
      <circle className="art-dot" cx="197" cy="12" r="4" />
    </svg>
  );
}

function Saude() {
  return (
    <svg className="art art--saude" viewBox="0 0 240 60" aria-hidden="true">
      <path className="art-pulse-base" d="M0 34h70l10-16 14 34 14-46 12 40 8-12h112" />
      <path className="art-pulse-run" pathLength="1" d="M0 34h70l10-16 14 34 14-46 12 40 8-12h112" />
    </svg>
  );
}

function Viagem() {
  return (
    <svg className="art art--viagem" viewBox="0 0 240 110" aria-hidden="true">
      <circle className="art-faint art-dash" cx="120" cy="55" r="46" />
      <circle className="art-globe" cx="120" cy="55" r="32" />
      <path className="art-line art-thin" d="M90 44q30 6 60 0M88 55q32 9 64 0M90 66q30 6 60 0" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} className="art-meridian" style={v({ '--d': i })} cx="120" cy="55" rx="32" ry="32" />
      ))}
      <g className="art-orbit">
        <path className="art-trail" d="M94 17A46 46 0 0 1 120 9" />
        <path
          className="art-plane"
          d="M131 9c0-1.1-.9-2-2-2h-6l-6-7h-3l3 7h-6l-2-3h-2.5l1.5 5-1.5 5h2.5l2-3h6l-3 7h3l6-7h6c1.1 0 2-.9 2-2Z"
        />
      </g>
    </svg>
  );
}

function Vida() {
  return (
    <svg className="art art--vida" viewBox="0 0 240 110" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <circle key={i} className="art-ripple" style={v({ '--d': i })} cx="120" cy="56" r="30" />
      ))}
      <path className="art-shield" d="M120 20l27 10v23c0 19-12 31-27 36-15-5-27-17-27-36V30Z" />
      <path
        className="art-heart"
        d="M120 69s-14-8-14-17c0-4.5 3.5-7 7-7 3 0 5.5 2 7 4.5 1.5-2.5 4-4.5 7-4.5 3.5 0 7 2.5 7 7 0 9-14 17-14 17Z"
      />
    </svg>
  );
}

function Residencial() {
  // gotas: [x, distância da queda]; as do meio param no guarda-chuva
  const drops: [number, number][] = [
    [18, 104],
    [34, 104],
    [50, 104],
    [64, 104],
    [92, 40],
    [106, 34],
    [120, 32],
    [134, 34],
    [148, 40],
    [176, 104],
    [192, 104],
    [208, 104],
    [224, 104],
  ];
  return (
    <svg className="art art--resid" viewBox="0 0 240 110" aria-hidden="true">
      {drops.map(([x, fall], i) => (
        <line key={i} className="art-drop" style={v({ '--fall': `${fall}px`, '--d': (i * 5) % 9 })} x1={x} y1="-6" x2={x - 2} y2="2" />
      ))}
      <line className="art-faint" x1="56" y1="104" x2="184" y2="104" />
      <path className="art-line" d="M94 104V76l26-18 26 18v28M114 104V90h12v14" />
      <g className="art-umbrella">
        <path
          className="art-canopy"
          d="M80 46C86 22 154 22 160 46q-10-6-20 0-10-6-20 0-10-6-20 0-10-6-20 0Z"
        />
        <path className="art-line" d="M120 28v-6" />
      </g>
    </svg>
  );
}

function Auto() {
  return (
    <svg className="art art--auto" viewBox="0 0 240 100" aria-hidden="true">
      <defs>
        <linearGradient id="art-scan" x1="0" x2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset=".5" stopColor="currentColor" stopOpacity=".55" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line className="art-faint" x1="40" y1="87" x2="220" y2="87" />
      <g transform="translate(-30 0)">
        <path className="art-line" d={CAR_BODY} />
        <path className="art-line" d={CAR_WINDOW} />
        <path className="art-line" d="M138 41v11M110 74h40M170 74h12" />
        <circle className="art-line" cx="100" cy="76" r="10" />
        <circle className="art-line" cx="160" cy="76" r="10" />
        <rect className="art-scan" x="66" y="26" width="28" height="64" fill="url(#art-scan)" />
      </g>
      <g className="art-badge">
        <path className="art-shield" d="M198 14l16 6v13c0 11-7 18-16 21-9-3-16-10-16-21V20Z" />
        <path className="art-line art-check" pathLength="1" d="M191 34l5 5 10-11" />
      </g>
    </svg>
  );
}

const ART: Partial<Record<ProductId, () => React.JSX.Element>> = {
  'consorcio-imovel': Imovel,
  'consorcio-veiculo': Veiculo,
  'consorcio-investimento': Investimento,
  saude: Saude,
  viagem: Viagem,
  vida: Vida,
  residencial: Residencial,
  auto: Auto,
};

export function ServiceArt({ id }: { id: ProductId }) {
  const Art = ART[id];
  return Art ? <Art /> : null;
}

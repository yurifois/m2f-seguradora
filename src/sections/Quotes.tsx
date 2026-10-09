import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import {
  CONSORCIO,
  PRODUCT_LABEL,
  QUOTE_TABS,
  waLink,
  type ProductId,
  type QuoteTab,
} from '../data/content';
import { gsap, reducedMotion, scrollToSection, scrubIn } from '../lib/motion';
import { brl, compactBrl, sendToForm } from '../lib/lead';
import { SectionHeading } from '../components/SectionHeading';
import { Icon } from '../components/Icon';

const TAB_EVENT = 'm2f:quote-tab';

/** Abre uma aba do simulador a partir de qualquer ponto do site. */
export function selectQuoteTab(tab: QuoteTab) {
  window.dispatchEvent(new CustomEvent<QuoteTab>(TAB_EVENT, { detail: tab }));
  scrollToSection('cotacoes');
}

const TAB_ICON = {
  imovel: 'house',
  veiculo: 'car',
  saude: 'health',
  viagem: 'plane',
  vida: 'life',
} as const;

export function Quotes() {
  const root = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<QuoteTab>('imovel');
  const listRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const on = (e: Event) => setTab((e as CustomEvent<QuoteTab>).detail);
    window.addEventListener(TAB_EVENT, on);
    return () => window.removeEventListener(TAB_EVENT, on);
  }, []);

  // indicador deslizante + transição do painel
  useLayoutEffect(() => {
    const place = () => {
      const btn = listRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
      const ink = inkRef.current;
      if (!btn || !ink) return;
      ink.style.width = `${btn.offsetWidth}px`;
      ink.style.height = `${btn.offsetHeight}px`;
      ink.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    if (firstRender.current) firstRender.current = false;
    else if (!reducedMotion && panelRef.current) {
      gsap.fromTo(
        panelRef.current.children,
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out', stagger: 0.06, clearProps: 'filter' },
      );
    }
    return () => window.removeEventListener('resize', place);
  }, [tab]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.quotes .section-heading > *');
      gsap.fromTo(
        '.quotes__panel',
        { opacity: 0, y: 160, z: -420, rotateX: 34, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          z: 0,
          rotateX: 0,
          scale: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.quotes__stage', start: 'top 96%', end: 'top 42%', scrub: 0.6 },
        },
      );
    },
    { scope: root },
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = QUOTE_TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % QUOTE_TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + QUOTE_TABS.length) % QUOTE_TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = QUOTE_TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(QUOTE_TABS[next].id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${QUOTE_TABS[next].id}"]`)?.focus();
  };

  return (
    <section id="cotacoes" className="quotes" ref={root} data-nav-flush aria-labelledby="cotacoes-title">
      <div className="container">
        <SectionHeading
          id="cotacoes-title"
          align="split"
          kicker="Calculadora"
          title={
            <>
              Simule em segundos. <em>Decida</em> com calma.
            </>
          }
          lead="Consórcio com valores da tabela M2F. Para saúde e seguros, você conta o que precisa e a gente compara as opções para você — sem custo."
        />
        <div className="quotes__stage">
          <div className="quotes__panel">
            <div className="quotes__tabs" role="tablist" aria-label="Tipo de cotação" ref={listRef} onKeyDown={onKeyDown}>
              <span className="quotes__ink" ref={inkRef} aria-hidden="true" />
              {QUOTE_TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  data-tab={t.id}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                >
                  <Icon name={TAB_ICON[t.id]} />
                  <span className="quotes__tab-long">{t.label}</span>
                  <span className="quotes__tab-short">{t.short}</span>
                </button>
              ))}
            </div>
            <div
              className="quotes__body"
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              ref={panelRef}
            >
              {tab === 'imovel' ? <ConsorcioPanel kind="imovel" key="imovel" /> : null}
              {tab === 'veiculo' ? <ConsorcioPanel kind="veiculo" key="veiculo" /> : null}
              {tab === 'saude' ? <SaudePanel /> : null}
              {tab === 'viagem' ? <ViagemPanel /> : null}
              {tab === 'vida' ? <VidaPanel /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Valor final (sem a animação) anunciado ao leitor de tela depois que a pessoa para de mexer. */
function useSettled<T>(value: T, ms = 600) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return settled;
}

function AnimatedMoney({ value, digits = 2 }: { value: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(value);
  const [initial] = useState(() => brl(value, digits));
  useEffect(() => {
    const obj = { v: current.current };
    const tween = gsap.to(obj, {
      v: value,
      duration: reducedMotion ? 0 : 0.6,
      ease: 'power3.out',
      onUpdate: () => {
        current.current = obj.v;
        if (ref.current) ref.current.textContent = brl(obj.v, digits);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, digits]);
  return <span ref={ref}>{initial}</span>;
}

function Range({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="range">
      <div className="range__head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{format(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range__ends" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  multi?: boolean;
}) {
  return (
    <fieldset className="chips">
      <legend>{label}</legend>
      <div className="chips__row">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              className="chip"
              aria-pressed={on}
              onClick={() =>
                onChange(multi ? (on ? value.filter((v) => v !== o) : [...value, o]) : on ? [] : [o])
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Stepper({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <label htmlFor={id}>{label}</label>
      <div className="stepper__ctrl">
        <button type="button" aria-label={`Diminuir ${label.toLowerCase()}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        />
        <button type="button" aria-label={`Aumentar ${label.toLowerCase()}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}

function Actions({ product, summary, cta }: { product: ProductId; summary: string; cta: string }) {
  const text = `Olá! Vim pelo site da M2F e quero uma cotação de ${PRODUCT_LABEL[product].toLowerCase()}.\n${summary}`;
  return (
    <div className="quote-actions">
      <button type="button" className="btn btn--primary" onClick={() => sendToForm({ products: [product], details: summary })}>
        {cta}
      </button>
      <a className="btn btn--ghost" href={waLink(text)} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="btn__wa">
          <path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" />
          <path d="M9 8.6c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.5.9 1.3 1.7 2.3 2.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.7c.2.1.3.2.3.4 0 .8-.6 1.6-1.4 1.8-.7.2-1.6.1-3.2-.6a8.6 8.6 0 0 1-3.6-3.6c-.6-1.2-.6-2.2-.3-2.9Z" />
        </svg>
        Pelo WhatsApp
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ConsorcioPanel({ kind }: { kind: 'imovel' | 'veiculo' }) {
  const cfg = CONSORCIO[kind];
  const [credit, setCredit] = useState(cfg.initial);
  const [uses, setUses] = useState<string[]>([]);
  const half = credit * cfg.halfRate;
  const full = half * 2;
  const spoken = useSettled(`Crédito de ${brl(credit, 0)}: meia parcela estimada de ${brl(half)} por mês.`);
  const product: ProductId = kind === 'imovel' ? 'consorcio-imovel' : 'consorcio-veiculo';
  const summary = [
    `Crédito: ${brl(credit, 0)}`,
    `Prazo: ${cfg.months} meses`,
    `Meia parcela estimada: ${brl(half)}`,
    uses.length ? `Objetivo: ${uses.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="quote quote--consorcio">
      <div className="quote__inputs">
        <Range
          id={`credit-${kind}`}
          label="Quanto de crédito você precisa?"
          value={credit}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          onChange={setCredit}
          format={compactBrl}
        />
        <div className="presets" role="group" aria-label="Valores da tabela M2F">
          {cfg.presets.map((p) => (
            <button key={p} type="button" className="preset" aria-pressed={credit === p} onClick={() => setCredit(p)}>
              {compactBrl(p)}
            </button>
          ))}
        </div>
        <Chips
          label={kind === 'imovel' ? 'Para que é o crédito?' : 'Qual veículo?'}
          options={cfg.uses}
          value={uses}
          onChange={setUses}
          multi
        />
      </div>

      <div className="quote__result">
        <p className="sr-only" aria-live="polite">
          {spoken}
        </p>
        <p className="quote__label">Meia parcela até a contemplação</p>
        <p className="quote__big">
          <AnimatedMoney value={half} />
          <small>/mês</small>
        </p>
        <dl className="quote__facts">
          <div>
            <dt>Crédito</dt>
            <dd>{brl(credit, 0)}</dd>
          </div>
          <div>
            <dt>Prazo</dt>
            <dd>{cfg.months} meses</dd>
          </div>
          <div>
            <dt>Parcela integral</dt>
            <dd>
              <AnimatedMoney value={full} />
            </dd>
          </div>
          <div>
            <dt>Juros</dt>
            <dd>Zero</dd>
          </div>
        </dl>
        <Actions product={product} summary={summary} cta="Quero esta simulação" />
        <p className="quote__trust">Sem compromisso · Um sócio responde em horário comercial</p>
        <p className="quote__note">
          Estimativa pela tabela M2F. Na meia parcela, a diferença é diluída após a contemplação; taxas e
          reajustes seguem a administradora.
        </p>
      </div>
    </div>
  );
}

const SAUDE_TIPOS = ['Para mim ou família', 'Para minha empresa', 'Sou MEI'] as const;

function SaudePanel() {
  const [tipo, setTipo] = useState<string[]>([SAUDE_TIPOS[0]]);
  const [vidas, setVidas] = useState(2);
  const [idades, setIdades] = useState('');
  const [cidade, setCidade] = useState('Brasília/DF');
  const summary = [
    `Contratação: ${tipo[0] ?? 'a definir'}`,
    `Vidas: ${vidas}`,
    idades.trim() ? `Idades: ${idades.trim()}` : '',
    cidade.trim() ? `Cidade: ${cidade.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="quote">
      <div className="quote__inputs">
        <Chips label="Como vai contratar?" options={SAUDE_TIPOS} value={tipo} onChange={(v) => setTipo(v.length ? v : tipo)} />
        <div className="quote__grid2">
          <Stepper id="saude-vidas" label="Quantas pessoas?" value={vidas} min={1} max={99} onChange={setVidas} />
          <div className="field">
            <label htmlFor="saude-cidade">Cidade</label>
            <input id="saude-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} autoComplete="address-level2" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="saude-idades">Idades de quem entra no plano</label>
          <input
            id="saude-idades"
            placeholder="Ex.: 38, 35, 7"
            value={idades}
            onChange={(e) => setIdades(e.target.value)}
            inputMode="numeric"
            aria-describedby="saude-idades-hint"
          />
          <span className="field__hint" id="saude-idades-hint">
            O preço do plano muda por faixa etária — só a idade basta.
          </span>
        </div>
      </div>
      <div className="quote__result">
        <p className="quote__label">O que comparamos para você</p>
        <ul className="checklist">
          <li>Rede credenciada perto de você</li>
          <li>Carências, coparticipação e reembolso</li>
          <li>Histórico de reajuste da operadora</li>
          <li>Enfermaria ou apartamento</li>
        </ul>
        <Actions product="saude" summary={summary} cta="Cotar plano de saúde" />
        <p className="quote__note">Cotação sem custo e sem compromisso. Respondemos em horário comercial.</p>
      </div>
    </div>
  );
}

const DESTINOS = [
  'América do Sul',
  'América do Norte',
  'Europa',
  'Ásia',
  'África',
  'Oceania',
  'Viagem nacional',
] as const;
const FINALIDADES = ['Lazer', 'Trabalho', 'Estudo'] as const;

function ViagemPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [destino, setDestino] = useState<string>('Europa');
  const [ida, setIda] = useState('');
  const [volta, setVolta] = useState('');
  const [pessoas, setPessoas] = useState(2);
  const [fim, setFim] = useState<string[]>(['Lazer']);
  const dias =
    ida && volta ? Math.round((new Date(volta).getTime() - new Date(ida).getTime()) / 86_400_000) + 1 : 0;
  const invalid = ida !== '' && volta !== '' && dias <= 0;
  const spoken = useSettled(dias > 0 ? `Viagem de ${dias} dias.` : '');
  const fmt = (d: string) => (d ? new Date(`${d}T12:00`).toLocaleDateString('pt-BR') : '');
  const summary = [
    `Destino: ${destino}`,
    ida ? `Ida: ${fmt(ida)}` : '',
    volta ? `Volta: ${fmt(volta)}` : '',
    dias > 0 ? `${dias} dias` : '',
    `Viajantes: ${pessoas}`,
    fim.length ? `Finalidade: ${fim.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="quote">
      <div className="quote__inputs">
        <div className="field">
          <label htmlFor="viagem-destino">Para onde você vai?</label>
          <select id="viagem-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            {DESTINOS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="quote__grid2">
          <div className="field">
            <label htmlFor="viagem-ida">Ida</label>
            <input id="viagem-ida" type="date" min={today} value={ida} onChange={(e) => setIda(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="viagem-volta">Volta</label>
            <input
              id="viagem-volta"
              type="date"
              min={ida || today}
              value={volta}
              onChange={(e) => setVolta(e.target.value)}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? 'viagem-erro' : undefined}
            />
          </div>
        </div>
        {invalid ? (
          <p className="field__error" id="viagem-erro">
            A volta está antes da ida. Ajuste as datas para calcular os dias.
          </p>
        ) : null}
        <div className="quote__grid2">
          <Stepper id="viagem-pessoas" label="Viajantes" value={pessoas} min={1} max={20} onChange={setPessoas} />
          <Chips label="Finalidade" options={FINALIDADES} value={fim} onChange={setFim} multi />
        </div>
      </div>
      <div className="quote__result">
        <p className="sr-only" aria-live="polite">
          {spoken}
        </p>
        <p className="quote__label">Sua viagem</p>
        <p className="quote__big">
          {dias > 0 ? (
            <>
              {dias}
              <small>{dias === 1 ? 'dia' : 'dias'}</small>
            </>
          ) : (
            <span className="quote__placeholder">Escolha as datas para calcular os dias</span>
          )}
        </p>
        <ul className="checklist">
          <li>Despesas médicas e hospitalares</li>
          <li>Bagagem extraviada e cancelamento</li>
          <li>{destino === 'Europa' ? 'Cobertura mínima de € 30 mil exigida no Schengen' : 'Assistência 24h em português'}</li>
        </ul>
        <Actions product="viagem" summary={summary} cta="Cotar seguro viagem" />
      </div>
    </div>
  );
}

const PROTEGER = ['Cônjuge', 'Filhos', 'Pais', 'Sócios'] as const;

function VidaPanel() {
  const [idade, setIdade] = useState(35);
  const [capital, setCapital] = useState(300_000);
  const [quem, setQuem] = useState<string[]>(['Filhos']);
  const summary = [
    `Idade: ${idade} anos`,
    `Capital desejado: ${brl(capital, 0)}`,
    quem.length ? `Proteger: ${quem.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="quote">
      <div className="quote__inputs">
        <Range
          id="vida-capital"
          label="Quanto sua família deveria receber?"
          value={capital}
          min={100_000}
          max={2_000_000}
          step={50_000}
          onChange={setCapital}
          format={compactBrl}
        />
        <div className="quote__grid2">
          <Stepper id="vida-idade" label="Sua idade" value={idade} min={18} max={80} onChange={setIdade} />
          <Chips label="Quem você quer proteger?" options={PROTEGER} value={quem} onChange={setQuem} multi />
        </div>
      </div>
      <div className="quote__result">
        <p className="quote__label">Capital segurado</p>
        <p className="quote__big">
          <AnimatedMoney value={capital} digits={0} />
        </p>
        <ul className="checklist">
          <li>Morte natural e acidental</li>
          <li>Invalidez por acidente ou doença</li>
          <li>Doenças graves e assistência funeral (opcionais)</li>
        </ul>
        <Actions product="vida" summary={summary} cta="Cotar seguro de vida" />
      </div>
    </div>
  );
}

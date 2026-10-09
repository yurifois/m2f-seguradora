import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { CONTACT, PRODUCT_LABEL, waLink, type ProductId } from '../data/content';
import { getLenis, gsap, reducedMotion, scrubIn } from '../lib/motion';
import { onLeadDraft } from '../lib/lead';

/* ---------- fragmentos: triângulos de uma malha irregular que montam o painel ---------- */

type Shard = { x: number; y: number; w: number; h: number; pts: string; tone: number; d: number };

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function buildShards(cols: number, rows: number): Shard[] {
  const r = rng(7);
  const grid: [number, number][][] = [];
  for (let j = 0; j <= rows; j++) {
    grid[j] = [];
    for (let i = 0; i <= cols; i++) {
      const edgeX = i === 0 || i === cols;
      const edgeY = j === 0 || j === rows;
      const jx = edgeX ? 0 : (r() - 0.5) * 0.7;
      const jy = edgeY ? 0 : (r() - 0.5) * 0.7;
      grid[j][i] = [((i + jx) / cols) * 100, ((j + jy) / rows) * 100];
    }
  }
  const shards: Shard[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = grid[j][i];
      const b = grid[j][i + 1];
      const c = grid[j + 1][i + 1];
      const d = grid[j + 1][i];
      const tris = r() > 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const t of tris) {
        const xs = t.map((p) => p[0]);
        const ys = t.map((p) => p[1]);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const w = Math.max(...xs) - x;
        const h = Math.max(...ys) - y;
        const pts = t.map(([px, py]) => `${(((px - x) / w) * 100).toFixed(2)},${(((py - y) / h) * 100).toFixed(2)}`).join(' ');
        const cx = x + w / 2 - 50;
        const cy = y + h / 2 - 50;
        shards.push({ x, y, w, h, pts, tone: r(), d: Math.hypot(cx, cy) });
      }
    }
  }
  return shards;
}

/* ---------- formulário ---------- */

const PRODUCTS = Object.keys(PRODUCT_LABEL) as ProductId[];
const isConsorcio = (p: ProductId) => p.startsWith('consorcio');

type Values = {
  nome: string;
  whatsapp: string;
  email: string;
  cidade: string;
  produtos: ProductId[];
  credito: string;
  lance: string;
  saudeTipo: string;
  saudeVidas: string;
  viagem: string;
  resumo: string;
  contato: string;
  horario: string;
  mensagem: string;
  consentimento: boolean;
  site: string; // honeypot
};

const EMPTY: Values = {
  nome: '',
  whatsapp: '',
  email: '',
  cidade: '',
  produtos: [],
  credito: '',
  lance: '',
  saudeTipo: '',
  saudeVidas: '',
  viagem: '',
  resumo: '',
  contato: 'WhatsApp',
  horario: 'Qualquer horário',
  mensagem: '',
  consentimento: false,
  site: '',
};

type Errors = Partial<Record<'nome' | 'whatsapp' | 'email' | 'produtos' | 'consentimento', string>>;

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.nome.trim().length < 2) e.nome = 'Digite seu nome.';
  const digits = v.whatsapp.replace(/\D/g, '');
  if (digits.length < 10) e.whatsapp = 'Confira o número com DDD.';
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    e.email = 'Confira o @ e o domínio.';
  if (!v.produtos.length) e.produtos = 'Escolha pelo menos um assunto para direcionarmos o atendimento.';
  if (!v.consentimento) e.consentimento = 'Autorize o contato para podermos responder.';
  return e;
}

function buildMessage(v: Values) {
  const lines = [
    `Olá, M2F! Sou ${v.nome.trim()} e vim pelo site.`,
    `Assunto: ${v.produtos.map((p) => PRODUCT_LABEL[p]).join(', ')}`,
  ];
  if (v.produtos.some(isConsorcio)) {
    if (v.credito) lines.push(`Crédito desejado: ${v.credito}`);
    if (v.lance) lines.push(`Lance: ${v.lance}`);
  }
  if (v.produtos.includes('saude')) {
    if (v.saudeTipo) lines.push(`Plano de saúde: ${v.saudeTipo}`);
    if (v.saudeVidas) lines.push(`Vidas: ${v.saudeVidas}`);
  }
  if (v.produtos.includes('viagem') && v.viagem.trim()) lines.push(`Viagem: ${v.viagem.trim()}`);
  if (v.resumo.trim()) lines.push(`Simulação: ${v.resumo.trim()}`);
  if (v.cidade.trim()) lines.push(`Cidade: ${v.cidade.trim()}`);
  lines.push(`WhatsApp: ${v.whatsapp}`);
  if (v.email.trim()) lines.push(`E-mail: ${v.email.trim()}`);
  lines.push(`Prefiro contato por ${v.contato === 'Ligação' ? 'ligação' : v.contato} · ${v.horario.toLowerCase()}`);
  if (v.mensagem.trim()) lines.push('', v.mensagem.trim());
  return lines.join('\n');
}

function useOpenNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = get('weekday');
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const weekday = !['Sat', 'Sun'].includes(day);
  return weekday && mins >= 510 && mins < 1110;
}

const STEPS = ['Assunto', 'Detalhes', 'Seus dados'] as const;

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const shards = useMemo(() => buildShards(5, 7), []);
  const [v, setV] = useState<Values>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'whatsapp' | 'sent' | 'error'>('idle');
  const [lastMessage, setLastMessage] = useState('');
  const movedStep = useRef(false);
  const openNow = useOpenNow();

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    if (k in errors) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const goTo = (n: number) => {
    movedStep.current = true;
    setStep(n);
  };

  // recebe o que foi simulado na seção de cotações e já pula para os detalhes
  useEffect(
    () =>
      onLeadDraft((d) => {
        setStatus('idle');
        setV((prev) => ({
          ...prev,
          produtos: Array.from(new Set([...prev.produtos, ...d.products])),
          resumo: d.details || prev.resumo,
        }));
        setErrors((prev) => ({ ...prev, produtos: undefined }));
        setStep(1);
      }),
    [],
  );

  // troca de etapa: entra deslizando e o foco vai para o título da etapa
  useEffect(() => {
    if (!movedStep.current || !stepRef.current) return;
    const el = stepRef.current;
    if (!reducedMotion) {
      gsap.fromTo(
        el.children,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04 },
      );
    }
    el.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
  }, [step]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.contact__intro > *', { start: 'top 98%', end: 'top 50%', stagger: 0.08 });

      const pieces = gsap.utils.toArray<HTMLElement>('.shard');
      gsap.set('.contact__panel', { opacity: 0 });
      gsap.set('.contact__flash', { opacity: 0, xPercent: -120 });
      gsap.set('.contact__panel-inner > *', { opacity: 0, y: 24 });
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.contact__panel-wrap',
          start: 'top 100%',
          end: 'top 35%',
          scrub: 0.7,
        },
      });
      tl.fromTo(
        pieces,
        {
          x: () => gsap.utils.random(-0.55, 0.55) * vw,
          y: () => gsap.utils.random(0.15, 0.75) * vh,
          z: () => -gsap.utils.random(900, 2600),
          rotateX: () => gsap.utils.random(-200, 200),
          rotateY: () => gsap.utils.random(-200, 200),
          rotateZ: () => gsap.utils.random(-120, 120),
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          opacity: 1,
          duration: 0.62,
          ease: 'power3.out',
          stagger: { each: 0.0035, from: 'random' },
        },
        0,
      )
        .to('.contact__panel', { opacity: 1, duration: 0.1 }, 0.74)
        .to('.shards', { opacity: 0, duration: 0.1 }, 0.82)
        .to('.contact__flash', { keyframes: { opacity: [0, 1, 0] }, xPercent: 120, duration: 0.22 }, 0.76)
        .to('.contact__panel-inner > *', { opacity: 1, y: 0, duration: 0.14, ease: 'power3.out', stagger: 0.03 }, 0.8);
      tlRef.current = tl;
    },
    { scope: root },
  );

  // quem chega pelo teclado não espera a animação: rola até o ponto em que o painel está montado
  const onFocusIn = () => {
    const st = tlRef.current?.scrollTrigger;
    if (!st || st.progress >= 1) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(st.end + 2, { immediate: true });
    else window.scrollTo(0, st.end + 2);
  };

  const next = () => {
    if (step === 0 && !v.produtos.length) {
      setErrors({ produtos: 'Escolha pelo menos um assunto para direcionarmos o atendimento.' });
      return;
    }
    goTo(step + 1);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    if (v.site) return; // robô
    const errs = validate(v);
    setErrors(errs);
    if (errs.produtos) {
      goTo(0);
      return;
    }
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
    const message = buildMessage(v);
    setLastMessage(message);
    const endpoint = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined;
    if (endpoint) {
      setStatus('sending');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...v, site: undefined, mensagemFormatada: message, origem: 'site' }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus('sent');
      } catch {
        setStatus('error');
      }
      return;
    }
    window.open(waLink(message), '_blank', 'noopener');
    setStatus('whatsapp');
  };

  const first = v.nome.trim().split(' ')[0];
  const hasErrors = Object.values(errors).some(Boolean);
  const done = status === 'whatsapp' || status === 'sent';
  const hasDetails =
    v.produtos.some(isConsorcio) || v.produtos.includes('saude') || v.produtos.includes('viagem');

  return (
    <section id="contato" className="contact" ref={root} aria-labelledby="contato-title">
      <div className="container contact__grid">
        <div className="contact__intro">
          <p className="kicker">
            <span aria-hidden="true" />
            Contato
          </p>
          <h2 id="contato-title" className="display">
            Vamos montar o seu <em>plano</em>?
          </h2>
          <p className="lead">
            Conte o que você quer conquistar ou proteger. Um dos sócios responde pessoalmente, em horário
            comercial.
          </p>
          <p className={`status${openNow ? ' is-open' : ''}`}>
            <i aria-hidden="true" />
            {openNow ? 'Atendendo agora' : 'Fora do horário · respondemos a partir das 8h30 de dia útil'}
          </p>
          <ul className="contact__list">
            <li>
              <span>WhatsApp</span>
              <a href={waLink('Olá! Vim pelo site da M2F.')} target="_blank" rel="noopener noreferrer">
                {CONTACT.whatsappLabel}
              </a>
            </li>
            <li>
              <span>E-mail</span>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <span>Instagram</span>
              <a href={`https://www.instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer">
                @{CONTACT.instagram}
              </a>
            </li>
            <li>
              <span>Horário</span>
              <p>{CONTACT.hours}</p>
            </li>
          </ul>
        </div>

        <div className="contact__panel-wrap" onFocusCapture={onFocusIn}>
          <div className="shards" aria-hidden="true">
            {shards.map((s, i) => (
              <div
                key={i}
                className="shard"
                style={
                  {
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.w}%`,
                    height: `${s.h}%`,
                    '--tone': s.tone.toFixed(3),
                  } as React.CSSProperties
                }
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points={s.pts} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ))}
          </div>

          <div className="contact__panel">
            <span className="contact__flash" aria-hidden="true" />
            <div className="contact__panel-inner">
              {done ? (
                <div className="form-done" role="status">
                  <span className="form-done__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <h3>{status === 'sent' ? `Recebemos, ${first}!` : `Pronto, ${first}!`}</h3>
                  <p>
                    {status === 'sent'
                      ? 'Sua solicitação chegou para a equipe M2F. Vamos falar com você pelo canal que você escolheu.'
                      : 'Abrimos o WhatsApp com a sua solicitação já escrita. Só falta tocar em enviar.'}
                  </p>
                  <div className="form-done__actions">
                    {status === 'whatsapp' ? (
                      <a className="btn btn--primary" href={waLink(lastMessage)} target="_blank" rel="noopener noreferrer">
                        Abrir o WhatsApp de novo
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        setStatus('idle');
                        setStep(2);
                      }}
                    >
                      Editar respostas
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="steps">
                    <ol>
                      {STEPS.map((label, i) => (
                        <li
                          key={label}
                          className={i === step ? 'is-current' : i < step ? 'is-done' : undefined}
                          aria-current={i === step ? 'step' : undefined}
                        >
                          <span aria-hidden="true">{i < step ? '✓' : i + 1}</span>
                          {label}
                        </li>
                      ))}
                    </ol>
                    <div className="steps__bar" aria-hidden="true">
                      <i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} />
                    </div>
                  </div>

                  <form className="form" ref={formRef} onSubmit={onSubmit} noValidate>
                    <div className="form__step" ref={stepRef} key={step}>
                      {step === 0 ? (
                        <>
                          <div className="form__head">
                            <h3 tabIndex={-1}>O que você procura?</h3>
                            <p>Escolha um ou mais assuntos — leva menos de um minuto.</p>
                          </div>
                          <fieldset
                            className={`form__products${errors.produtos ? ' has-error' : ''}`}
                            aria-describedby={errors.produtos ? 'f-produtos-err' : undefined}
                          >
                            <legend className="sr-only">Assuntos *</legend>
                            <div className="chips__row">
                              {PRODUCTS.map((p, i) => {
                                const on = v.produtos.includes(p);
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    name={i === 0 ? 'produtos' : undefined}
                                    className="chip"
                                    aria-pressed={on}
                                    onClick={() =>
                                      set('produtos', on ? v.produtos.filter((x) => x !== p) : [...v.produtos, p])
                                    }
                                  >
                                    {PRODUCT_LABEL[p]}
                                  </button>
                                );
                              })}
                            </div>
                            {errors.produtos ? (
                              <p className="field__error" id="f-produtos-err" role="alert">
                                {errors.produtos}
                              </p>
                            ) : null}
                          </fieldset>
                        </>
                      ) : null}

                      {step === 1 ? (
                        <>
                          <div className="form__head">
                            <h3 tabIndex={-1}>Conte um pouco mais</h3>
                            <p>
                              {hasDetails
                                ? 'Só o essencial para chegarmos com a proposta certa.'
                                : 'Opcional — se preferir, avance e o sócio pergunta o resto.'}
                            </p>
                          </div>
                          {v.produtos.some(isConsorcio) ? (
                            <div className="form__grid">
                              <Field id="f-credito" label="Crédito desejado">
                                <select id="f-credito" value={v.credito} onChange={(e) => set('credito', e.target.value)}>
                                  <option value="">Selecione</option>
                                  <option>Até R$ 100 mil</option>
                                  <option>R$ 100 mil a R$ 250 mil</option>
                                  <option>R$ 250 mil a R$ 500 mil</option>
                                  <option>R$ 500 mil a R$ 1 milhão</option>
                                  <option>Acima de R$ 1 milhão</option>
                                </select>
                              </Field>
                              <Field id="f-lance" label="Tem valor para lance?">
                                <select id="f-lance" value={v.lance} onChange={(e) => set('lance', e.target.value)}>
                                  <option value="">Selecione</option>
                                  <option>Não, quero pagar só as parcelas</option>
                                  <option>Sim, até 20% do crédito</option>
                                  <option>Sim, mais de 20% do crédito</option>
                                  <option>Quero entender as estratégias de lance</option>
                                </select>
                              </Field>
                            </div>
                          ) : null}
                          {v.produtos.includes('saude') ? (
                            <div className="form__grid">
                              <Field id="f-saude-tipo" label="Plano de saúde para">
                                <select id="f-saude-tipo" value={v.saudeTipo} onChange={(e) => set('saudeTipo', e.target.value)}>
                                  <option value="">Selecione</option>
                                  <option>Mim ou minha família</option>
                                  <option>Minha empresa (CNPJ)</option>
                                  <option>Sou MEI</option>
                                </select>
                              </Field>
                              <Field id="f-saude-vidas" label="Quantas pessoas?">
                                <input
                                  id="f-saude-vidas"
                                  type="number"
                                  min={1}
                                  inputMode="numeric"
                                  value={v.saudeVidas}
                                  onChange={(e) => set('saudeVidas', e.target.value)}
                                />
                              </Field>
                            </div>
                          ) : null}
                          {v.produtos.includes('viagem') ? (
                            <Field id="f-viagem" label="Destino e datas da viagem">
                              <input
                                id="f-viagem"
                                placeholder="Ex.: Portugal, 10 a 24 de março, 2 adultos"
                                value={v.viagem}
                                onChange={(e) => set('viagem', e.target.value)}
                              />
                            </Field>
                          ) : null}
                          {v.resumo ? (
                            <Field id="f-resumo" label="Sua simulação">
                              <textarea id="f-resumo" rows={2} value={v.resumo} onChange={(e) => set('resumo', e.target.value)} />
                            </Field>
                          ) : null}
                          <Field id="f-msg" label="Quer contar mais alguma coisa?">
                            <textarea
                              id="f-msg"
                              rows={hasDetails ? 2 : 4}
                              maxLength={1200}
                              placeholder="Seu objetivo, prazo, dúvidas…"
                              value={v.mensagem}
                              onChange={(e) => set('mensagem', e.target.value)}
                            />
                          </Field>
                        </>
                      ) : null}

                      {step === 2 ? (
                        <>
                          <div className="form__head">
                            <h3 tabIndex={-1}>Como falamos com você?</h3>
                            <p className={hasErrors ? 'form__head-error' : undefined} role={hasErrors ? 'alert' : undefined}>
                              {hasErrors ? 'Faltam alguns dados — confira os campos destacados.' : 'Campos com * são obrigatórios.'}
                            </p>
                          </div>
                          <div className="form__grid">
                            <Field id="f-nome" label="Nome completo *" error={errors.nome}>
                              <input
                                id="f-nome"
                                name="nome"
                                required
                                autoComplete="name"
                                value={v.nome}
                                onChange={(e) => set('nome', e.target.value)}
                                aria-invalid={!!errors.nome || undefined}
                                aria-describedby={errors.nome ? 'f-nome-err' : undefined}
                              />
                            </Field>
                            <Field id="f-whatsapp" label="WhatsApp *" error={errors.whatsapp}>
                              <input
                                id="f-whatsapp"
                                name="whatsapp"
                                required
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel-national"
                                placeholder="(61) 99999-9999"
                                value={v.whatsapp}
                                onChange={(e) => set('whatsapp', maskPhone(e.target.value))}
                                aria-invalid={!!errors.whatsapp || undefined}
                                aria-describedby={errors.whatsapp ? 'f-whatsapp-err' : undefined}
                              />
                            </Field>
                            <Field id="f-email" label="E-mail" error={errors.email}>
                              <input
                                id="f-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={v.email}
                                onChange={(e) => set('email', e.target.value)}
                                aria-invalid={!!errors.email || undefined}
                                aria-describedby={errors.email ? 'f-email-err' : undefined}
                              />
                            </Field>
                            <Field id="f-cidade" label="Cidade/UF">
                              <input
                                id="f-cidade"
                                name="cidade"
                                autoComplete="address-level2"
                                placeholder="Brasília/DF"
                                value={v.cidade}
                                onChange={(e) => set('cidade', e.target.value)}
                              />
                            </Field>
                          </div>
                          <div className="form__grid">
                            <fieldset className="radios">
                              <legend>Prefere contato por</legend>
                              <div className="radios__row">
                                {['WhatsApp', 'Ligação', 'E-mail'].map((o) => (
                                  <label key={o} className="radio">
                                    <input
                                      type="radio"
                                      name="contato"
                                      value={o}
                                      checked={v.contato === o}
                                      onChange={() => set('contato', o)}
                                    />
                                    <span>{o}</span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                            <Field id="f-horario" label="Melhor horário">
                              <select id="f-horario" value={v.horario} onChange={(e) => set('horario', e.target.value)}>
                                <option>Qualquer horário</option>
                                <option>Manhã</option>
                                <option>Tarde</option>
                                <option>Fim do dia</option>
                              </select>
                            </Field>
                          </div>
                          <div className="hp" aria-hidden="true">
                            <label htmlFor="f-site">Não preencha</label>
                            <input
                              id="f-site"
                              tabIndex={-1}
                              autoComplete="off"
                              value={v.site}
                              onChange={(e) => set('site', e.target.value)}
                            />
                          </div>
                          <div className={`consent${errors.consentimento ? ' has-error' : ''}`}>
                            <label>
                              <input
                                type="checkbox"
                                name="consentimento"
                                required
                                checked={v.consentimento}
                                onChange={(e) => set('consentimento', e.target.checked)}
                                aria-invalid={!!errors.consentimento || undefined}
                                aria-describedby={errors.consentimento ? 'f-consent-err' : undefined}
                              />
                              <span>
                                Autorizo a M2F a entrar em contato sobre esta solicitação. Meus dados não serão
                                usados para outra finalidade. *
                              </span>
                            </label>
                            {errors.consentimento ? (
                              <span className="sr-only" id="f-consent-err">
                                {errors.consentimento}
                              </span>
                            ) : null}
                          </div>
                          {status === 'error' ? (
                            <p className="form__alert" role="alert">
                              Não conseguimos enviar agora.{' '}
                              <a href={waLink(lastMessage)} target="_blank" rel="noopener noreferrer">
                                Envie pelo WhatsApp
                              </a>{' '}
                              — seus dados já estão na mensagem.
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>

                    <div className="form__nav">
                      {step > 0 ? (
                        <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn__back">
                            <path d="M19 12H5M11 6l-6 6 6 6" />
                          </svg>
                          Voltar
                        </button>
                      ) : (
                        <span className="form__fine">Sem custo e sem compromisso.</span>
                      )}
                      <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
                        {step < 2 ? 'Continuar' : status === 'sending' ? 'Enviando…' : 'Enviar e falar com a M2F'}
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <div className="field__label">
        <label htmlFor={id}>{label}</label>
        {error ? (
          <span className="field__error" id={`${id}-err`}>
            {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

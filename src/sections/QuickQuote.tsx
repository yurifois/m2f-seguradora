import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { PRODUCT_LABEL, waLink, type ProductId } from '../data/content';
import { getLenis, gsap, reducedMotion, scrubIn } from '../lib/motion';
import { maskPhone, submitLead } from '../lib/lead';
import { Field } from '../components/Field';
import { SectionArt } from '../components/GlassArt';

const PRODUCTS = Object.keys(PRODUCT_LABEL) as ProductId[];

type Values = { nome: string; whatsapp: string; produto: ProductId | ''; site: string };
type Errors = Partial<Record<'nome' | 'whatsapp' | 'produto', string>>;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.nome.trim().length < 2) e.nome = 'Digite seu nome.';
  if (v.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Confira o número com DDD.';
  if (!v.produto) e.produto = 'Escolha o que você procura.';
  return e;
}

/** Cotação rápida logo depois do "Sobre": só nome, WhatsApp e o que a pessoa procura. */
export function QuickQuote() {
  const root = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cardTween = useRef<gsap.core.Tween | null>(null);
  const [v, setV] = useState<Values>({ nome: '', whatsapp: '', produto: '', site: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'whatsapp' | 'sent' | 'error'>('idle');
  const [lastMessage, setLastMessage] = useState('');

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    if (k in errors) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.quick .section-heading > *', { start: 'top 96%', end: 'top 55%', stagger: 0.08 });
      // o cartão do formulário sobe inclinado e se endireita; os campos entram em seguida
      cardTween.current = gsap.fromTo(
        '.quick__card',
        { opacity: 0, y: 90, rotateX: 16, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.quick__card', start: 'top 100%', end: 'top 50%', scrub: 0.6 },
        },
      );
      scrubIn('.quick__form > *', { trigger: '.quick__card', start: 'top 92%', end: 'top 42%', y: 24, stagger: 0.08 });
    },
    { scope: root },
  );

  // quem chega pelo teclado não espera a animação: rola até o formulário estar montado
  const onFocusIn = () => {
    const st = cardTween.current?.scrollTrigger;
    if (!st || st.progress >= 1) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(st.end + 2, { immediate: true });
    else window.scrollTo(0, st.end + 2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.site) return; // robô
    const errs = validate(v);
    setErrors(errs);
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
    const produto = PRODUCT_LABEL[v.produto as ProductId];
    const message = [
      `Olá, M2F! Sou ${v.nome.trim()} e vim pelo site.`,
      `Quero uma cotação de: ${produto}`,
      `WhatsApp: ${v.whatsapp}`,
    ].join('\n');
    setLastMessage(message);
    setStatus('sending');
    setStatus(await submitLead({ nome: v.nome.trim(), whatsapp: v.whatsapp, produto, origem: 'site · cotação rápida' }, message));
  };

  const first = v.nome.trim().split(' ')[0];
  const done = status === 'whatsapp' || status === 'sent';

  return (
    <section id="cotacao" className="quick" ref={root} data-nav-settle="0.85" aria-labelledby="cotacao-title">
      <div className="quick__pin">
        <div className="container quick__grid">
          <div className="quick__intro">
            <header className="section-heading section-heading--left">
              <p className="kicker">
                <span aria-hidden="true" />
                Cotação rápida
              </p>
              <h2 id="cotacao-title" className="display">
                Sua cotação, <em>sem compromisso</em>.
              </h2>
              <p className="lead">
                Deixe seu nome e WhatsApp. Um dos sócios responde com as opções certas para o seu objetivo, em
                horário comercial.
              </p>
            </header>
            <div className="quick__art">
              <SectionArt kind="casa" start="top 10%" end="bottom 135%" inFlowOnMobile />
            </div>
          </div>

          <div className="quick__stage" onFocusCapture={onFocusIn}>
            <div className="quick__card">
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
                      ? 'Sua cotação chegou para a equipe M2F. Vamos chamar você no WhatsApp.'
                      : 'Abrimos o WhatsApp com o seu pedido já escrito. Só falta tocar em enviar.'}
                  </p>
                  <div className="form-done__actions">
                    {status === 'whatsapp' ? (
                      <a className="btn btn--primary" href={waLink(lastMessage)} target="_blank" rel="noopener noreferrer">
                        Abrir o WhatsApp de novo
                      </a>
                    ) : null}
                    <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
                      Editar
                    </button>
                  </div>
                </div>
              ) : (
                <form className="quick__form" ref={formRef} onSubmit={onSubmit} noValidate>
                  <div className="form__head">
                    <h3>Solicite sua cotação</h3>
                    <p>Leva menos de um minuto.</p>
                  </div>
                  <Field id="q-nome" label="Seu nome *" error={errors.nome}>
                    <input
                      id="q-nome"
                      name="nome"
                      autoComplete="name"
                      value={v.nome}
                      onChange={(e) => set('nome', e.target.value)}
                      aria-invalid={!!errors.nome || undefined}
                      aria-describedby={errors.nome ? 'q-nome-err' : undefined}
                    />
                  </Field>
                  <Field id="q-whatsapp" label="WhatsApp *" error={errors.whatsapp}>
                    <input
                      id="q-whatsapp"
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="(61) 99999-9999"
                      value={v.whatsapp}
                      onChange={(e) => set('whatsapp', maskPhone(e.target.value))}
                      aria-invalid={!!errors.whatsapp || undefined}
                      aria-describedby={errors.whatsapp ? 'q-whatsapp-err' : undefined}
                    />
                  </Field>
                  <Field id="q-produto" label="O que você procura? *" error={errors.produto}>
                    <select
                      id="q-produto"
                      name="produto"
                      value={v.produto}
                      onChange={(e) => set('produto', e.target.value as ProductId)}
                      aria-invalid={!!errors.produto || undefined}
                      aria-describedby={errors.produto ? 'q-produto-err' : undefined}
                    >
                      <option value="">Selecione</option>
                      {PRODUCTS.map((p) => (
                        <option key={p} value={p}>
                          {PRODUCT_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="hp" aria-hidden="true">
                    <label htmlFor="q-site">Não preencha</label>
                    <input id="q-site" tabIndex={-1} autoComplete="off" value={v.site} onChange={(e) => set('site', e.target.value)} />
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
                  <button type="submit" className="btn btn--primary btn--block" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Enviando…' : 'Quero minha cotação'}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                  <p className="quick__fine">
                    Sem custo e sem compromisso. Ao enviar, você autoriza a M2F a falar com você sobre esta cotação.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

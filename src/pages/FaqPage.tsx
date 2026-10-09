import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { FAQ_GROUPS, type FaqBlock, type FaqItem } from '../data/faq';
import { waLink } from '../data/content';
import { ScrollTrigger, getLenis, gsap, reducedMotion, scrubIn } from '../lib/motion';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const blockText = (b: FaqBlock) => (typeof b === 'string' ? b : b.list.join('. '));
const itemText = (it: FaqItem) => norm(`${it.q} ${it.a.map(blockText).join(' ')}`);

type Filter = 'todas' | (typeof FAQ_GROUPS)[number]['id'];

/** Dados estruturados para o Google mostrar as perguntas direto nos resultados. */
function useFaqSchema() {
  useEffect(() => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_GROUPS.flatMap((g) =>
        g.items.map((it) => ({
          '@type': 'Question',
          name: it.q,
          acceptedAnswer: { '@type': 'Answer', text: it.a.map(blockText).join(' ') },
        })),
      ),
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
}

function scrollToEl(el: HTMLElement, offset = 110) {
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.1 });
  else window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
}

export function FaqPage() {
  const root = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');
  const [openId, setOpenId] = useState<string | null>(() => window.location.hash.slice(1) || null);

  useFaqSchema();

  // chegou por um link direto (/duvidas/#pergunta): abre e rola até ela
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) scrollToEl(el);
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  const groups = useMemo(() => {
    const q = norm(query.trim());
    return FAQ_GROUPS.filter((g) => filter === 'todas' || g.id === filter)
      .map((g) => ({ ...g, items: q ? g.items.filter((it) => itemText(it).includes(q)) : g.items }))
      .filter((g) => g.items.length);
  }, [query, filter]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const listKey = groups.map((g) => g.items.map((i) => i.id).join(',')).join('|');

  // entradas amarradas à rolagem (descendo aparecem, subindo saem); refeitas quando a lista muda
  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.utils.toArray<HTMLElement>('.faq-group__head, .faq-item, .faq-cta__card').forEach((el) =>
        scrubIn(el, { start: 'top 99%', end: 'top 84%', y: 32 }),
      );
    },
    { scope: root, dependencies: [listKey], revertOnUpdate: true },
  );

  // a página muda de altura quando uma resposta abre: recalcula as posições depois da transição
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 520);
    return () => window.clearTimeout(t);
  }, [openId, listKey]);

  const toggle = (id: string) => {
    setOpenId((cur) => {
      const next = cur === id ? null : id;
      history.replaceState(null, '', next ? `#${next}` : window.location.pathname);
      return next;
    });
  };

  return (
    <main className="faq" ref={root}>
      <section className="faq-hero container" aria-labelledby="faq-title">
        <p className="kicker">
          <span aria-hidden="true" />
          Perguntas e respostas
        </p>
        <h1 id="faq-title" className="display">
          Central de <em>dúvidas</em>.
        </h1>
        <p className="lead">
          Tudo sobre consórcio explicado sem letras miúdas. Não achou o que procurava? Um sócio responde você no
          WhatsApp.
        </p>

        <div className="faq-tools">
          <label className="faq-search">
            <span className="sr-only">Buscar uma dúvida</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
            <input
              type="search"
              placeholder="Busque: lance, parcela, cancelamento…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-controls="perguntas"
            />
          </label>
          <div className="faq-filters" role="group" aria-label="Filtrar por tema">
            {(
              [
                { id: 'todas', label: 'Todas' },
                ...FAQ_GROUPS.map((g) => ({ id: g.id, label: g.title })),
              ] as { id: Filter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="faq-count" aria-live="polite">
            {query.trim() ? `${total} ${total === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}` : ''}
          </p>
        </div>
      </section>

      <section className="faq-body container" id="perguntas" aria-label="Perguntas">
        {groups.map((g, gi) => (
          <div className="faq-group" key={g.id} id={g.id}>
            <header className="faq-group__head">
              <span className="faq-group__num">0{gi + 1}</span>
              <h2>{g.title}</h2>
              <p>{g.intro}</p>
            </header>
            <ol className="faq-list">
              {g.items.map((it) => {
                const isOpen = openId === it.id;
                return (
                  <li key={it.id} id={it.id} className={`faq-item${isOpen ? ' is-open' : ''}`}>
                    <h3>
                      <button
                        type="button"
                        id={`${it.id}-q`}
                        aria-expanded={isOpen}
                        aria-controls={`${it.id}-a`}
                        onClick={() => toggle(it.id)}
                      >
                        <span>{it.q}</span>
                        <i className="faq-item__icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      className="faq-item__panel"
                      id={`${it.id}-a`}
                      role="region"
                      aria-labelledby={`${it.id}-q`}
                      inert={!isOpen}
                    >
                      <div className="faq-item__inner">
                        {it.a.map((b, i) =>
                          typeof b === 'string' ? (
                            <p key={i}>{b}</p>
                          ) : (
                            <ul key={i}>
                              {b.list.map((li) => (
                                <li key={li}>{li}</li>
                              ))}
                            </ul>
                          ),
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}

        {groups.length ? null : (
          <div className="faq-empty" role="status">
            <h2>Não encontramos essa dúvida aqui.</h2>
            <p>Pergunte direto para um dos sócios — a resposta vem pelo WhatsApp, em horário comercial.</p>
            <a
              className="btn btn--primary"
              href={waLink(`Olá! Vim pela página de dúvidas da M2F e quero saber: ${query.trim()}`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Perguntar no WhatsApp
            </a>
          </div>
        )}
      </section>

      <section className="faq-cta container" aria-labelledby="faq-cta-title">
        <div className="faq-cta__card">
          <div>
            <h2 id="faq-cta-title">
              Ainda ficou alguma <em>dúvida</em>?
            </h2>
            <p>Um dos sócios explica o seu caso pessoalmente — sem custo e sem compromisso.</p>
          </div>
          <div className="faq-cta__actions">
            <a
              className="btn btn--primary"
              href={waLink('Olá! Vim pela página de dúvidas da M2F e quero conversar com um consultor.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
            <a className="btn btn--ghost" href="/#cotacoes">
              Simular meu consórcio
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

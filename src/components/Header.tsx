import { useEffect, useRef, useState } from 'react';
import { NAV } from '../data/content';
import { FAQ_PATH } from '../data/faq';
import { LogoMark } from './LogoMark';
import { ScrollTrigger, lockScroll, scrollToSection } from '../lib/motion';

export type Page = 'home' | 'faq';

const FAQ_ID = 'duvidas';

export function Header({ page = 'home' }: { page?: Page }) {
  const home = page === 'home';
  const [active, setActive] = useState<string>(home ? 'inicio' : FAQ_ID);
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // seção ativa (só na página inicial) + barra de progresso
  useEffect(() => {
    const triggers = home
      ? NAV.map(({ id }) =>
          ScrollTrigger.create({
            trigger: `#${id}`,
            start: 'top 45%',
            end: 'bottom 45%',
            onToggle: (self) => self.isActive && setActive(id),
          }),
        )
      : [];
    const progress = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
        setStuck(self.scroll() > 24);
      },
    });
    return () => {
      triggers.forEach((t) => t.kill());
      progress.kill();
    };
  }, [home]);

  // pílula deslizante atrás do link ativo
  useEffect(() => {
    const place = () => {
      const link = navRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
      const pill = pillRef.current;
      if (!link || !pill) return;
      pill.style.width = `${link.offsetWidth}px`;
      pill.style.transform = `translateX(${link.offsetLeft}px)`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [active]);

  // menu mobile: trava rolagem, Esc fecha, foco preso no painel
  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>('a, button')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // na inicial, as seções rolam suave; na página de dúvidas, os links voltam para a inicial
  const href = (id: string) => (home ? `#${id}` : `/#${id}`);
  const go = (id: string) => (e: React.MouseEvent) => {
    setOpen(false);
    lockScroll(false);
    if (!home) return;
    e.preventDefault();
    scrollToSection(id);
  };

  const links = [...NAV.map(({ id, label }) => ({ id, label, to: href(id), onClick: go(id) })),
    { id: FAQ_ID, label: 'Dúvidas', to: FAQ_PATH, onClick: () => setOpen(false) }];

  return (
    <header className={`header${stuck ? ' is-stuck' : ''}${open ? ' is-open' : ''}`}>
      <div className="header__bar">
        <a href={href('inicio')} className="header__brand" onClick={go('inicio')} aria-label="M2F Associados — início">
          <LogoMark className="header__logo" variant="gradient" />
          <span className="header__wordmark">Associados</span>
        </a>

        <nav className="header__nav" aria-label="Seções do site">
          <span className="header__pill" ref={pillRef} aria-hidden="true" />
          <ul ref={navRef}>
            {links.map(({ id, label, to, onClick }) => (
              <li key={id}>
                <a
                  href={to}
                  data-id={id}
                  className={active === id ? 'is-active' : undefined}
                  aria-current={active === id ? (id === FAQ_ID ? 'page' : 'location') : undefined}
                  onClick={onClick}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href={href('cotacoes')} className="btn btn--primary btn--sm header__cta" onClick={go('cotacoes')}>
          Simular agora
        </a>

        <button
          ref={toggleRef}
          className="header__toggle"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>
      <div className="header__progress" ref={barRef} aria-hidden="true" />

      <div className="header__panel" id="menu-mobile" ref={panelRef} inert={!open} aria-hidden={!open}>
        <nav aria-label="Menu">
          <ol>
            {links.map(({ id, label, to, onClick }, i) => (
              <li key={id} style={{ '--i': i } as React.CSSProperties}>
                <a href={to} onClick={onClick} className={active === id ? 'is-active' : undefined}>
                  <span className="header__panel-num">0{i + 1}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a href={href('cotacoes')} className="btn btn--primary header__panel-cta" onClick={go('cotacoes')}>
          Simular agora
        </a>
      </div>
    </header>
  );
}

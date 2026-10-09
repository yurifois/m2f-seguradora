import { CONTACT, NAV, waLink } from '../data/content';
import { LogoMark } from '../components/LogoMark';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { reducedMotion, scrollToSection, scrubIn } from '../lib/motion';

export function Footer() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion) return;
      scrubIn('.footer__top > *', { start: 'top 100%', end: 'top 70%', stagger: 0.08 });
    },
    { scope: root },
  );
  return (
    <footer className="footer" ref={root}>
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <LogoMark className="footer__logo" />
            <p>
              Consórcios, saúde e seguros com atendimento consultivo. Planejamento para proteger e conquistar.
            </p>
          </div>
          <nav className="footer__col" aria-label="Mapa do site">
            <h3>Navegue</h3>
            <ul>
              {NAV.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(id);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="footer__col">
            <h3>Fale com a gente</h3>
            <ul>
              <li>
                <a href={waLink('Olá! Vim pelo site da M2F.')} target="_blank" rel="noopener noreferrer">
                  WhatsApp {CONTACT.whatsappLabel}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <a href={`https://www.instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer">
                  @{CONTACT.instagram}
                </a>
              </li>
              <li className="footer__muted">{CONTACT.hours}</li>
            </ul>
          </div>
          <div className="footer__col">
            <h3>Escritórios</h3>
            <ul>
              {CONTACT.offices.map((o) => (
                <li key={o.city}>
                  <strong>{o.city}</strong>
                  <span className="footer__muted">{o.address}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} M2F Associados. Todos os direitos reservados.</p>
          <p className="footer__muted">
            Simulações ilustrativas. Consórcios operados por administradoras autorizadas e fiscalizadas pelo Banco
            Central do Brasil; valores, prazos e condições seguem o regulamento de cada grupo.
          </p>
        </div>
      </div>
    </footer>
  );
}

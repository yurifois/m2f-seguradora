import { useEffect, useState } from 'react';
import { waLink } from '../data/content';
import { ScrollTrigger } from '../lib/motion';

export function WhatsAppFab() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#sobre',
      start: 'top 70%',
      endTrigger: 'html',
      end: 'bottom bottom',
      onToggle: (self) => setShow(self.isActive),
    });
    return () => st.kill();
  }, []);
  return (
    <a
      className={`fab${show ? ' is-on' : ''}`}
      href={waLink('Olá! Vim pelo site da M2F e quero falar com um consultor.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a M2F no WhatsApp"
      tabIndex={show ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2Z" />
        <path d="M9 8.6c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.5.9 1.3 1.7 2.3 2.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.7c.2.1.3.2.3.4 0 .8-.6 1.6-1.4 1.8-.7.2-1.6.1-3.2-.6a8.6 8.6 0 0 1-3.6-3.6c-.6-1.2-.6-2.2-.3-2.9Z" />
      </svg>
    </a>
  );
}

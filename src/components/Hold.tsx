import { useEffect, useRef } from 'react';
import { ScrollTrigger } from '../lib/motion';

// Enquanto o ScrollTrigger mede posições, as seções presas voltam ao fluxo normal:
// medir uma seção grudada na tela daria posições erradas para as animações de dentro dela.
let listening = false;
function measureWithoutHolds() {
  if (listening) return;
  listening = true;
  const root = document.documentElement;
  ScrollTrigger.addEventListener('refreshInit', () => root.classList.add('is-measuring'));
  ScrollTrigger.addEventListener('refresh', () => root.classList.remove('is-measuring'));
}

/**
 * Trava no fim da seção: quando ela termina de passar, fica presa na tela por um trecho da
 * rolagem — enquadrada logo abaixo do menu se couber na tela, ou com o pé alinhado ao pé da
 * tela se for mais alta — e só então segue. (Só no computador; ver .hold em base.css.)
 */
export function Hold({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    measureWithoutHolds();
    const wrap = ref.current!;
    const section = wrap.firstElementChild as HTMLElement;
    let last = 0;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      const h = section.offsetHeight;
      if (h === last) return;
      last = h;
      wrap.style.setProperty('--h', `${h}px`);
      // a altura da trava mudou (fontes, fotos carregando): recalcula as cenas abaixo
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(section);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="hold" ref={ref}>
      {children}
    </div>
  );
}

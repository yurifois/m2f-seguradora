import { useEffect, useRef, useState } from 'react';
import { SmokeCanvas } from './SmokeCanvas';
import { reducedMotion, scene } from '../lib/motion';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Camadas fixas atrás do conteúdo, de trás para frente:
 * anéis da marca → aura → logo branca estática → logo 3D → fumaça → vinheta.
 */
export function BackgroundStage({ variant = 'hero' }: { variant?: 'hero' | 'static' }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'loading' | 'webgl' | 'fallback' | 'static'>(
    variant === 'static' ? 'static' : 'loading',
  );

  useEffect(() => {
    if (variant === 'static') return; // páginas internas: só a logo escultural parada, sem 3D
    if (reducedMotion || !hasWebGL()) {
      setMode('fallback');
      return;
    }
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./logo3dScene')
      .then(({ createLogoScene }) => {
        if (cancelled || !canvasRef.current || !anchorRef.current) return;
        dispose = createLogoScene(canvasRef.current, {
          anchor: anchorRef.current,
          onReady: () => setMode('webgl'),
        });
      })
      .catch(() => setMode('fallback'));
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [variant]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      scene.mouseX = e.clientX / window.innerWidth;
      scene.mouseY = e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
    <div className="stage" aria-hidden="true" data-logo-mode={mode}>
      <svg className="stage__rings" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#15566A" />
            <stop offset="1" stopColor="#09A9BF" />
          </linearGradient>
        </defs>
        <circle className="ring ring--1" cx="500" cy="80" r="330" pathLength="1" />
        <circle className="ring ring--2" cx="500" cy="720" r="330" pathLength="1" />
        <circle className="ring ring--3" cx="-90" cy="80" r="330" pathLength="1" />
        <circle className="ring ring--4" cx="1090" cy="80" r="330" pathLength="1" />
        <circle className="ring ring--5" cx="-90" cy="720" r="330" pathLength="1" />
        <circle className="ring ring--6" cx="1090" cy="720" r="330" pathLength="1" />
      </svg>
      <div className="stage__aura" />
      <img className="stage__static-logo" src="/img/logo-escultural.webp" alt="" decoding="async" />
      <div className="stage__anchor" ref={anchorRef} />
      <img className="stage__logo-fallback" src="/img/logo-3d-fallback.webp" alt="" />
      <canvas className="stage__logo3d" ref={canvasRef} />
      <SmokeCanvas />
      <div className="stage__vignette" />
    </div>
    <div className="stage__ribbons" aria-hidden="true" />
    </>
  );
}

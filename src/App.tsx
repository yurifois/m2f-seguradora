import { useEffect } from 'react';
import { BackgroundStage } from './components/BackgroundStage';
import { Header } from './components/Header';
import { WhatsAppFab } from './components/WhatsAppFab';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Partners } from './sections/Partners';
import { Services } from './sections/Services';
import { Quotes } from './sections/Quotes';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { ScrollTrigger, initSmoothScroll, reducedMotion } from './lib/motion';

export default function App() {
  useEffect(() => {
    document.documentElement.classList.toggle('rm', reducedMotion);
    initSmoothScroll();
    // fontes mudam métricas: recalcula as posições das cenas quando carregarem
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <>
      <a className="skip" href="#contato">
        Pular para o formulário de contato
      </a>
      <BackgroundStage />
      <Header />
      <main>
        <Hero />
        <About />
        <Partners />
        <Services />
        <Quotes />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

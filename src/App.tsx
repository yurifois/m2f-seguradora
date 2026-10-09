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
import { ScrollTrigger, initSmoothScroll, reducedMotion, scrollToSection } from './lib/motion';

export default function App() {
  useEffect(() => {
    document.documentElement.classList.toggle('rm', reducedMotion);
    initSmoothScroll();
    // fontes mudam métricas: recalcula as posições das cenas quando carregarem
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    // chegou com #seção (vindo da página de dúvidas): tira a âncora para o navegador não
    // saltar sozinho e posiciona a seção uma vez, com a página já carregada
    const target = window.location.hash.slice(1);
    if (target && document.getElementById(target)) {
      history.replaceState(null, '', window.location.pathname);
      const land = () =>
        window.setTimeout(() => {
          ScrollTrigger.refresh();
          scrollToSection(target, { immediate: true });
        }, 120);
      if (document.readyState === 'complete') land();
      else window.addEventListener('load', land, { once: true });
    }
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

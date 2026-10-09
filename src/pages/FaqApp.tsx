import { useEffect } from 'react';
import { BackgroundStage } from '../components/BackgroundStage';
import { Header } from '../components/Header';
import { WhatsAppFab } from '../components/WhatsAppFab';
import { Footer } from '../sections/Footer';
import { FaqPage } from './FaqPage';
import { ScrollTrigger, initSmoothScroll, reducedMotion, scene } from '../lib/motion';

export default function FaqApp() {
  useEffect(() => {
    document.documentElement.classList.toggle('rm', reducedMotion);
    scene.heroExit = 1; // sem hero: a logo 3D nunca aparece aqui
    scene.smokeDensity = 0.42; // névoa mais leve para leitura
    initSmoothScroll();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <a className="skip" href="#perguntas">
        Pular para as perguntas
      </a>
      <BackgroundStage variant="static" />
      <Header page="faq" />
      <FaqPage />
      <Footer page="faq" />
      <WhatsAppFab alwaysOn />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

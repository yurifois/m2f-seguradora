import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/manrope/wght.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/faq.css';
import './styles/light-visual.css';
import FaqApp from './pages/FaqApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FaqApp />
  </StrictMode>,
);

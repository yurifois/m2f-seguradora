import type { IconName } from '../data/content';

// Ícones de traço próprios (1.5px), desenhados para a M2F — nada de pacote genérico.
const PATHS: Record<IconName, string[]> = {
  house: ['M3 11.5 12 4l9 7.5', 'M5.5 9.5V20h13V9.5', 'M10 20v-5.5h4V20'],
  car: [
    'M3.5 16.5v-3.2l1.8-4.6A2 2 0 0 1 7.2 7.4h9.6a2 2 0 0 1 1.9 1.3l1.8 4.6v3.2',
    'M3.5 16.5h17',
    'M6.5 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM17.5 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
    'M5.5 12.5h13',
  ],
  growth: ['M4 19.5h16', 'M6 15.5l4.2-4.2 3 3L19 8.5', 'M14.5 8.5H19V13'],
  health: [
    'M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10Z',
    'M8.5 12.5h2l1-2 1.5 4 1-2h1.5',
  ],
  plane: [
    'M10.2 13.8 4 12l1.2-1.6 6 .3 4.3-4.6a1.8 1.8 0 0 1 2.6 2.5l-4.6 4.4.3 6-1.6 1.2-1.8-6.2Z',
    'M6.5 17.5l-2 2',
  ],
  life: [
    'M12 3.5 5 6.5v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9v-5l-7-3Z',
    'M12 15.5s-3-1.8-3-4.1a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 2.3-3 4.1-3 4.1Z',
  ],
  'home-shield': ['M3.5 11 12 4l8.5 7', 'M5.5 9.5V20h13V9.5', 'M12 18.5s-2.6-1.3-2.6-3.6v-2l2.6-1 2.6 1v2c0 2.3-2.6 3.6-2.6 3.6Z'],
  'car-shield': [
    'M3.5 17v-3l1.6-4.2A2 2 0 0 1 7 8.5h5.5',
    'M3.5 17h9',
    'M6.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    'M17.5 21s-3.5-1.6-3.5-4.6V13l3.5-1.4L21 13v3.4c0 3-3.5 4.6-3.5 4.6Z',
  ],
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

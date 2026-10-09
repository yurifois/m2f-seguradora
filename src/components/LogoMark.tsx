import { useId } from 'react';
import { LOGO_H, LOGO_PATH, LOGO_W } from '../lib/logo';

type Props = { className?: string; title?: string; variant?: 'gradient' | 'white' };

export function LogoMark({ className, title = 'M2F Associados', variant = 'gradient' }: Props) {
  const gid = useId();
  return (
    <svg
      className={className}
      viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'gradient' ? (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#15566A" />
            <stop offset=".5" stopColor="#00768C" />
            <stop offset="1" stopColor="#007F94" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d={LOGO_PATH}
        fillRule="evenodd"
        fill={variant === 'gradient' ? `url(#${gid})` : '#fff'}
      />
    </svg>
  );
}

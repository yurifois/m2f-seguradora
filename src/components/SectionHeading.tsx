import type { ReactNode } from 'react';

type Props = {
  id?: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'center' | 'left' | 'split';
};

export function SectionHeading({ id, kicker, title, lead, align = 'center' }: Props) {
  return (
    <header className={`section-heading section-heading--${align}`}>
      <p className="kicker">
        <span aria-hidden="true" />
        {kicker}
      </p>
      <h2 id={id} className="display">
        {title}
      </h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}

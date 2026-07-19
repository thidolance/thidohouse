'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** Classes do wrapper interno (padding/espaçamento do conteúdo). */
  contentClassName?: string;
}

/**
 * Card escuro moderno com efeito "aurora" roxo que segue o cursor no hover.
 * Filosofia shadcn/ui: estilizável via className, conteúdo via children.
 */
export function AuroraCard({
  children,
  className,
  contentClassName,
  ...props
}: AuroraCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Atualiza a posição do brilho via CSS vars (evita re-render do React).
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors duration-300 hover:border-purple-500/40',
        className,
      )}
      {...props}
    >
      {/* Aurora radial que segue o cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(360px circle at var(--mx, 50%) var(--my, 0%), rgba(168,85,247,0.30), rgba(236,72,153,0.12) 42%, transparent 72%)',
        }}
      />
      {/* Fio de luz roxo no topo, revelado no hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className={cn('relative z-10', contentClassName ?? 'p-6')}>
        {children}
      </div>
    </div>
  );
}

export default AuroraCard;

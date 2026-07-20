import { cn } from '@/lib/utils';
import { GlowingEffect } from './glowing-effect';

interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** Classes do wrapper interno (padding/espaçamento do conteúdo). */
  contentClassName?: string;
}

/**
 * Card com borda "aurora" em gradiente (índigo → roxo → rosa) nos dois temas,
 * mais um glow interativo que segue o cursor ao passar pelos cards.
 * No tema escuro o corpo é preto (funde com o fundo); no claro, card branco.
 */
export function AuroraCard({
  className,
  contentClassName,
  children,
  ...props
}: AuroraCardProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-2xl p-px transition-colors duration-300',
        // Borda aurora sempre presente (índigo → roxo → rosa).
        'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400',
        'dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500',
        'shadow-[0_0_22px_-14px_rgba(168,85,247,0.5)] dark:shadow-[0_0_24px_-10px_rgba(192,132,252,0.55)]',
        className,
      )}
      {...props}
    >
      {/* Glow interativo que acompanha o cursor pela borda do card */}
      <GlowingEffect
        disabled={false}
        glow
        spread={40}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <div
        className={cn(
          'relative z-10 rounded-[15px] bg-white shadow-sm',
          // Escuro: corpo preto opaco (funde com o fundo) — só a borda/glow aparece.
          'dark:bg-zinc-950 dark:shadow-none',
          contentClassName ?? 'p-6',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default AuroraCard;

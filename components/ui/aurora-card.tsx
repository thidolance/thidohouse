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
        // Borda aurora sempre presente (lime → verde → esmeralda).
        'bg-gradient-to-r from-lime-500 via-green-400 to-emerald-400',
        'dark:from-lime-500 dark:via-green-400 dark:to-emerald-400',
        'shadow-[0_0_22px_-14px_rgba(132,204,22,0.5)] dark:shadow-[0_0_24px_-10px_rgba(163,230,53,0.55)]',
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

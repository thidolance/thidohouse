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
        // Borda aurora sempre presente (azul royal → azul → ciano).
        'bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400',
        'dark:from-blue-500 dark:via-blue-400 dark:to-sky-400',
        'shadow-[0_0_22px_-14px_rgba(59,130,246,0.5)] dark:shadow-[0_0_24px_-10px_rgba(96,165,250,0.55)]',
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

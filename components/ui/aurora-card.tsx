import { cn } from '@/lib/utils';

interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** Classes do wrapper interno (padding/espaçamento do conteúdo). */
  contentClassName?: string;
}

/**
 * Card com borda "aurora" em gradiente (índigo → roxo → rosa).
 * No tema escuro o corpo é praticamente invisível (funde com o fundo preto),
 * então só a borda aurora e o conteúdo aparecem. No claro, card branco padrão.
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
        'relative w-full overflow-hidden rounded-2xl p-px transition-colors duration-300',
        // Borda aurora (índigo → roxo → rosa) nos dois temas.
        'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400',
        'dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500',
        'shadow-[0_0_22px_-14px_rgba(168,85,247,0.5)] dark:shadow-[0_0_24px_-10px_rgba(192,132,252,0.55)]',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'relative z-10 rounded-[15px] bg-white shadow-sm',
          // Escuro: corpo preto opaco (funde com o fundo) — só a borda aurora aparece.
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

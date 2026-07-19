import { cn } from '@/lib/utils';

interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** Classes do wrapper interno (padding/espaçamento do conteúdo). */
  contentClassName?: string;
}

/**
 * Card com borda "aurora" em gradiente (roxo/rosa) — sutil no tema escuro.
 * No tema claro cai para o card branco padrão do app.
 * Sem efeito de mouse: a borda é a moldura moderna e discreta.
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
        // Moldura: no claro é uma borda cinza discreta; no escuro, gradiente aurora sutil.
        'bg-slate-200/80 dark:bg-transparent',
        'dark:bg-gradient-to-br dark:from-indigo-500/25 dark:via-purple-500/25 dark:to-pink-500/25',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'relative z-10 rounded-[15px] bg-white shadow-sm',
          'dark:bg-zinc-900/80 dark:shadow-none dark:backdrop-blur-sm',
          contentClassName ?? 'p-6',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default AuroraCard;

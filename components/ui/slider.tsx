'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

// Slider estilizado no visual do app (indigo no claro, roxo no escuro).
// A cor do trilho preenchido e do thumb pode ser sobrescrita via `accent`
// (usado na distribuição para casar com a cor de cada categoria).
function Slider({
  className,
  accent,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { accent?: string }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none select-none items-center py-1', className)}
      style={accent ? ({ ['--slider-accent' as string]: accent } as React.CSSProperties) : undefined}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
        <SliderPrimitive.Range
          className="absolute h-full rounded-full bg-indigo-600 dark:bg-purple-500"
          style={accent ? { backgroundColor: 'var(--slider-accent)' } : undefined}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-full border-2 border-indigo-600 dark:border-purple-500 bg-white dark:bg-zinc-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        style={accent ? { borderColor: 'var(--slider-accent)' } : undefined}
        aria-label="Ajustar percentual"
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };

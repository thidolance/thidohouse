'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Alterna entre o tema escuro (novo padrão) e o claro (default original do app).
// A classe .dark no <html> é definida antes da hidratação por um script no layout.
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  // Sincroniza o estado inicial com a classe já aplicada pelo script anti-flash.
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

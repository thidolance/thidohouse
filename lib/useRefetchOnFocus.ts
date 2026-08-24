'use client';

import { useEffect, useRef } from 'react';

// Mobile suspende a aba ao trocar de app/bloquear a tela; sem isso os dados ficam
// parados na última leitura até o componente remontar (ex: trocar de aba e voltar).
// Mas re-ler tudo a CADA foco (alt-tab, desbloqueio) é o que deixava pesado, então
// só dispara se passou `minIntervalMs` desde a última busca — dados recém-carregados
// não são re-buscados à toa. O cache em memória/persistência cobre o resto.
export function useRefetchOnFocus(callback: () => void, minIntervalMs = 30_000) {
  const lastRun = useRef(Date.now());
  useEffect(() => {
    function run() {
      const now = Date.now();
      if (now - lastRun.current < minIntervalMs) return;
      lastRun.current = now;
      callback();
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') run();
    }
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [callback, minIntervalMs]);
}

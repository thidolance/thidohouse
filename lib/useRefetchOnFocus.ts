'use client';

import { useEffect } from 'react';

// Mobile suspende a aba ao trocar de app/bloquear a tela; sem isso os dados ficam
// parados na última leitura até o componente remontar (ex: trocar de aba e voltar).
export function useRefetchOnFocus(callback: () => void) {
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') callback();
    }
    window.addEventListener('focus', callback);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', callback);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [callback]);
}

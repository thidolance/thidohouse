import type { ReactNode } from 'react';

export function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Plus() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function Trash() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function Check() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function X() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function CreditCard() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

export function TrendingUp() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export function Receipt() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export function LayoutGrid() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export function Building() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

export function MessageCircle({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

export function Pencil() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export function Target({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M20 4L10 14" />
    </svg>
  );
}

// Ícones sólidos (preenchidos, cor única) das categorias/reservas da distribuição.
const CATEGORIA_PATHS: Record<string, string> = {
  // Documento com linhas (Contas)
  contas: 'M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z',
  // Sol (Férias)
  ferias: 'M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.592-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z',
  // Barras crescentes (Investimento)
  investimento: 'M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z',
  // Bandeira/meta (Planos Futuros)
  planosFuturos: 'M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z',
  // Capelo/formatura (Estudos)
  estudos: 'M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.949 49.949 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.009 50.009 0 0 0 7.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.129 56.129 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286a48.45 48.45 0 0 1 7.665 3.283 2.25 2.25 0 0 0 2.116 0Z M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z',
};

export function CategoriaIcon({ categoria, className = 'w-4 h-4', color }: { categoria: string; className?: string; color?: string }) {
  return (
    <svg className={className} style={color ? { color } : undefined} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d={CATEGORIA_PATHS[categoria] ?? CATEGORIA_PATHS.contas} />
    </svg>
  );
}

// Ícones sólidos monocromáticos para contas (água, luz, internet, saúde...).
// Cada item tem uma key (salva na conta), um label (tooltip do seletor) e o
// desenho. Renderizados em cor única via currentColor, no padrão das reservas.
export const CONTA_ICONS: { key: string; label: string; node: ReactNode }[] = [
  { key: 'agua', label: 'Água', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25c.28 0 .54.156.67.404 1.02 1.94 2.62 4.29 3.9 6.52.64 1.11 1.2 2.22 1.55 3.24.34 1 .53 1.98.53 2.84a6.65 6.65 0 0 1-13.3 0c0-.86.19-1.84.53-2.84.35-1.02.91-2.13 1.55-3.24 1.28-2.23 2.88-4.58 3.9-6.52.13-.248.39-.404.67-.404Z" />
  ) },
  { key: 'luz', label: 'Luz / Energia', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" />
  ) },
  { key: 'internet', label: 'Internet / Wi-Fi', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182a1.5 1.5 0 0 1 2.122 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0l-.53-.53a.75.75 0 0 1 0-1.06Z" />
  ) },
  { key: 'telefone', label: 'Telefone / Celular', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5v.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V1.5Z" />
  ) },
  { key: 'saude', label: 'Plano de saúde', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
  ) },
  { key: 'funeral', label: 'Plano funeral', node: (
    <>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="12" cy="7" rx="2.1" ry="4.3" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.4" />
    </>
  ) },
  { key: 'cartao', label: 'Cartão', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Zm18 4.5h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 5.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
  ) },
  { key: 'casa', label: 'Aluguel / Casa', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Zm.53 1.591l7.5 7.5v6.443a1.875 1.875 0 0 1-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.443l7.5-7.5Z" />
  ) },
  { key: 'carro', label: 'Carro / Veículo', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25 12.75a3 3 0 0 1 .38-1.462l1.71-3.08A3.75 3.75 0 0 1 7.62 6.25h8.76a3.75 3.75 0 0 1 3.28 1.958l1.71 3.08a3 3 0 0 1 .38 1.462V18a1.5 1.5 0 0 1-1.5 1.5h-.75A1.5 1.5 0 0 1 18 18v-.75H6V18a1.5 1.5 0 0 1-1.5 1.5h-.75A1.5 1.5 0 0 1 2.25 18v-5.25Zm3.53-3.9a1.5 1.5 0 0 1 1.31-.77h9.82a1.5 1.5 0 0 1 1.31.77l1.15 2.4H4.63l1.15-2.4ZM6 14.25a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm13.125 1.125a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
  ) },
  { key: 'tv', label: 'TV / Streaming', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M3.75 4.5A2.25 2.25 0 0 0 1.5 6.75v9a2.25 2.25 0 0 0 2.25 2.25h6v1.5H7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-2.25v-1.5h6a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 20.25 4.5H3.75Zm.75 3a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V7.5Z" />
  ) },
  { key: 'mercado', label: 'Mercado', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
  ) },
  { key: 'gas', label: 'Gás', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.547 3.75 3.75 0 0 1 3.255 3.719Z" />
  ) },
  { key: 'seguro', label: 'Seguro', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />
  ) },
  { key: 'educacao', label: 'Educação', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.949 49.949 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.009 50.009 0 0 0 7.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.129 56.129 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Zm1.36 12.668a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286a48.45 48.45 0 0 1 7.665 3.283 2.25 2.25 0 0 0 2.116 0Zm-8.598 3.989c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
  ) },
  { key: 'assinatura', label: 'Assinatura', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" />
  ) },
  { key: 'reforma', label: 'Reforma / Manutenção', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0 1 12 6.75ZM4.117 19.125a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" />
  ) },
  { key: 'pagamento', label: 'Pagamento / Dinheiro', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M10.464 2.48a.75.75 0 0 1 .67-.414h1.732a.75.75 0 0 1 .67.414l1.2 2.4a.75.75 0 0 1-.012.69C18.07 7.37 20.25 10.6 20.25 14.1c0 4.28-3.69 6.9-8.25 6.9s-8.25-2.62-8.25-6.9c0-3.5 2.18-6.73 5.526-8.53a.75.75 0 0 1-.012-.69l1.2-2.4ZM12 8.25a.75.75 0 0 1 .75.75v.316c.72.159 1.343.56 1.7 1.165a.75.75 0 1 1-1.292.764c-.137-.232-.42-.42-.908-.45v1.683c.72.159 1.343.56 1.7 1.165.357.605.357 1.37 0 1.975-.357.605-.98 1.006-1.7 1.165V18a.75.75 0 0 1-1.5 0v-.252c-.72-.159-1.343-.56-1.7-1.165a.75.75 0 1 1 1.292-.764c.137.232.42.42.908.45v-1.683c-.72-.159-1.343-.56-1.7-1.165-.357-.605-.357-1.37 0-1.975.357-.605.98-1.006 1.7-1.165V9a.75.75 0 0 1 .75-.75Z" />
  ) },
  { key: 'outro', label: 'Outro', node: (
    <path fillRule="evenodd" clipRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
  ) },
];

export function ContaIcon({ nome, className = 'w-4 h-4', color }: { nome?: string; className?: string; color?: string }) {
  const item = CONTA_ICONS.find((i) => i.key === nome);
  if (!item) return null;
  return (
    <svg className={className} style={color ? { color } : undefined} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {item.node}
    </svg>
  );
}

// Ícones das categorias de compra do cartão. Alguns reaproveitam o desenho dos
// ícones de conta (carro, mercado, casa...); os específicos de consumo (comida,
// academia, farmácia...) são desenhados aqui. Tudo monocromático via currentColor.
const contaIconNode = (key: string): ReactNode => CONTA_ICONS.find((i) => i.key === key)?.node ?? null;

export const COMPRA_CAT_ICONS: { key: string; label: string; node: ReactNode }[] = [
  { key: 'mercado', label: 'Mercado', node: contaIconNode('mercado') },
  { key: 'comida', label: 'Comida', node: (
    <>
      {/* Pão de cima */}
      <path d="M3 8.4C3 5.6 7 3.75 12 3.75S21 5.6 21 8.4a.6.6 0 0 1-.6.6H3.6a.6.6 0 0 1-.6-.6Z" />
      {/* Recheio */}
      <path d="M3.2 10.6h17.6a.6.6 0 0 1 .59.72c-.1.5-.46.93-1 .93H3.6c-.53 0-.9-.43-1-.93a.6.6 0 0 1 .6-.72Z" />
      {/* Pão de baixo */}
      <path d="M3.6 14.4h16.8a.6.6 0 0 1 .58.75C20.2 17.9 16.6 20.25 12 20.25S3.8 17.9 3.02 15.15a.6.6 0 0 1 .58-.75Z" />
    </>
  ) },
  { key: 'carro', label: 'Carro', node: contaIconNode('carro') },
  { key: 'abastecimento', label: 'Abastecimento', node: (
    // Bomba de combustível (cabine com visor + mangueira/bico)
    <>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.75 2.25A2.25 2.25 0 0 0 4.5 4.5v15.75h-.75a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-.75V4.5a2.25 2.25 0 0 0-2.25-2.25h-3Zm.75 3a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75h-3Z" />
      <path d="M14.25 8.25a.75.75 0 0 1 .75.75v.6a1.8 1.8 0 0 0 1.2 1.7c.33.12.55.43.55.78v5.37a1.25 1.25 0 1 0 2.5 0v-4.19l-.97-.97a.75.75 0 1 1 1.06-1.06l1.19 1.19c.14.14.22.33.22.53v4.5a2.75 2.75 0 1 1-5.5 0v-5.1a3.3 3.3 0 0 1-1.5-2.75V9a.75.75 0 0 1 .75-.75Z" />
    </>
  ) },
  { key: 'filhos', label: 'Filhos', node: (
    // Família / pessoas (estilo heroicons "users")
    <path fillRule="evenodd" clipRule="evenodd" d="M8.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
  ) },
  { key: 'crianca', label: 'Criança', node: (
    // Uma criança (cabeça + corpo)
    <>
      <circle cx="12" cy="4.6" r="2.5" />
      <path d="M8.2 10.4a3.8 3.8 0 0 1 7.6 0l-.72 7.5a1.08 1.08 0 0 1-2.15.05L12 13.5l-.93 4.45a1.08 1.08 0 0 1-2.15-.05l-.72-7.5Z" />
    </>
  ) },
  { key: 'besteiras', label: 'Besteiras', node: (
    // Rosquinha (donut)
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75S6.615 21.75 12 21.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 6.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  ) },
  { key: 'entretenimento', label: 'Entretenimento', node: (
    // Roda-gigante (parquinho)
    <>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6Z" />
      <rect x="11.5" y="4.2" width="1" height="13.6" rx="0.5" />
      <rect x="11.5" y="4.2" width="1" height="13.6" rx="0.5" transform="rotate(60 12 11)" />
      <rect x="11.5" y="4.2" width="1" height="13.6" rx="0.5" transform="rotate(120 12 11)" />
      <circle cx="12" cy="11" r="1.5" />
      <circle cx="12" cy="3.6" r="1" />
      <circle cx="12" cy="18.4" r="1" />
      <circle cx="18.4" cy="7.3" r="1" />
      <circle cx="5.6" cy="14.7" r="1" />
      <circle cx="5.6" cy="7.3" r="1" />
      <circle cx="18.4" cy="14.7" r="1" />
      <path d="M11.2 11 L7.9 21 H9.7 L12 13.9 L14.3 21 H16.1 L12.8 11 Z" />
      <rect x="7.2" y="20.6" width="9.6" height="1.6" rx="0.8" />
    </>
  ) },
  { key: 'farmacia', label: 'Farmácia', node: (
    // Cápsula/comprimido na diagonal
    <path fillRule="evenodd" clipRule="evenodd" d="M4.22 10.28a6 6 0 0 1 8.49-8.49l5.5 5.5a6 6 0 1 1-8.49 8.49l-5.5-5.5Zm2.12-1.06 5.5 5.5 3.18-3.18-5.5-5.5-3.18 3.18Z" />
  ) },
  { key: 'saude', label: 'Saúde', node: (
    // Coração com uma cruz/+ (plano de saúde)
    <path fillRule="evenodd" clipRule="evenodd" d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001ZM11.1 6.9h1.8v1.8h1.8v1.8h-1.8v1.8h-1.8v-1.8H9.3V8.7h1.8V6.9Z" />
  ) },
  { key: 'educacao', label: 'Educação', node: contaIconNode('educacao') },
  { key: 'academia', label: 'Academia', node: (
    // Halter
    <>
      <path d="M2.75 9.25a.9.9 0 0 1 .9.9v3.7a.9.9 0 0 1-1.8 0v-3.7a.9.9 0 0 1 .9-.9Z" />
      <path d="M5.75 7.4a1 1 0 0 1 1 1v7.2a1 1 0 1 1-2 0V8.4a1 1 0 0 1 1-1Z" />
      <path d="M6.9 10.8h10.2a.7.7 0 0 1 .7.7v1a.7.7 0 0 1-.7.7H6.9a.7.7 0 0 1-.7-.7v-1a.7.7 0 0 1 .7-.7Z" />
      <path d="M18.25 7.4a1 1 0 0 1 1 1v7.2a1 1 0 1 1-2 0V8.4a1 1 0 0 1 1-1Z" />
      <path d="M21.25 9.25a.9.9 0 0 1 .9.9v3.7a.9.9 0 0 1-1.8 0v-3.7a.9.9 0 0 1 .9-.9Z" />
    </>
  ) },
  { key: 'streaming', label: 'Streaming', node: contaIconNode('tv') },
  { key: 'planos', label: 'Planos', node: contaIconNode('seguro') },
  { key: 'assinaturas', label: 'Assinaturas', node: (
    // Controle de TV (corpo + visor no topo + grade de botões)
    <path fillRule="evenodd" clipRule="evenodd" d="M9 2.25A2.25 2.25 0 0 0 6.75 4.5v15A2.25 2.25 0 0 0 9 21.75h6a2.25 2.25 0 0 0 2.25-2.25v-15A2.25 2.25 0 0 0 15 2.25H9Zm.75 3a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75h-4.5ZM10.5 12a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Zm3.3.9a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8ZM10.5 15.3a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Zm3.3.9a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm-3.3 2.4a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z" />
  ) },
  { key: 'trabalho', label: 'Trabalho', node: (
    // Maleta
    <path fillRule="evenodd" clipRule="evenodd" d="M7.5 5.25A2.25 2.25 0 0 1 9.75 3h4.5a2.25 2.25 0 0 1 2.25 2.25v.75h2.25A2.25 2.25 0 0 1 21 8.25v3.026a41.6 41.6 0 0 1-9 .974 41.6 41.6 0 0 1-9-.974V8.25A2.25 2.25 0 0 1 5.25 6H7.5v-.75Zm6 0v.75h-3v-.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75ZM3 13.845a43.1 43.1 0 0 0 9 .905c3.082 0 6.098-.314 9-.905v3.905A2.25 2.25 0 0 1 18.75 20H5.25A2.25 2.25 0 0 1 3 17.75v-3.905Zm9 .905a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75H12Z" />
  ) },
  { key: 'casa', label: 'Casa', node: contaIconNode('casa') },
  { key: 'banco', label: 'Banco / Dívidas', node: (
    // Prédio de banco: frontão + colunas + base
    <>
      <path d="M11.7 2.28a.75.75 0 0 1 .6 0l8.7 3.9A.9.9 0 0 1 20.6 7.9H3.4A.9.9 0 0 1 3 6.18l8.7-3.9Z" />
      <rect x="4.6" y="9" width="2.1" height="6.9" rx="0.5" />
      <rect x="8.7" y="9" width="2.1" height="6.9" rx="0.5" />
      <rect x="13.2" y="9" width="2.1" height="6.9" rx="0.5" />
      <rect x="17.3" y="9" width="2.1" height="6.9" rx="0.5" />
      <rect x="3.2" y="17.3" width="17.6" height="2.3" rx="0.7" />
    </>
  ) },
  { key: 'dinheiro', label: 'Dinheiro', node: (
    // Cédula com moeda no centro
    <path fillRule="evenodd" clipRule="evenodd" d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-9Zm9 1.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  ) },
  { key: 'pet', label: 'Pet', node: (
    // Patinha
    <>
      <ellipse cx="6.3" cy="10.6" rx="1.7" ry="2.1" />
      <ellipse cx="10.2" cy="7.7" rx="1.7" ry="2.2" />
      <ellipse cx="13.8" cy="7.7" rx="1.7" ry="2.2" />
      <ellipse cx="17.7" cy="10.6" rx="1.7" ry="2.1" />
      <path d="M12 12.3c-2.4 0-4.4 1.9-4.4 4.1 0 1.6 1.2 2.7 2.7 2.7.8 0 1.2-.3 1.7-.3s.9.3 1.7.3c1.5 0 2.7-1.1 2.7-2.7 0-2.2-2-4.1-4.4-4.1Z" />
    </>
  ) },
  { key: 'agua', label: 'Água', node: contaIconNode('agua') },
  { key: 'luz', label: 'Luz / Energia', node: contaIconNode('luz') },
  { key: 'internet', label: 'Internet', node: contaIconNode('internet') },
  { key: 'telefone', label: 'Telefone', node: contaIconNode('telefone') },
  { key: 'gas', label: 'Gás', node: contaIconNode('gas') },
  { key: 'reforma', label: 'Reforma', node: contaIconNode('reforma') },
  { key: 'pagamento', label: 'Pagamento', node: contaIconNode('pagamento') },
  { key: 'outro', label: 'Outro', node: contaIconNode('outro') },
];

// Resolve o ícone de uma categoria de compra: usa o `icone` salvo quando válido;
// senão tenta casar pelo nome (sem acento, minúsculo) com sinônimos comuns.
export function compraCatIconKey(nome?: string, icone?: string): string {
  if (icone && COMPRA_CAT_ICONS.some((i) => i.key === icone)) return icone;
  const n = (nome ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const syn: Record<string, string> = {
    mercado: 'mercado', supermercado: 'mercado', feira: 'mercado',
    comida: 'comida', restaurante: 'comida', lanche: 'comida', ifood: 'comida', delivery: 'comida', alimentacao: 'comida',
    carro: 'carro', veiculo: 'carro', uber: 'carro', transporte: 'carro',
    abastecimento: 'abastecimento', combustivel: 'abastecimento', gasolina: 'abastecimento', posto: 'abastecimento',
    filhos: 'filhos', filho: 'filhos', familia: 'filhos',
    crianca: 'crianca', criancas: 'crianca', bebe: 'crianca', filha: 'crianca',
    banco: 'banco', divida: 'banco', dividas: 'banco', emprestimo: 'banco', financiamento: 'banco', fatura: 'banco',
    dinheiro: 'dinheiro', salario: 'dinheiro', renda: 'dinheiro', grana: 'dinheiro',
    pet: 'pet', animal: 'pet', cachorro: 'pet', gato: 'pet', veterinario: 'pet',
    agua: 'agua', luz: 'luz', energia: 'luz', internet: 'internet', wifi: 'internet',
    telefone: 'telefone', celular: 'telefone', gas: 'gas',
    reforma: 'reforma', manutencao: 'reforma', obra: 'reforma', conserto: 'reforma', reparo: 'reforma',
    pagamento: 'pagamento', pagamentos: 'pagamento', boleto: 'pagamento',
    besteiras: 'besteiras', besteira: 'besteiras', doce: 'besteiras', doces: 'besteiras',
    entretenimento: 'entretenimento', lazer: 'entretenimento', diversao: 'entretenimento', parque: 'entretenimento', cinema: 'entretenimento', passeio: 'entretenimento', role: 'entretenimento',
    farmacia: 'farmacia', remedio: 'farmacia', remedios: 'farmacia', drogaria: 'farmacia',
    saude: 'saude', medico: 'saude', dentista: 'saude', hospital: 'saude', consulta: 'saude',
    educacao: 'educacao', escola: 'educacao', curso: 'educacao', faculdade: 'educacao',
    academia: 'academia', gym: 'academia', treino: 'academia',
    streaming: 'streaming', streming: 'streaming', netflix: 'streaming', spotify: 'streaming', tv: 'streaming',
    assinaturas: 'assinaturas', assinatura: 'assinaturas',
    planos: 'planos', plano: 'planos', seguro: 'planos', seguros: 'planos', previdencia: 'planos',
    trabalho: 'trabalho', work: 'trabalho', escritorio: 'trabalho',
    casa: 'casa', lar: 'casa', moradia: 'casa', aluguel: 'casa',
  };
  return syn[n] ?? 'outro';
}

export function CompraCatIcon({ nome, icone, className = 'w-4 h-4', color }: { nome?: string; icone?: string; className?: string; color?: string }) {
  const item = COMPRA_CAT_ICONS.find((i) => i.key === compraCatIconKey(nome, icone)) ?? COMPRA_CAT_ICONS[COMPRA_CAT_ICONS.length - 1];
  return (
    <svg className={className} style={color ? { color } : undefined} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {item.node}
    </svg>
  );
}

// Família: pai, mãe, menino de 4 anos e bebê
export function FamilyIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {/* Pai */}
      <circle cx="3.75" cy="3" r="1.9" />
      <path d="M1.8,5.5 L5.7,5.5 L6.5,17 L1,17 Z" />
      {/* Mãe (vestido) */}
      <circle cx="10" cy="3.5" r="1.8" />
      <path d="M8.5,5.8 L11.5,5.8 L14,17 L6,17 Z" />
      {/* Menino, 4 anos */}
      <circle cx="16.5" cy="8" r="1.4" />
      <path d="M15.3,9.8 L17.7,9.8 L18.3,18 L14.7,18 Z" />
      {/* Bebê */}
      <circle cx="21" cy="11" r="1.2" />
      <ellipse cx="21" cy="15.5" rx="1.8" ry="2.3" />
    </svg>
  );
}

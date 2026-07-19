import AuroraCard from './aurora-card';

interface Props {
  children: React.ReactNode;
  className?: string;
}

// Mantém a API antiga (<Card className="...">) delegando o visual ao AuroraCard.
// className continua atuando no wrapper de conteúdo (padding/espaçamento).
export default function Card({ children, className = '' }: Props) {
  return <AuroraCard contentClassName={`p-5 ${className}`}>{children}</AuroraCard>;
}

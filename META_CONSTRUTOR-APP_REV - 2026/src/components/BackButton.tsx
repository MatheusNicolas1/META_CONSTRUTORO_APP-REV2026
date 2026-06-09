import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NavigationSafety } from '@/utils/navigationSafety';
import type { ButtonProps } from '@/components/ui/button';

interface BackButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  to: string;
  label?: string;
  children?: React.ReactNode;
}

/**
 * Botão "Voltar" que sempre navega para o topo da página anterior.
 * Usar este componente em vez de <Link> ou <Button onClick={navigate}> para
 * garantir que o usuário volte sempre ao topo da página.
 *
 * Exemplo:
 *   <BackButton to="/app/rdo" label="Voltar para RDOs" />
 *   <BackButton to="/app/rdo"><ArrowLeft /> Voltar</BackButton>
 */
export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label,
  variant = 'outline',
  size,
  className,
  children,
  ...rest
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    NavigationSafety.safeNavigate(navigate, to);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children ?? (
        <>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {label || 'Voltar'}
        </>
      )}
    </Button>
  );
};

export default BackButton;

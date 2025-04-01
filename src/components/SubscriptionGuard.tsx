import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  userId?: string;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rotas que exigem assinatura ativa
 */
export function SubscriptionGuard({
  children,
  userId,
  redirectTo = '/assinatura',
  fallback,
}: SubscriptionGuardProps) {
  const { status, isActive, error } = useSubscription(userId);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Se status de carregamento, não faz nada ainda
    if (status === 'loading') {
      return;
    }

    // Se ocorreu erro, mostra toast
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar sua assinatura. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }

    // Se não estiver ativo, redireciona
    if (!isActive) {
      toast({
        title: 'Acesso Restrito',
        description: 'Esta área requer uma assinatura ativa para acesso.',
        variant: 'destructive',
      });
      navigate(redirectTo);
    }
  }, [status, isActive, error, navigate, redirectTo, toast]);

  // Renderiza um loader enquanto verifica
  if (status === 'loading') {
    return fallback || (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-500">Verificando sua assinatura...</p>
        </div>
      </div>
    );
  }

  // Se tiver erro, mas também tiver fallback, mostra o fallback
  if (error && fallback) {
    return <>{fallback}</>;
  }

  // Só renderiza o conteúdo se a assinatura estiver ativa
  return isActive ? <>{children}</> : null;
} 
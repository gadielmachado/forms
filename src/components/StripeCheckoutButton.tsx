import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutButtonProps {
  priceId: string;
  userEmail: string;
  userId?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Componente de botão para iniciar o checkout do Stripe
 */
export function StripeCheckoutButton({
  priceId,
  userEmail,
  userId,
  buttonText = 'Assinar agora',
  buttonVariant = 'default',
  buttonSize = 'default',
  disabled = false,
  className = '',
  onSuccess,
  onError,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId || !userEmail) {
      toast({
        title: 'Erro',
        description: 'Informações de pagamento incompletas',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Chama o endpoint para criar a sessão de checkout
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userEmail,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar sessão de checkout');
      }

      // Redireciona para a página de checkout do Stripe
      if (data.url) {
        window.location.href = data.url;
        if (onSuccess) onSuccess();
      } else {
        throw new Error('URL de checkout não encontrada');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: 'Erro no pagamento',
        description: error instanceof Error ? error.message : 'Falha ao processar pagamento',
        variant: 'destructive',
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      disabled={disabled || isLoading}
      onClick={handleCheckout}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
} 
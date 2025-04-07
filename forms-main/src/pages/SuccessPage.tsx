import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Verifica se tem sessionId na URL
    if (!sessionId) {
      console.error('Session ID não encontrado na URL');
      setIsLoading(false);
      return;
    }

    // Log para facilitar debugging
    console.log(`Página de sucesso acessada com session_id: ${sessionId}`);

    const verifySession = async () => {
      try {
        // Opcionalmente, você pode verificar a sessão no backend
        // Registrar a sessão para o Zapier via webhook ou outro meio
        try {
          // Chamar nosso endpoint para o Zapier processar a sessão
          const response = await fetch(`/api/zapier/stripe-webhook?session_id=${sessionId}`);
          const data = await response.json();
          console.log('Verificação de sessão para Zapier:', data);
        } catch (webhookError) {
          console.error('Erro ao notificar sobre a sessão:', webhookError);
          // Não falhar o fluxo principal se o webhook falhar
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded mt-4 w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded mt-3 w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Algo deu errado</CardTitle>
            <CardDescription>
              Não conseguimos confirmar seu pagamento. Por favor, entre em contato com o suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionId && (
              <div className="text-sm text-gray-500 mt-2">
                ID da sessão: {sessionId}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-700">Pagamento confirmado!</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Seu pagamento foi processado com sucesso e sua assinatura está ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Um email de confirmação foi enviado para o endereço fornecido durante o pagamento.
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-green-800 text-sm">
              Você já tem acesso completo à plataforma e pode começar a usar todos os recursos
              imediatamente.
            </p>
          </div>
          {/* ID da sessão visível para debugging */}
          <div className="text-xs text-gray-400 mt-2">
            Referência: {sessionId}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/conta">Ver detalhes da assinatura</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
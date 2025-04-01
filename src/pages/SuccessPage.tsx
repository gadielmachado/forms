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
      setIsLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        // Opcionalmente, você pode verificar a sessão no backend
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
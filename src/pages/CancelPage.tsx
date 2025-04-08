import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CancelPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-amber-700">Pagamento cancelado</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Seu processo de pagamento foi interrompido ou cancelado.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Não se preocupe, nenhum valor foi cobrado do seu cartão.
          </p>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <p className="text-amber-800 text-sm">
              Você pode tentar novamente a qualquer momento. Se precisar de ajuda, entre em contato com nossa equipe.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/assinar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tentar novamente
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/ajuda">
              <HelpCircle className="mr-2 h-4 w-4" />
              Preciso de ajuda
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
import { CheckCircle, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SuccessMessage = () => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300">
        {/* Barra superior decorativa com gradiente */}
        <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
        
        <CardHeader className="text-center pt-8 pb-2">
          <div className="mx-auto mb-6 relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 opacity-75 blur-sm"></div>
            <div className="relative bg-gradient-to-r from-green-400 to-emerald-600 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Respostas Enviadas com Sucesso!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center px-8 pb-8">
          <p className="mb-8 text-gray-600 text-lg">
            Suas respostas foram registradas. Obrigado por participar!
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => window.close()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-6 h-auto text-base font-medium shadow-lg shadow-green-500/20 transition-all duration-200 flex items-center gap-2 rounded-full"
            >
              Concluir
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          
          {/* Elementos decorativos usando pseudo-elementos para não adicionar novos componentes */}
          <div className="absolute top-6 right-6 w-16 h-16 opacity-10 bg-green-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-6 w-8 h-8 opacity-10 bg-green-500 rounded-full blur-md"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessMessage; 
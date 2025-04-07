import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GenerationSuccessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "briefing" | "proposta" | "relatorio";
  onView?: () => void;
  onDownload?: () => void;
}

export default function GenerationSuccess({
  open,
  onOpenChange,
  type,
  onView,
  onDownload,
}: GenerationSuccessProps) {
  const getSuccessTitle = () => {
    switch (type) {
      case "briefing":
        return "Briefing Gerado com Sucesso!";
      case "proposta":
        return "Proposta Gerada com Sucesso!";
      case "relatorio":
        return "Relatório Gerado com Sucesso!";
      default:
        return "Documento Gerado com Sucesso!";
    }
  };

  const getSuccessMessage = () => {
    switch (type) {
      case "briefing":
        return "Seu briefing foi gerado e está pronto para visualização e download.";
      case "proposta":
        return "Sua proposta comercial foi gerada e está pronta para visualização e download.";
      case "relatorio":
        return "Seu relatório analítico foi gerado e está pronto para visualização e download.";
      default:
        return "Seu documento foi gerado e está pronto para visualização e download.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl overflow-hidden p-0">
        {/* Barra superior decorativa com gradiente */}
        <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-600"></div>
        
        <DialogHeader className="pt-6 pb-2 px-6">
          <DialogTitle className="flex flex-col items-center text-center justify-center">
            <div className="mb-4 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 opacity-75 blur-sm"></div>
              <div className="relative bg-gradient-to-r from-indigo-400 to-purple-600 rounded-full p-3">
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              {getSuccessTitle()}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center px-6 pb-6 relative">
          <p className="text-gray-600 py-4">
            {getSuccessMessage()}
          </p>
          
          <div className="flex justify-center space-x-3 mt-2">
            <Button 
              variant="outline" 
              className="border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
              onClick={onView}
            >
              Visualizar
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={onDownload}
            >
              Download
            </Button>
          </div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-4 w-12 h-12 opacity-5 bg-indigo-500 rounded-full blur-lg"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 opacity-5 bg-indigo-500 rounded-full blur-md"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuccessCard({ open, onOpenChange }: SuccessCardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl overflow-hidden p-0">
        {/* Barra superior decorativa com gradiente */}
        <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
        
        <DialogHeader className="pt-6 pb-2 px-6">
          <DialogTitle className="flex flex-col items-center text-center justify-center">
            <div className="mb-4 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 opacity-75 blur-sm"></div>
              <div className="relative bg-gradient-to-r from-green-400 to-emerald-600 rounded-full p-3">
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xl font-semibold text-gray-900">Respostas Enviadas com Sucesso!</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center px-6 pb-6 relative">
          <p className="text-gray-600 py-4">
            Suas respostas foram registradas. Obrigado por participar!
          </p>
          
          {/* Elementos decorativos usando pseudo-elementos */}
          <div className="absolute top-0 right-4 w-12 h-12 opacity-5 bg-green-500 rounded-full blur-lg"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 opacity-5 bg-green-500 rounded-full blur-md"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
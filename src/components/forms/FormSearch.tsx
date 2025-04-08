import { useState } from "react";
import { Search, FileText, Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormType {
  id: string;
  name: string;
  fields: any[];
  created_at: string;
  updated_at: string;
  user_id: string;
  image_url: string;
}

interface FormSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: string;
  forms: FormType[];
  onSelect: (form: FormType) => void;
  onGenerate: () => void;
  actionIcon: React.ReactNode;
  actionLabel: string;
  isGenerating?: boolean;
}

export default function FormSearch({
  open,
  onOpenChange,
  title,
  description,
  forms,
  onSelect,
  onGenerate,
  actionIcon,
  actionLabel,
  isGenerating = false,
}: FormSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

  // Função para lidar com a pesquisa
  const filteredForms = forms.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para escolher um formulário
  const handleSelectForm = (form: FormType) => {
    setSelectedForm(form);
    onSelect(form);
  };

  // Resetar estado ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchTerm("");
      setSelectedForm(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-indigo-700 flex items-center">
              {title}
            </DialogTitle>
            <button 
              onClick={() => handleOpenChange(false)}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Barra de pesquisa */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar formulário pelo nome..."
            className="pl-10 bg-white border-gray-200 rounded-xl"
          />
        </div>
        
        {/* Lista de formulários com scroll */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredForms.length > 0 ? (
              filteredForms.map((form) => (
                <div 
                  key={form.id}
                  onClick={() => handleSelectForm(form)}
                  className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedForm?.id === form.id 
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{form.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                      {form.fields?.length || 0} campos
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Criado em: {new Date(form.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {selectedForm?.id === form.id && (
                    <div className="ml-3 bg-indigo-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-10">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Nenhum formulário encontrado</h3>
                <p className="text-gray-500 text-center max-w-md mt-1">
                  Tente outro termo de busca ou crie um novo formulário.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!selectedForm || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                {actionIcon}
                {actionLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
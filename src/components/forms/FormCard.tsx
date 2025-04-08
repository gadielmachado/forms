import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, FileText, Download, BarChart, Edit, Trash, MoreVertical, Pencil } from "lucide-react";

interface FormCardProps {
  form: {
    id: string;
    name: string;
    fields: any[];
    created_at: string;
    image_url?: string;
  };
  onEdit: (form: any) => void;
  onView: (form: any) => void;
  onDelete: (form: any) => void;
  onViewResponses: (form: any) => void;
  onDownloadSheet: (form: any) => void;
}

export default function FormCard({
  form,
  onEdit,
  onView,
  onDelete,
  onViewResponses,
  onDownloadSheet,
}: FormCardProps) {
  const formattedDate = new Date(form.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-blue-200 rounded-xl">
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(form)} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" /> Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(form)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewResponses(form)} className="cursor-pointer">
              <BarChart className="mr-2 h-4 w-4" /> Ver respostas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownloadSheet(form)} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" /> Baixar planilha
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(form)} 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-gray-900 truncate mb-1">
              {form.name}
            </h3>
            
            <div className="space-y-1.5">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                {form.fields?.length || 0} campos
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
                Criado em: {formattedDate}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(form)}
            className="flex-1 text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
          >
            <Eye className="h-4 w-4 mr-1" />
            Visualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(form)}
            className="flex-1 text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
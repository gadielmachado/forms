import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Copy, Trash2, Type, Phone, Calendar, Link as LinkIcon, Plus, Pencil, CheckSquare, MoreVertical, ArrowRight, Clock } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import TimeScrollSelector from "@/components/ui/time-scroll-selector";

// Interface para as opções de checkbox
interface CheckboxOption {
  id: string;
  label: string;
  isEditing?: boolean;
}

interface FormFieldProps {
  id: string;
  type: string;
  label: string;
  checkboxOptions?: CheckboxOption[];
  onLabelChange: (value: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  // Props para gerenciar opções de checkbox
  onAddCheckboxOption?: () => void;
  onEditCheckboxOption?: (optionId: string, isEditing: boolean) => void;
  onUpdateCheckboxOptionLabel?: (optionId: string, label: string) => void;
  onRemoveCheckboxOption?: (optionId: string) => void;
  // Adicionar prop para mover campo para outro step
  onMoveToStep?: (fieldId: string, stepIndex: number) => void;
  // Propriedade para informar quantos steps existem
  totalSteps?: number;
  // Propriedade para informar o step atual
  currentStep?: number;
}

const FormField = ({
  id,
  type,
  label,
  checkboxOptions = [],
  onLabelChange,
  onDelete,
  onDuplicate,
  onAddCheckboxOption,
  onEditCheckboxOption,
  onUpdateCheckboxOptionLabel,
  onRemoveCheckboxOption,
  onMoveToStep,
  totalSteps = 1,
  currentStep = 1,
}: FormFieldProps) => {
  // Estado local para edição de opções quando as props não estão disponíveis
  const [localOptions, setLocalOptions] = useState<CheckboxOption[]>([
    { id: "1", label: "Opção 1", isEditing: false }
  ]);
  
  // Use as opções passadas via props ou o estado local
  const options = checkboxOptions.length > 0 ? checkboxOptions : localOptions;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Funções de gerenciamento de checkbox
  const handleAddOption = () => {
    if (onAddCheckboxOption) {
      onAddCheckboxOption();
    } else {
      setLocalOptions([
        ...options,
        { id: Math.random().toString(), label: `Opção ${options.length + 1}`, isEditing: false }
      ]);
    }
  };

  const handleEditOption = (optionId: string, isEditing: boolean) => {
    console.log("Editando opção:", optionId, isEditing);
    
    if (onEditCheckboxOption) {
      onEditCheckboxOption(optionId, isEditing);
    } else {
      setLocalOptions(
        options.map(option => 
          option.id === optionId ? { ...option, isEditing } : option
        )
      );
    }
  };

  const handleUpdateOptionLabel = (optionId: string, label: string) => {
    console.log("Atualizando label da opção:", optionId, label);
    
    if (onUpdateCheckboxOptionLabel) {
      onUpdateCheckboxOptionLabel(optionId, label);
    } else {
      setLocalOptions(
        options.map(option => 
          option.id === optionId ? { ...option, label } : option
        )
      );
    }
  };

  const handleRemoveOption = (optionId: string) => {
    console.log("Removendo opção:", optionId);
    
    if (onRemoveCheckboxOption) {
      onRemoveCheckboxOption(optionId);
    } else {
      if (options.length > 1) {
        setLocalOptions(options.filter(option => option.id !== optionId));
      }
    }
  };

  const [timeValue, setTimeValue] = useState("12:00");

  const getPlaceholder = () => {
    switch (type) {
      case "phone":
        return "(DDD) 0000-0000";
      case "date":
        return "DD/MM/AAAA";
      case "time":
        return "HH:MM";
      case "link":
        return "https://";
      case "headline":
        return "Digite o título principal aqui...";
      default:
        return "Digite aqui...";
    }
  };

  const getFieldIcon = () => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "date":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case "time":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "link":
        return <LinkIcon className="h-4 w-4 text-green-500" />;
      case "headline":
        return <Type className="h-4 w-4 text-indigo-500" />;
      case "checkbox":
        return <CheckSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Type className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderField = () => {
    switch (type) {
      case "headline":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <div className="p-1 rounded-md bg-indigo-100">
                {getFieldIcon()}
              </div>
              <span className="text-xs font-medium text-indigo-600">Título Principal</span>
            </div>
            <Textarea
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full bg-transparent text-3xl font-bold outline-none resize-none overflow-hidden border-none shadow-none focus-visible:ring-0"
              style={{ minHeight: '60px' }}
            />
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <div className="p-1 rounded-md bg-orange-100">
                <CheckSquare className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-xs font-medium text-orange-600">Checkbox</span>
            </div>
            
            <input
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Digite o título do campo"
              className="w-full bg-transparent text-lg font-medium outline-none"
            />
            
            {/* Lista de opções de checkbox */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-2 group">
                  <Checkbox id={`option-${option.id}`} className="h-5 w-5" />
                  
                  {option.isEditing ? (
                    <Input
                      value={option.label}
                      onChange={(e) => handleUpdateOptionLabel(option.id, e.target.value)}
                      autoFocus
                      className="flex-1"
                      onBlur={() => handleEditOption(option.id, false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditOption(option.id, false);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-between">
                      <label 
                        htmlFor={`option-${option.id}`} 
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {option.label}
                      </label>
                      
                      {/* Botões de ação (corrigidos para serem visíveis) */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditOption(option.id, true);
                          }}
                          className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveOption(option.id);
                          }}
                          disabled={options.length <= 1}
                          className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botão para adicionar nova opção */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar opção
            </Button>
          </div>
        );
      case "time":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <div className="p-1 rounded-md bg-amber-100">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-amber-600">Horário</span>
            </div>
            
            <input
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Digite o título do campo"
              className="w-full bg-transparent text-lg font-medium outline-none"
            />
            
            {/* Componente de seleção de horário com listas roláveis */}
            <div className="pt-2">
              <TimeScrollSelector value={timeValue} onChange={setTimeValue} />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <div className={`p-1 rounded-md ${
                type === "phone" ? "bg-blue-100" : 
                type === "date" ? "bg-purple-100" : 
                type === "time" ? "bg-amber-100" :
                type === "link" ? "bg-green-100" : "bg-gray-100"
              }`}>
                {getFieldIcon()}
              </div>
              <span className={`text-xs font-medium ${
                type === "phone" ? "text-blue-600" : 
                type === "date" ? "text-purple-600" : 
                type === "time" ? "text-amber-600" :
                type === "link" ? "text-green-600" : "text-gray-600"
              }`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            
            <input
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Digite o título do campo"
              className="w-full bg-transparent text-lg font-medium outline-none"
            />
            
            <div className="relative">
              <Input 
                placeholder={getPlaceholder()} 
                className="rounded-xl border-primary/30 focus-visible:ring-primary/30 pl-3 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                {type === "phone" && "Opcional"}
                {type === "date" && "DD/MM/AAAA"}
                {type === "time" && "HH:MM"}
                {type === "link" && "URL"}
              </div>
            </div>
          </div>
        );
    }
  };

  // Função para renderizar o menu de steps
  const renderStepMenuItems = () => {
    // Criar um array com os números dos steps, excluindo o step atual
    const stepNumbers = Array.from({ length: totalSteps }, (_, i) => i + 1)
      .filter(stepNum => stepNum !== currentStep);
    
    if (stepNumbers.length === 0) {
      return (
        <DropdownMenuItem disabled>
          Não há outros steps disponíveis
        </DropdownMenuItem>
      );
    }
    
    return stepNumbers.map(stepNum => (
      <DropdownMenuItem 
        key={stepNum}
        onClick={() => onMoveToStep && onMoveToStep(id, stepNum)}
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        <span>Mover para Step {stepNum}</span>
      </DropdownMenuItem>
    ));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md hover:border-blue-100 ${
        isDragging ? "opacity-50 shadow-lg scale-105 border-blue-200 bg-blue-50/30" : ""
      }`}
    >
      {/* Handle de arrasto */}
      <div 
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      {/* Ações - Botões de duplicar, mover e excluir - com z-index elevado para ficarem acima de outros elementos */}
      <div className="absolute right-4 top-4 flex items-center space-x-1 z-[100]" onClick={e => e.stopPropagation()}>
        {/* Botão de duplicar */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
        >
          <Copy className="h-4 w-4" />
        </Button>
        
        {/* Botão de 3 pontinhos com dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={5} className="z-[100]">
            {totalSteps > 1 ? (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    <span>Colocar no step</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="z-[100]">
                      {renderStepMenuItems()}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </>
            ) : (
              <DropdownMenuItem 
                onClick={() => onMoveToStep && onMoveToStep(id, 2)}
                className="text-indigo-600"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                <span>Colocar no próximo step</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Botão de excluir */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Conteúdo principal do campo */}
      <div className="pl-8">
        {renderField()}
      </div>
    </div>
  );
};

export default FormField;
import { useState, useEffect } from "react";
import FormField from "@/components/form-builder/FormField";
import FormStepProgress from "@/components/form-builder/FormStepProgress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  Type,
  TextCursor,
  AlignLeft,
  Mail,
  Phone,
  Calendar,
  Link as LinkIcon,
  Hash,
  MessageSquare,
  Plus,
  CheckSquare,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";

interface FormFieldType {
  id: string;
  type: string;
  label: string;
  options?: string;
  checkboxOptions?: { id: string; label: string; isEditing: boolean }[];
  isStepDivider?: boolean;
  required?: boolean;
}

interface FormFieldsListProps {
  fields: FormFieldType[];
  onFieldsChange: (fields: FormFieldType[]) => void;
}

const FormFieldsList = ({ fields, onFieldsChange }: FormFieldsListProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getSteps = () => {
    const steps = [0];
    
    fields.forEach((field, index) => {
      if (field.isStepDivider) {
        steps.push(index);
      }
    });
    
    return steps;
  };

  const steps = getSteps();
  
  const hasStepDividers = fields.some(field => field.isStepDivider);
  const totalSteps = hasStepDividers ? steps.length : 1;

  const getCurrentFields = () => {
    if (!hasStepDividers) {
      return fields;
    }
    
    const stepIndices = getSteps();
    
    const startIndex = currentStep === 1 ? 0 : stepIndices[currentStep - 1] + 1;
    const endIndex = currentStep < stepIndices.length ? stepIndices[currentStep] : fields.length;
    
    return fields.slice(startIndex, endIndex);
  };

  const shouldShowNavigation = () => {
    return hasStepDividers && totalSteps > 1;
  };

  const handleAddField = (type: string) => {
    if (type === "step_divider") {
      const stepDivider = {
        id: Math.random().toString(),
        type: "step_divider",
        label: "Próximo Passo",
        isStepDivider: true
      };
      
      const updatedFields = [...fields, stepDivider];
      onFieldsChange(updatedFields);
      
      setCurrentStep(currentStep + 1);
      return;
    }
    
    const newField = {
      id: Math.random().toString(),
      type,
      label: "",
    };
    
    if (!hasStepDividers) {
      const updatedFields = [...fields, newField];
      onFieldsChange(updatedFields);
      return;
    }
    
    const stepIndices = getSteps();
    
    let insertIndex;
    
    if (currentStep === 1) {
      insertIndex = stepIndices.length > 1 ? stepIndices[1] : fields.length;
    } else {
      const startIndex = stepIndices[currentStep - 1] + 1;
      const endIndex = currentStep < stepIndices.length ? stepIndices[currentStep] : fields.length;
      insertIndex = endIndex;
    }
    
    const updatedFields = [
      ...fields.slice(0, insertIndex),
      newField,
      ...fields.slice(insertIndex)
    ];
    
    onFieldsChange(updatedFields);
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    onFieldsChange(
      fields.map((field) =>
        field.id === id ? { ...field, label: newLabel } : field
      )
    );
  };

  const handleRequiredChange = (id: string, isRequired: boolean) => {
    onFieldsChange(
      fields.map((field) =>
        field.id === id ? { ...field, required: isRequired } : field
      )
    );
  };

  const handleDeleteStep = (stepId: string) => {
    const stepDividerIndex = fields.findIndex(field => field.id === stepId);
    if (stepDividerIndex === -1) return;
    
    const stepIndices = getSteps();
    const currentStepIndex = stepIndices.findIndex(index => index === stepDividerIndex);
    
    let endIndex;
    if (currentStepIndex < stepIndices.length - 1) {
      endIndex = stepIndices[currentStepIndex + 1];
    } else {
      endIndex = fields.length;
    }
    
    const newFields = [
      ...fields.slice(0, stepDividerIndex),
      ...fields.slice(endIndex)
    ];
    
    onFieldsChange(newFields);
    
    const newSteps = getSteps();
    if (currentStep > newSteps.length) {
      setCurrentStep(Math.max(1, newSteps.length));
    }
  };

  const handleDeleteField = (id: string) => {
    const fieldToDelete = fields.find(f => f.id === id);
    
    if (fieldToDelete?.isStepDivider) {
      if (window.confirm("Deseja excluir este step e todos os seus campos?")) {
        handleDeleteStep(id);
        return;
      }
    }
    
    const isStepDivider = fieldToDelete?.isStepDivider || false;
    
    const newFields = fields.filter((field) => field.id !== id);
    onFieldsChange(newFields);
    
    if (isStepDivider) {
      const newSteps = getSteps();
      if (currentStep > newSteps.length) {
        setCurrentStep(newSteps.length);
      }
    }
  };

  const handleDuplicateField = (id: string) => {
    const fieldToDuplicate = fields.find((field) => field.id === id);
    if (fieldToDuplicate) {
      if (fieldToDuplicate.isStepDivider) return;
      
      const newField = {
        ...fieldToDuplicate,
        id: Math.random().toString(),
      };
      const newFields = [...fields, newField];
      onFieldsChange(newFields);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      const newFields = [...fields];
      const [movedField] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, movedField);

      onFieldsChange(newFields);
      
      const newSteps = getSteps();
      if (currentStep > newSteps.length) {
        setCurrentStep(newSteps.length);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldOptionsChange = (fieldId: string, options: string) => {
    onFieldsChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, options } : field
      )
    );
  };

  const handleAddCheckboxOption = (fieldId: string) => {
    onFieldsChange(
      fields.map((field) => {
        if (field.id === fieldId) {
          const options = field.checkboxOptions || [];
          return {
            ...field,
            checkboxOptions: [
              ...options,
              {
                id: Math.random().toString(),
                label: `Opção ${options.length + 1}`,
                isEditing: false
              }
            ]
          };
        }
        return field;
      })
    );
  };

  const handleEditCheckboxOption = (fieldId: string, optionId: string, isEditing: boolean) => {
    onFieldsChange(
      fields.map((field) => {
        if (field.id === fieldId) {
          return {
            ...field,
            checkboxOptions: (field.checkboxOptions || []).map((option) =>
              option.id === optionId ? { ...option, isEditing } : option
            )
          };
        }
        return field;
      })
    );
  };

  const handleUpdateCheckboxOptionLabel = (fieldId: string, optionId: string, label: string) => {
    onFieldsChange(
      fields.map((field) => {
        if (field.id === fieldId) {
          return {
            ...field,
            checkboxOptions: (field.checkboxOptions || []).map((option) =>
              option.id === optionId ? { ...option, label } : option
            )
          };
        }
        return field;
      })
    );
  };

  const handleRemoveCheckboxOption = (fieldId: string, optionId: string) => {
    onFieldsChange(
      fields.map((field) => {
        if (field.id === fieldId && (field.checkboxOptions || []).length > 1) {
          return {
            ...field,
            checkboxOptions: (field.checkboxOptions || []).filter(
              (option) => option.id !== optionId
            )
          };
        }
        return field;
      })
    );
  };

  const handleMoveToStep = (fieldId: string, targetStepIndex: number) => {
    console.log(`Movendo campo ${fieldId} para o step ${targetStepIndex}`);
    
    const fieldIndex = fields.findIndex(field => field.id === fieldId);
    if (fieldIndex === -1) {
      console.error("Campo não encontrado");
      return;
    }
    
    const fieldToMove = fields[fieldIndex];
    const stepIndices = getSteps();
    
    if (targetStepIndex === stepIndices.length + 1) {
      console.log("Criando novo step e movendo o campo para ele");
      
      const stepDivider = {
        id: Math.random().toString(),
        type: "step_divider",
        label: "Próximo Passo",
        isStepDivider: true
      };
      
      const newFields = [...fields];
      newFields.splice(fieldIndex, 1);
      
      newFields.push(stepDivider, fieldToMove);
      
      onFieldsChange(newFields);
      setCurrentStep(targetStepIndex);
      return;
    }
    
    let insertIndex;
    
    if (targetStepIndex === 1) {
      insertIndex = stepIndices.length > 1 ? stepIndices[1] : fields.length;
    } else {
      const stepStartIndex = stepIndices[targetStepIndex - 1] + 1;
      const stepEndIndex = targetStepIndex < stepIndices.length 
        ? stepIndices[targetStepIndex] 
        : fields.length;
      
      insertIndex = stepEndIndex;
    }
    
    const newFields = [...fields];
    
    newFields.splice(fieldIndex, 1);
    
    if (fieldIndex < insertIndex) {
      insertIndex--;
    }
    
    newFields.splice(insertIndex, 0, fieldToMove);
    
    onFieldsChange(newFields);
    setCurrentStep(targetStepIndex);
  };

  const fieldTypes = [
    { value: "headline", label: "Título Principal", icon: <Type className="h-4 w-4" /> },
    { value: "text", label: "Texto Curto", icon: <TextCursor className="h-4 w-4" /> },
    { value: "textarea", label: "Texto Longo", icon: <AlignLeft className="h-4 w-4" /> },
    { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { value: "phone", label: "Telefone", icon: <Phone className="h-4 w-4" /> },
    { value: "date", label: "Data", icon: <Calendar className="h-4 w-4" /> },
    { value: "time", label: "Horário", icon: <Clock className="h-4 w-4" /> },
    { value: "link", label: "Link", icon: <LinkIcon className="h-4 w-4" /> },
    { value: "number", label: "Número", icon: <Hash className="h-4 w-4" /> },
    { value: "message", label: "Mensagem", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
    { value: "step_divider", label: "Próximo Passo", icon: <ArrowRight className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {hasStepDividers && totalSteps > 1 && (
        <div className="flex items-center space-x-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <ContextMenu key={index}>
              <ContextMenuTrigger>
                <div 
                  className={`h-2 rounded-full transition-all ${
                    index + 1 === currentStep 
                      ? "w-8 bg-indigo-600" 
                      : index + 1 < currentStep 
                        ? "w-6 bg-indigo-400" 
                        : "w-6 bg-gray-300"
                  }`}
                  onClick={() => setCurrentStep(index + 1)}
                  style={{ cursor: 'pointer' }}
                  title="Clique com botão direito para opções"
                />
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem 
                  className="flex items-center gap-2 text-red-600" 
                  onClick={() => {
                    if (index === 0) {
                      window.alert("Não é possível excluir o primeiro step.");
                      return;
                    }
                    
                    const stepDividerIndex = steps[index];
                    const stepDivider = fields[stepDividerIndex];
                    
                    if (window.confirm(`Deseja excluir o Step ${index + 1} e todos os seus campos?`)) {
                      handleDeleteStep(stepDivider.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir Step {index + 1}</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            {getCurrentFields().map((field) => (
              field.isStepDivider ? (
                <div key={field.id} className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg group">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">{field.label || "Próximo Passo"}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="text-indigo-600"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48 z-50">
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-red-600" 
                          onClick={() => {
                            if (window.confirm("Deseja excluir este step e todos os seus campos?")) {
                              handleDeleteStep(field.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Excluir Step Completo</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </div>
                </div>
              ) : (
                <div key={field.id} className="relative pointer-events-auto">
                  <FormField
                    id={field.id}
                    type={field.type}
                    label={field.label}
                    required={field.required}
                    checkboxOptions={field.checkboxOptions}
                    onLabelChange={(value) => handleLabelChange(field.id, value)}
                    onDelete={() => handleDeleteField(field.id)}
                    onDuplicate={() => handleDuplicateField(field.id)}
                    onAddCheckboxOption={() => handleAddCheckboxOption(field.id)}
                    onEditCheckboxOption={(optionId, isEditing) => 
                      handleEditCheckboxOption(field.id, optionId, isEditing)
                    }
                    onUpdateCheckboxOptionLabel={(optionId, label) => 
                      handleUpdateCheckboxOptionLabel(field.id, optionId, label)
                    }
                    onRemoveCheckboxOption={(optionId) => 
                      handleRemoveCheckboxOption(field.id, optionId)
                    }
                    onMoveToStep={(fieldId, stepIndex) => 
                      handleMoveToStep(fieldId, stepIndex)
                    }
                    onRequiredChange={(isRequired) => 
                      handleRequiredChange(field.id, isRequired)
                    }
                    totalSteps={totalSteps}
                    currentStep={currentStep}
                  >
                    {field.type === "checkbox" && (
                      <div className="space-y-2">
                        <Label htmlFor={`field-${field.id}`}>{field.label || "Opções de seleção"}</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox id={`sample-${field.id}`} />
                          <label htmlFor={`sample-${field.id}`} className="text-sm text-gray-500">
                            Exemplo de opção de checkbox
                          </label>
                        </div>
                        <Input
                          type="text"
                          id={`field-${field.id}`}
                          placeholder="Adicione as opções separadas por vírgula"
                          value={field.options || ""}
                          onChange={(e) => handleFieldOptionsChange(field.id, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </FormField>
                </div>
              )
            ))}
          </SortableContext>

          <div className="flex justify-center mt-8">
            <Select onValueChange={handleAddField}>
              <SelectTrigger className="w-[280px] h-12 px-4 bg-white border border-gray-200 hover:border-blue-200 rounded-xl shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 text-blue-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <SelectValue placeholder="Adicionar Pergunta" className="text-gray-600" />
                </div>
              </SelectTrigger>
              <SelectContent className="w-[280px] p-2 bg-white rounded-xl shadow-lg border border-gray-100">
                {fieldTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{type.label}</span>
                      <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600">
                        {type.icon}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DndContext>

      {shouldShowNavigation() && (
        <div className="flex justify-between pt-4">
          {currentStep > 1 && (
            <Button onClick={handlePreviousStep} variant="outline">
              Anterior
            </Button>
          )}
          {currentStep < totalSteps && (
            <Button onClick={handleNextStep} className="ml-auto">
              Próximo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormFieldsList;

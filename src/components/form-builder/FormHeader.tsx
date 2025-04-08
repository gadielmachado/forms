import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Save } from "lucide-react";

interface FormHeaderProps {
  formName: string;
  onFormNameChange: (name: string) => void;
  onSave: () => void;
  isEditing: boolean;
  formId?: string;
}

const FormHeader = ({ formName, onFormNameChange, onSave, isEditing, formId }: FormHeaderProps) => {
  const handlePreview = () => {
    if (formId) {
      window.open(`/form/${formId}`, '_blank');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Editar Form" : "Criar Form"}
        </h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePreview}
            disabled={!formId}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <Input
        value={formName}
        onChange={(e) => onFormNameChange(e.target.value)}
        placeholder="Nome do Form"
        className="text-lg font-medium"
      />
    </>
  );
};

export default FormHeader;

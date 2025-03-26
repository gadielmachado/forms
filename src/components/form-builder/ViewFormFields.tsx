import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Send, Check } from "lucide-react";
import FormStepProgress from "@/components/form-builder/FormStepProgress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormFieldType {
  id: string;
  type: string;
  label: string;
}

interface ViewFormFieldsProps {
  fields: FormFieldType[];
  formId: string;
}

const FIELDS_PER_STEP = 4;

const ViewFormFields = ({ fields, formId }: ViewFormFieldsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();

  const totalSteps = Math.ceil(fields.length / FIELDS_PER_STEP);
  const startIndex = currentStep * FIELDS_PER_STEP;
  const endIndex = startIndex + FIELDS_PER_STEP;
  const currentFields = fields.slice(startIndex, endIndex);
  const showSteps = fields.length > FIELDS_PER_STEP;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResponseChange = (fieldId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validar campos obrigatórios
      const emptyFields = fields
        .filter(field => field.type !== "headline")
        .filter(field => !responses[field.id]);

      if (emptyFields.length > 0) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos antes de enviar.",
          variant: "destructive",
        });
        return;
      }

      // Enviar respostas para o banco de dados
      const { error } = await supabase
        .from("form_responses")
        .insert({
          form_id: formId,
          response_data: responses,
        });

      if (error) throw error;

      // Mostrar diálogo de sucesso
      setShowSuccessDialog(true);

      // Limpar formulário
      setResponses({});
      setCurrentStep(0);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar respostas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldType) => {
    switch (field.type) {
      case "headline":
        return (
          <h1 className="text-3xl font-bold break-words">{field.label}</h1>
        );
      case "textarea":
        return (
          <Textarea
            value={responses[field.id] || ""}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={`Digite seu ${field.label.toLowerCase()} aqui...`}
            className="rounded-xl border-primary/30 focus-visible:ring-primary/30"
            disabled={isSubmitting}
          />
        );
      default:
        return (
          <Input
            type={field.type}
            value={responses[field.id] || ""}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={`Digite seu ${field.label.toLowerCase()} aqui...`}
            className="rounded-xl border-primary/30 focus-visible:ring-primary/30"
            disabled={isSubmitting}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {showSteps && <FormStepProgress currentStep={currentStep} totalSteps={totalSteps} />}

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        {currentFields.map((field) => (
          <div key={field.id} className={field.type === "headline" ? "" : "space-y-2"}>
            {field.type !== "headline" && (
              <label className="text-lg font-medium">{field.label}</label>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        {showSteps ? (
          <>
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            {isLastStep ? (
              <Button 
                onClick={handleSubmit} 
                className="bg-primary"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar Respostas"}
              </Button>
            ) : (
              <Button 
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="w-full flex justify-end">
            <Button 
              onClick={handleSubmit} 
              className="bg-primary"
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Enviar Respostas"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center justify-center">
              <Check className="h-6 w-6 text-green-500" />
              Respostas Enviadas com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-500">
              Suas respostas foram registradas. Obrigado por participar!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewFormFields; 
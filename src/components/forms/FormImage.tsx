import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface MultiStepFormProps {
  fields: any[];
  fieldsPerStep?: number;
  onSubmit: () => void;
  renderField: (field: any) => React.ReactNode;
}

const MultiStepForm = ({
  fields,
  fieldsPerStep = 4,
  onSubmit,
  renderField
}: MultiStepFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = Math.ceil(fields.length / fieldsPerStep);
  const startIndex = currentStep * fieldsPerStep;
  const endIndex = startIndex + fieldsPerStep;
  const currentFields = fields.slice(startIndex, endIndex);
  const showSteps = fields.length > fieldsPerStep;
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {currentFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        {showSteps ? (
          <>
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            {isLastStep ? (
              <Button onClick={onSubmit} className="bg-primary">
                <Send className="mr-2 h-4 w-4" />
                Enviar Respostas
              </Button>
            ) : (
              <Button onClick={handleNextStep}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="w-full flex justify-end">
            <Button onClick={onSubmit} className="bg-primary">
              <Send className="mr-2 h-4 w-4" />
              Enviar Respostas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStepForm; 
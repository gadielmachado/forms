
import { Check, Circle } from "lucide-react";

interface FormStepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const FormStepProgress = ({ currentStep, totalSteps }: FormStepProgressProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`mx-2 h-[2px] w-16 ${
                  index < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormStepProgress;

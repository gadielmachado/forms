import { useRef } from "react";
import SuccessMessage from "./SuccessMessage";

interface SuccessCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  userName?: string;
}

export function SuccessCard({ 
  open, 
  onOpenChange, 
  message = "Suas respostas foram enviadas com sucesso.",
  userName = ""
}: SuccessCardProps) {
  // Usar o novo componente SuccessMessage
  if (!open) return null;
  
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <SuccessMessage 
      onClose={handleClose}
      message={message}
      userName={userName}
    />
  );
} 
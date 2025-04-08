import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessMessageProps {
  onClose?: () => void;
  userName?: string;
  message?: string;
}

const SuccessMessage = ({
  onClose,
  userName = "",
  message = "Suas respostas foram enviadas com sucesso.",
}: SuccessMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card principal com animação */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: 0.1 
            }}
            className="relative w-full max-w-md p-6 overflow-hidden bg-white rounded-xl shadow-2xl"
          >
            {/* Botão de fechar */}
            <button 
              onClick={handleClose}
              className="absolute p-1 text-gray-400 rounded-full top-4 right-4 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Ícone de sucesso animado */}
            <div className="flex justify-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.3
                }}
                className="relative"
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -z-10">
                  <motion.circle 
                    cx="60" 
                    cy="60" 
                    r="55" 
                    stroke="#E2E8F0" 
                    strokeWidth="10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <motion.circle 
                    cx="60" 
                    cy="60" 
                    r="55" 
                    stroke="#4F46E5" 
                    strokeWidth="10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    className="bg-indigo-600 rounded-full p-5"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Conteúdo com animação */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {userName ? (
                  <>
                    Muito bem, <span className="text-indigo-600">{userName}!</span>
                  </>
                ) : (
                  "Sucesso!"
                )}
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <Button
                onClick={handleClose}
                className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
              >
                Continuar
            </Button>
            </motion.div>

            {/* Elementos decorativos */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
            
            {/* Elementos decorativos adicionais */}
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute top-16 right-16 w-4 h-4 bg-indigo-400 rounded-full"
            />
            <motion.div 
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute bottom-16 left-16 w-3 h-3 bg-indigo-400 rounded-full"
            />
            <motion.div 
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="absolute top-24 left-20 w-2 h-2 bg-indigo-300 rounded-sm"
            />
          </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessMessage; 
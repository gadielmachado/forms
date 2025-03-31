import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
  formName?: string;
  userName?: string;
}

const FormSuccessModal = ({
  isOpen,
  onClose,
  onRestart,
  formName = "",
  userName = "",
}: FormSuccessModalProps) => {
  const [animation, setAnimation] = useState({
    circle: false,
    check: false,
    particles: false,
    content: false
  });

  // Sequência de animação
  useEffect(() => {
    if (isOpen) {
      // Reset animações
      setAnimation({ circle: false, check: false, particles: false, content: false });
      
      // Inicia sequência de animação
      const circleTimer = setTimeout(() => setAnimation(prev => ({ ...prev, circle: true })), 300);
      const checkTimer = setTimeout(() => setAnimation(prev => ({ ...prev, check: true })), 900);
      const particlesTimer = setTimeout(() => setAnimation(prev => ({ ...prev, particles: true })), 1100);
      const contentTimer = setTimeout(() => setAnimation(prev => ({ ...prev, content: true })), 1300);
      
      return () => {
        clearTimeout(circleTimer);
        clearTimeout(checkTimer);
        clearTimeout(particlesTimer);
        clearTimeout(contentTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay com blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Botão de fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>
        
        <div className="p-8 pt-12">
          {/* Ícone de sucesso animado */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24">
              {/* Círculo base */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#EEF2FF"
                  strokeWidth="8"
                />
                
                {/* Círculo animado */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: animation.circle ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              
              {/* Ícone de check */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: animation.check ? 1 : 0,
                  opacity: animation.check ? 1 : 0
                }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="bg-indigo-600 rounded-full p-3">
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: animation.content ? 1 : 0,
              y: animation.content ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {userName ? (
                <>Muito bem, <span className="text-indigo-600">{userName}!</span></>
              ) : (
                "Formulário Enviado com Sucesso!"
              )}
            </h2>
            
            <p className="text-gray-600 mb-8">
              {formName 
                ? `Suas respostas para "${formName}" foram enviadas com sucesso.` 
                : "Suas respostas foram registradas. Obrigado por participar!"}
            </p>
            
            <div className="flex justify-center gap-3">
              {onRestart && (
                <Button
                  onClick={onRestart}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Início</span>
                </Button>
              )}
              
              <Button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
        
        {/* Partículas decorativas */}
        <AnimatePresence>
          {animation.particles && (
            <>
              <motion.div
                initial={{ scale: 0, opacity: 0, x: -5, y: -5 }}
                animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="absolute top-20 right-24 w-3 h-3 bg-indigo-400 rounded-full"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0, x: 5, y: 5 }}
                animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="absolute bottom-20 left-24 w-4 h-4 bg-indigo-300 rounded-full"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0, x: 5, y: -5 }}
                animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="absolute top-32 left-28 w-2 h-2 bg-indigo-400 rounded-sm"
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FormSuccessModal; 
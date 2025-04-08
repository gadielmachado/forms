import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import axios from "axios";
import { verifySubscription, STRIPE_CHECKOUT_URL, SUBSCRIPTION_MESSAGES } from "@/lib/stripeVerification";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [verificationDone, setVerificationDone] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reset verification state when signup mode changes
  useEffect(() => {
    setVerificationDone(false);
    setHasSubscription(false);
    setSubscriptionError("");
  }, [isSignUp]);

  // Função para verificar assinatura com tratamento de erros
  const checkSubscription = async (email) => {
    setSubscriptionError(SUBSCRIPTION_MESSAGES.CHECKING);
    
    try {
      // Verificar assinatura usando o utilitário
      const hasActiveSubscription = await verifySubscription(email);
      
      setVerificationDone(true);
      setHasSubscription(hasActiveSubscription);
      
      if (!hasActiveSubscription) {
        setSubscriptionError(SUBSCRIPTION_MESSAGES.REQUIRED);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
      setVerificationDone(true);
      setHasSubscription(false);
      setSubscriptionError(SUBSCRIPTION_MESSAGES.NETWORK_ERROR);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Se já verificamos e não tem assinatura, mostra o erro e não prossegue
        if (verificationDone && !hasSubscription) {
          setIsLoading(false);
          return;
        }
        
        // Se ainda não verificamos, verifica a assinatura
        if (!verificationDone) {
          const hasValidSubscription = await checkSubscription(email);
          setIsLoading(false);
          
          // Se não tiver assinatura, mostra mensagem e não continua
          if (!hasValidSubscription) {
            return;
          }
        }
        
        // Se tiver assinatura, continua com o registro
        setIsLoading(true);
        
        // Verificar se o email já existe
        try {
          const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: { shouldCreateUser: false }
          });
          
          if (!error) {
            setIsLoading(false);
            setSubscriptionError("Este email já está registrado. Por favor, faça login com sua conta existente.");
            return;
          }
        } catch (e) {
          // Ignora erro e continua
        }
        
        // Registrar o usuário
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        if (authData.user) {
          console.log('Usuário criado com sucesso:', authData.user.id);
          
          try {
            // Criar uma organização padrão para o novo usuário
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenants')
              .insert({
                name: 'Minha Organização',
                created_by: authData.user.id
              })
              .select()
              .single();
              
            if (tenantError) {
              console.error('Erro ao criar tenant:', tenantError);
            } else {
              console.log('Tenant criado com sucesso:', tenantData.id);
              
              // Associar o usuário à organização como admin
              const { error: userTenantError } = await supabase
                .from('user_tenants')
                .insert({
                  user_id: authData.user.id,
                  tenant_id: tenantData.id,
                  role: 'admin'
                });
                
              if (userTenantError) {
                console.error('Erro ao associar usuário ao tenant:', userTenantError);
              }
            }
          } catch (tenantError) {
            console.error('Exceção ao criar tenant:', tenantError);
            // Continua mesmo se falhar criação do tenant
          }
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Você já pode fazer login.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      console.error('Erro durante autenticação:', error);
      
      // Mensagens de erro mais amigáveis e específicas
      let errorMessage = error.message;
      
      if (error.message.includes('database') || error.message.includes('Database')) {
        errorMessage = "Houve um problema ao salvar seus dados. Tente novamente ou entre em contato com o suporte.";
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      } else if (error.message.includes('User already registered')) {
        errorMessage = "Este email já está registrado. Por favor, faça login ou recupere sua senha.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Gradiente e Mensagem */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700">
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[url('/auth-bg-pattern.svg')] opacity-20" />
        </div>
        <div className="relative z-10 w-full flex flex-col items-start justify-center px-16">
          {/* Apenas o logo sem texto redundante */}
          <div className="flex flex-col items-start">
            <div>
              <img 
                src="/images/logo.png.png" 
                alt="Soren Forms Logo" 
                className="w-56 h-56 object-contain"
              />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-12 -mt-10">
              Soren Forms: Conecte cliques a resultados – crie formulários incríveis em segundos!
            </h1>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-blue-100">Crie formulários personalizados em minutos</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-blue-100">Receba respostas em tempo real</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-blue-100">Analise dados e crie propostas com IA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            {/* Logo para mobile */}
            <div className="lg:hidden w-64 h-64 mx-auto mb-6">
              {/* Seu logo - versão mobile */}
              <img 
                src="/images/logo.png.png" 
                alt="Soren Forms Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              {isSignUp ? "Criar Conta" : "Login"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {isSignUp
                ? "Preencha os dados abaixo para criar sua conta"
                : "Bem-vindo de volta! Por favor, faça login em sua conta."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    placeholder="nome@exemplo.com"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 h-11 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Senha</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    className="pl-10 pr-10 h-11 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isSignUp && subscriptionError && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                    {subscriptionError === SUBSCRIPTION_MESSAGES.CHECKING ? (
                      <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      {subscriptionError === SUBSCRIPTION_MESSAGES.CHECKING ? "Verificando assinatura" : "Assinatura necessária"}
                    </h3>
                  </div>
                </div>
                <div className="text-sm text-blue-700 mb-3">
                  {subscriptionError}
                </div>
                {subscriptionError !== SUBSCRIPTION_MESSAGES.CHECKING && verificationDone && !hasSubscription && (
                  <a 
                    href={STRIPE_CHECKOUT_URL} 
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200 font-medium"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Adquirir assinatura agora
                  </a>
                )}
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-700">
                    Lembrar-me
                  </Label>
                </div>

                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
              disabled={isLoading || (isSignUp && verificationDone && !hasSubscription)}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? "Criando conta..." : "Entrando..."}
                </>
              ) : (
                <>
                {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {isSignUp ? "Criar conta" : "Entrar"}
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Fazer login" : "Criar conta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
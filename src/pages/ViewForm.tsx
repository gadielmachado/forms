import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Clock, Check } from "lucide-react";
import { toast, useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { SuccessCard } from "@/components/success-card";
import { cn } from "@/lib/utils";
import emailjs from '@emailjs/browser';
import { useTenant } from "@/contexts/TenantContext";
import TimeScrollSelector from "@/components/ui/time-scroll-selector";
import CustomDatePicker from "@/components/ui/custom-date-picker";
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from "@/contexts/ThemeContext";

interface CheckboxOption {
  id: string;
  label: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  checkboxOptions?: CheckboxOption[];
  required?: boolean;
  isStepDivider?: boolean;
}

interface FormType {
  id: string;
  name: string;
  fields: FormField[];
  image_url: string | null;
  tenant_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormAnalytics {
  id?: string;
  tenant_id: string;
  form_id: string;
  session_id: string;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  fields_total: number;
  fields_filled: number;
  user_agent: string;
}

// No início do arquivo, adicionar um tipo para import.meta.env
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

const ViewForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embed') === 'true';
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const { currentTheme } = useTheme();

  // Estados para controle de analytics
  const [sessionId] = useState(() => uuidv4());
  const [analyticsStarted, setAnalyticsStarted] = useState(false);
  
  // Estado para armazenar o tenant_id efetivo
  const [effectiveTenantId, setEffectiveTenantId] = useState<string | undefined>(undefined);

  // Adicionar após as demais declarações de estado
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Use isDebugMode para exibir informações diagnósticas no console
  const isDebugMode = true;

  // Acessar o queryClient para invalidar consultas
  const queryClient = useQueryClient();

  // Função utilitária para validar UUID
  const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Effect para detectar e configurar tenant_id da URL se presente
  useEffect(() => {
    // Obter todos os parâmetros da URL usando URLSearchParams
    const urlParams = new URLSearchParams(location.search);
    
    try {
    // Verificar se há tenant_id na URL
      const urlTenantId = urlParams.get('tenant_id');
    
    if (urlTenantId && isValidUUID(urlTenantId)) {
      console.log("🔑 Usando tenant_id da URL:", urlTenantId);
      setEffectiveTenantId(urlTenantId);
    } else if (currentTenant?.id) {
      console.log("🔑 Usando tenant_id do contexto atual:", currentTenant.id);
      setEffectiveTenantId(currentTenant.id);
    } else {
      console.log("⚠️ Nenhum tenant_id disponível no momento. Será buscado do formulário.");
    }
    
    // Verificar se há theme_id na URL para aplicar imediatamente
      const urlThemeId = urlParams.get('theme_id');
    if (urlThemeId) {
      // Atualizar o tema no localStorage para garantir consistência
      localStorage.setItem('soren-forms-theme', urlThemeId);
      console.log("🎨 Aplicando tema da URL:", urlThemeId);
    }
      
      // Verificar e processar parâmetro 'embed'
      const embedParam = urlParams.get('embed');
      if (embedParam === 'true') {
        console.log("📱 Modo incorporado (embed) detectado na URL");
        // Possível lógica adicional para o modo embed
      }
      
      // Log para debug
      if (isDebugMode) {
        console.log("📊 Todos os parâmetros da URL:", Object.fromEntries(urlParams.entries()));
      }
    } catch (error) {
      console.error("❌ Erro ao processar parâmetros da URL:", error);
    }
  }, [location.search, currentTenant, isDebugMode]);

  // Effect para logging quando o componente montar (especialmente útil no iframe)
  useEffect(() => {
    if (isDebugMode) {
      console.log('=== VIEWFORM COMPONENTE MONTADO ===');
      console.log('ID do formulário:', id);
      console.log('Modo incorporado (embed):', isEmbedded);
      console.log('Tenant atual:', currentTenant);
      console.log('Query params:', Object.fromEntries(new URLSearchParams(location.search)));
      console.log('Tenant ID efetivo:', effectiveTenantId);
    }
  }, [id, isEmbedded, currentTenant, location.search, effectiveTenantId]);

  const { data: form, error: formError, isLoading: isFormLoading } = useQuery<FormType>({
    queryKey: ["form", id],
    queryFn: async () => {
      console.log(`[ViewForm] Buscando formulário com ID: ${id}`);

      if (!id) {
        console.error("[ViewForm] ID do formulário está vazio ou indefinido");
        throw new Error("ID do formulário não fornecido");
      }

      try {
        // Adicionar mais logs de depuração
        console.log(`[ViewForm-Debug] Detalhes da requisição: URL=${window.location.href}, Mobile=${isMobileDevice}, Embed=${isEmbedded}`);
        console.log(`[ViewForm-Debug] Usando ID do formulário: ${id}`);

        // MODIFICAÇÃO: Não usar .single() para evitar erro de múltiplas linhas
        let { data, error } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id.trim()) // Garantir que o ID esteja sem espaços
          .limit(1); // Limitar a 1 resultado em vez de .single()

        // Verificar os resultados detalhadamente
        console.log(`[ViewForm-Debug] Resposta do Supabase: Status=${error ? 'Erro' : 'Sucesso'}, Resultados: ${data?.length || 0}`);
        
        if (error) {
          console.error("[ViewForm] Erro detalhado do Supabase:", error);
          console.error(`[ViewForm] Código de erro: ${error.code}, Mensagem: ${error.message}, Detalhes: ${error.details}`);
          throw new Error(`Erro ao carregar formulário: ${error.message}`);
        }
        
        // Verificar se temos dados - como não usamos .single(), precisamos verificar o array
        if (!data || data.length === 0) {
          console.log("[ViewForm-Debug] Tentando abordagem alternativa de consulta...");
          
          // Segunda tentativa usando abordagem alternativa
          // Não usar ILIKE com UUID, pois causa erro "operator does not exist: uuid ~~* unknown"
          const retryResult = await supabase
            .from("forms")
            .select("*")
            .eq("id", id.trim())
            .limit(1);
            
          if (retryResult.error) {
            console.error("[ViewForm] Erro na segunda tentativa:", retryResult.error);
            throw new Error(`Erro ao carregar formulário: ${retryResult.error.message}`);
          }
          
          if (retryResult.data && retryResult.data.length > 0) {
            console.log("[ViewForm-Debug] Formulário encontrado na segunda tentativa:", retryResult.data[0]);
            data = retryResult.data;
          } else {
            console.error(`[ViewForm] Formulário não encontrado com ID: ${id}`);
            throw new Error(`Formulário não encontrado com ID: ${id}`);
          }
        }

        // Pegar o primeiro item do array (já que não usamos .single())
        const formData = data[0];
        
        if (!formData) {
          console.error(`[ViewForm] Formulário não encontrado com ID: ${id}`);
          throw new Error(`Formulário não encontrado com ID: ${id}`);
        }

        // Verificar e tratar a estrutura de dados antes de retornar
        let processedFields: FormField[] = [];
        if (!formData.fields || !Array.isArray(formData.fields)) {
          console.warn("[ViewForm] Formulário com estrutura inválida:", formData);
          
          // Tentar converter se for uma string JSON
          if (typeof formData.fields === 'string') {
            try {
              const parsedFields = JSON.parse(formData.fields);
              if (Array.isArray(parsedFields)) {
                processedFields = parsedFields as FormField[];
              }
              console.log("[ViewForm] Campos JSON convertidos com sucesso:", processedFields);
            } catch (e) {
              console.error("[ViewForm] Erro ao converter campos JSON:", e);
              processedFields = [];
            }
          } else {
            console.warn("[ViewForm] Inicializando fields como array vazio");
            processedFields = [];
          }
        } else {
          // Se já for um array, usar diretamente
          processedFields = formData.fields as unknown as FormField[];
        }

        console.log("[ViewForm] Formulário encontrado:", formData);
        
        // Converter explicitamente para o formato correto
        const result: FormType = {
          id: formData.id,
          name: formData.name || "",
          fields: processedFields,
          image_url: formData.image_url,
          tenant_id: (formData as any).tenant_id || "",
          user_id: formData.user_id,
          created_at: formData.created_at,
          updated_at: formData.updated_at
        };
        
        return result;
      } catch (error) {
        // Melhorar a mensagem de erro para incluir mais detalhes
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Erro desconhecido ao carregar o formulário';
        
        console.error("[ViewForm] Erro não tratado ao buscar formulário:", error);
        throw new Error(`Erro ao carregar formulário: ${errorMessage}`);
      }
    },
    retry: 3, // Aumentar o número de retentativas
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Backoff exponencial
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Efeito para monitorar mudanças no formulário
  useEffect(() => {
    if (isDebugMode && form) {
      console.log("Form atualizado:", form);
      console.log(`Campos no formulário: ${form.fields?.length || 0}`);
      console.log("Verificando hasStepDividers:", 
        form.fields?.some(field => field.isStepDivider) || false);
    }
  }, [form]);

  // Use effect para monitorar erros de carregamento
  useEffect(() => {
    if (formError) {
      console.error("Erro ao carregar o formulário:", formError);
      // Notificar o usuário sobre o erro
      toast({
        title: "Erro ao carregar formulário",
        description: `Não foi possível carregar o formulário: ${formError.message}`,
        variant: "destructive",
      });
    }
  }, [formError]);

  // NOVA LÓGICA: Identificar divisores de passos
  const getStepDividers = () => {
    if (!form?.fields) return [0];
    
    // O primeiro step sempre começa no índice 0
    const dividers = [0];
    
    // Adicionar índices onde há divisores de passos
    form.fields.forEach((field, index) => {
      if (field.isStepDivider) {
        dividers.push(index);
      }
    });
    
    if (isDebugMode) {
      console.log("Divisores de passos:", dividers);
    }
    
    return dividers;
  };

  // Verificar se o formulário tem divisores de passo
  const hasStepDividers = form?.fields?.some(field => field.isStepDivider) || false;
  
  // Calcular os passos com base nos divisores
  const stepDividers = getStepDividers();
  const totalSteps = hasStepDividers ? stepDividers.length : 1;

  // NOVA FUNÇÃO: Obter campos do passo atual
  const getCurrentStepFields = () => {
    if (!form?.fields) {
      if (isDebugMode) console.warn("getCurrentStepFields: form.fields é undefined ou null");
      return [];
    }
    
    // Se não houver divisores, mostrar todos os campos (exceto divisores)
    if (!hasStepDividers) {
      const fields = form.fields.filter(field => !field.isStepDivider);
      if (isDebugMode) console.log(`getCurrentStepFields (sem divisores): retornando ${fields.length} campos`);
      return fields;
    }
    
    // Determinar os índices de início e fim do passo atual
    const startIndex = currentStep === 1 ? 0 : stepDividers[currentStep - 1] + 1;
    const endIndex = currentStep < stepDividers.length ? stepDividers[currentStep] : form.fields.length;
    
    if (isDebugMode) {
      console.log(`getCurrentStepFields: passo ${currentStep} de ${totalSteps}`);
      console.log(`Índices de start/end: ${startIndex}/${endIndex}`);
    }
    
    // Retornar os campos do passo atual (exceto divisores)
    const fieldsForCurrentStep = form.fields
      .slice(startIndex, endIndex)
      .filter(field => !field.isStepDivider);
      
    if (isDebugMode) console.log(`Campos para o passo atual: ${fieldsForCurrentStep.length}`);
    
    return fieldsForCurrentStep;
  };

  // Navegação entre passos
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  // Atualizada para lidar com checkboxes
  const handleInputChange = (fieldId: string, value: string) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Função para lidar com alterações nos checkboxes
  const handleCheckboxChange = (fieldId: string, optionId: string, isChecked: boolean) => {
    setFormResponses(prev => {
      // Inicializa ou obtém array atual de opções selecionadas
      const currentSelections = prev[fieldId] || [];
      
      let updatedSelections;
      if (isChecked) {
        // Adiciona a opção se não estiver já selecionada
        updatedSelections = [...currentSelections, optionId];
      } else {
        // Remove a opção se estiver selecionada
        updatedSelections = currentSelections.filter(id => id !== optionId);
      }
      
      return {
        ...prev,
        [fieldId]: updatedSelections
      };
    });
  };

  // Constante UUID para tenant padrão
  const DEFAULT_TENANT_UUID = "00000000-0000-0000-0000-000000000000";

  // Adicionar função para enviar dados analíticos usando fetch diretamente
  const recordFormAnalytics = async (formData, isComplete = false) => {
    if (!id || (isComplete && !analyticsStarted)) return;
    
    try {
      // Determinar tenant_id
      let tenantId = effectiveTenantId || currentTenant?.id;
      
      // Função para verificar UUID
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };
      
      // Se não tiver tenant no contexto e estiver em modo embed
      if (isEmbedded && !tenantId) {
        // Tentar pegar da URL
        const urlTenantId = new URLSearchParams(location.search).get('tenant_id');
        
        if (urlTenantId && isValidUUID(urlTenantId)) {
          tenantId = urlTenantId;
        } else {
          // Tentar pegar do formulário, usando verificação segura
          const { data: formData, error } = await supabase
            .from("forms")
            .select("*")  // Usar * em vez de tenant_id
            .eq("id", id)
            .single();
            
          if (!error && formData && 'tenant_id' in formData) {  // Verificar se tenant_id existe no objeto
            tenantId = formData.tenant_id;
            console.log("Usando tenant_id do formulário:", tenantId);
          } else {
            // Fallback para um UUID válido
            tenantId = DEFAULT_TENANT_UUID;
            console.log("Usando tenant_id padrão:", tenantId);
          }
        }
      }
      
      // Se for para iniciar uma sessão
      if (!isComplete) {
        // Contar campos reais
        const fieldsCount = formData.fields.filter(
          field => field.type !== "headline" && !field.isStepDivider
        ).length;
        
        // Dados para inserção
        const analyticsData = {
          tenant_id: tenantId,
          form_id: id,
          session_id: sessionId,
          started_at: new Date().toISOString(),
          is_completed: false,
          fields_total: fieldsCount,
          fields_filled: 0,
          user_agent: navigator.userAgent || ''
        };
        
        // Obter URLs e chaves do Supabase de forma segura
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        
        // URL da API REST do Supabase para form_analytics
        const apiUrl = `${supabaseUrl}/rest/v1/form_analytics`;
        
        // Fazer a requisição POST
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(analyticsData)
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao registrar analytics: ${response.status}`);
        }
        
        console.log("Analytics iniciado com sucesso:", {
          sessionId,
          formId: id
        });
        
        setAnalyticsStarted(true);
      } 
      // Se for para completar uma sessão existente
      else {
        // Dados para atualização
        const updateData = {
          completed_at: new Date().toISOString(),
          is_completed: true,
          fields_filled: Object.keys(formResponses).length
        };
        
        // Obter URLs e chaves do Supabase de forma segura
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        
        // URL da API REST do Supabase para form_analytics
        const apiUrl = `${supabaseUrl}/rest/v1/form_analytics?session_id=eq.${sessionId}&form_id=eq.${id}&tenant_id=eq.${tenantId}`;
        
        // Fazer a requisição PATCH
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao atualizar analytics: ${response.status}`);
        }
        
        console.log("Analytics finalizado com sucesso:", {
          sessionId,
          formId: id,
          fieldsFilled: Object.keys(formResponses).length
        });
      }
    } catch (error) {
      console.error("Erro ao processar analytics:", error);
    }
  };

  // Adicionar useEffect para registrar visualização quando o formulário é carregado
  useEffect(() => {
    if (form && !analyticsStarted) {
      recordFormAnalytics(form, false);
    }
  }, [form, analyticsStarted]);

  const handleSubmit = async () => {
    // Lógica para suportar formulários incorporados
    let tenantId: string | undefined = effectiveTenantId || currentTenant?.id;
    
    // UUID público/padrão para fallback (substitua por um UUID real do seu banco de dados)
    const DEFAULT_TENANT_UUID = "00000000-0000-0000-0000-000000000000";
    
    // Se estiver no modo incorporado (embed=true)
    if (isEmbedded) {
      // Tentar pegar tenant_id da URL
      const forcedTenantId = new URLSearchParams(location.search).get('tenant_id');
      
      if (forcedTenantId && isValidUUID(forcedTenantId)) {
        // Usar tenant_id da URL se for um UUID válido
        tenantId = forcedTenantId;
        console.log("Usando tenant_id da URL:", tenantId);
      } 
      else if (!tenantId) {
        try {
          // Buscar tenant_id do formulário
          const { data: formData, error } = await supabase
            .from("forms")
            .select("tenant_id")
            .eq("id", id)
            .single();
            
          // Verificar se temos dados e se há um tenant_id que é um UUID válido
          const formTenantId = formData && formData.tenant_id ? String(formData.tenant_id) : null;
          if (!error && formTenantId && isValidUUID(formTenantId)) {
            tenantId = formTenantId;
            console.log("Usando tenant_id do formulário:", tenantId);
          } else {
            // Fallback para um UUID válido
            tenantId = DEFAULT_TENANT_UUID;
            console.log("Usando tenant_id padrão:", tenantId);
          }
        } catch (error) {
          console.error("Erro ao buscar tenant_id:", error);
          // Fallback para um UUID válido
          tenantId = DEFAULT_TENANT_UUID;
          console.log("Usando tenant_id padrão (após erro):", tenantId);
        }
      }
    }
    
    // Verificação final - se não tiver um tenant_id válido, mostrar erro
    if (!tenantId || !isValidUUID(tenantId)) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar a organização para enviar a resposta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mostrar toast de carregamento
      toast({
        title: "Processando...",
        description: "Enviando suas respostas, aguarde um momento.",
      });

      if (!id || !formResponses) {
        console.error('Dados incompletos:', { id, formResponses });
        throw new Error('Dados incompletos para envio');
      }

      // Validar campos obrigatórios
      const emptyFields = form?.fields
        .filter(field => field.type !== "headline")
        .filter(field => {
          if (field.type === "checkbox") {
            // Para checkbox, verifica se tem pelo menos uma opção selecionada
            const selections = formResponses[field.id];
            return !selections || selections.length === 0;
          }
          // Para outros campos, verifica se tem valor
          return !formResponses[field.id];
        });

      if (emptyFields && emptyFields.length > 0) {
        console.log('Campos vazios:', emptyFields);
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos antes de enviar.",
          variant: "destructive",
        });
        return;
      }

      console.log('Preparando dados para envio...');

      // Formatar respostas
      const formattedResponses = Object.entries(formResponses).reduce((acc, [fieldId, value]) => {
        const field = form?.fields.find(f => f.id === fieldId);
        if (!field) return acc;
        
        if (field.type === "checkbox" && Array.isArray(value)) {
          // Para campos checkbox, converte IDs de opções para seus labels
          const selectedLabels = value.map(optionId => {
            const option = field.checkboxOptions?.find(opt => opt.id === optionId);
            return option?.label || optionId;
          });
          acc[field.label] = selectedLabels.join(", ");
        } else if (field.type === "date" && value) {
          // Converter data do formato ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
          try {
            const dateParts = value.split('-');
            if (dateParts.length === 3) {
              // Reorganizar para formato DD/MM/YYYY
              acc[field.label] = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            } else {
              // Caso não seja possível formatar, usar o valor original
              acc[field.label] = value;
            }
          } catch (error) {
            // Em caso de erro, manter o valor original
            console.error('Erro ao formatar data:', error);
            acc[field.label] = value;
          }
        } else {
          acc[field.label] = value;
        }
        
        return acc;
      }, {} as Record<string, string>);

      console.log('Dados formatados:', formattedResponses);

      // Salvar no Supabase com o tenant_id resolvido
      console.log('Salvando no Supabase com tenant_id:', tenantId);
      const { data: savedResponse, error: supabaseError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: id,
          response_data: formattedResponses,
          tenant_id: tenantId
        }])
        .select()
        .single();

      if (supabaseError) {
        console.error('Erro ao salvar no Supabase:', supabaseError);
        throw new Error(`Erro ao salvar resposta: ${supabaseError.message}`);
      }

      console.log('Resposta salva com sucesso:', savedResponse);
      
      // Registrar a conclusão da sessão nos analytics
      await recordFormAnalytics(form, true);

      // Buscar o email do administrador
      console.log('Buscando email do administrador...');
      
      // Função segura para buscar configurações
      const fetchAdminEmail = async () => {
        try {
          // Tentar várias abordagens para garantir que encontramos o email
          
          // 1. Tentar buscar da tabela settings, se ela existir
          let adminEmail = null;
          try {
            const settingsResponse = await fetch('/api/settings', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (settingsResponse.ok) {
              const settings = await settingsResponse.json();
              adminEmail = settings.admin_email;
              console.log('Email obtido via API:', adminEmail);
            }
          } catch (apiError) {
            console.warn('Não foi possível obter email via API:', apiError);
          }
          
          // 2. Se não funcionou, tentar uma abordagem direta com o ID do tenant
          if (!adminEmail && tenantId) {
            try {
              // Consulta específica com tenant_id - usando rota alternativa para evitar erros de tipagem
              const response = await fetch(`/api/tenant_settings?tenant_id=${tenantId}`, {
                method: 'GET'
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result?.admin_email) {
                  adminEmail = result.admin_email;
                  console.log('Email obtido via API de tenant_settings:', adminEmail);
                }
              }
            } catch (tenantError) {
              console.warn('Não foi possível obter email via tenant_settings API:', tenantError);
            }
          }
          
          // 3. Tentar buscar perfil do usuário como último recurso
          if (!adminEmail && tenantId) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', tenantId)
                .single();
                
              if (profile?.email) {
                adminEmail = profile.email;
                console.log('Email obtido do perfil:', adminEmail);
              }
            } catch (profileError) {
              console.warn('Não foi possível obter email via profiles:', profileError);
            }
          }
          
          // Retornar o email encontrado ou null
          return adminEmail;
        } catch (error) {
          console.error('Erro ao buscar email do administrador:', error);
          return null;
        }
      };
      
      // Buscar o email
      const adminEmail = await fetchAdminEmail();
      console.log('Email do administrador final:', adminEmail);

      if (!adminEmail) {
        console.warn('Email do administrador não configurado');
        toast({
          title: "Aviso",
          description: "Suas respostas foram salvas, mas não há email configurado para notificações.",
          variant: "destructive",
        });
        
        setFormResponses({});
        setCurrentStep(1);
        setShowSuccess(true);
        return;
      }

      // Criar tabela HTML das respostas para o email
      let respostasHTML = '';
      Object.entries(formattedResponses).forEach(([campo, valor]) => {
        respostasHTML += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${campo}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${valor}</td>
          </tr>
        `;
      });

      // ENVIO DO EMAIL: Usa o email do administrador como destinatário
      const templateParams = {
        from_name: "Soren Forms",
        to_email: adminEmail,
        formulario: form?.name || "Formulário",
        data: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        respostas_html: respostasHTML,
        reply_to: "sorensolucoesdigitais@gmail.com"
      };
      
      try {
        // Adicionar mais logs para diagnóstico
        console.log('Tentando enviar email para:', adminEmail);
        console.log('Dados do template:', templateParams);
        
        // Atualizar para a chave pública correta
        const emailResult = await emailjs.send(
          'service_1brm6jm',
          'template_zhbnvj4',
          templateParams,
          'TYGTN6iQMuk1SSehj'
        );
        
        console.log('Email enviado com sucesso:', emailResult.status, emailResult.text);
        
        // Tudo concluído com sucesso
        toast({
          title: "Sucesso!",
          description: "Suas respostas foram enviadas e a notificação por email foi processada.",
          variant: "default",
        });
      } catch (emailError: any) {
        // Melhorar o log de erro para mais detalhes
        console.error('Erro detalhado ao enviar email:', emailError);
        console.error('Mensagem de erro:', emailError.message);
        console.error('Status de erro (se disponível):', emailError.status);
        
        toast({
          title: "Problema com notificação por email",
          description: `Suas respostas foram salvas, mas o email não pôde ser enviado: ${emailError.message}`,
          variant: "destructive",
        });
      }

      setFormResponses({});
      setCurrentStep(1);
      setShowSuccess(true);

    } catch (error: any) {
      console.error('Erro detalhado ao processar envio:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua resposta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = (field: any) => {
    switch (field.type) {
      case "date":
        return "dd/mm/aaaa";
      case "time":
        return "00:00";
      case "url":
        return "https://seulink.com";
      case "phone":
        return "(xx) xxxxx-xxxx";
      default:
        return "Digite aqui...";
    }
  };

  const renderField = (field: FormField) => {
    // Ignorar divisores de passo
    if (field.isStepDivider) return null;
    
    if (field.type === "headline") {
      return (
        <div key={field.id} className="py-4">
          <h1 className={`text-3xl font-bold ${currentTheme.colors.text}`}>{field.label}</h1>
        </div>
      );
    }

    // Tratamento específico para campos checkbox
    if (field.type === "checkbox") {
      return (
        <div key={field.id} className="space-y-3">
          <label className={`block text-sm font-medium ${currentTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          
          {/* Container estilizado para as opções de checkbox */}
          <div className={`space-y-2 ${currentTheme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'} p-4 rounded-lg border`}>
            {(field.checkboxOptions || []).map((option) => {
              // Verifica se a opção está selecionada
              const isSelected = Array.isArray(formResponses[field.id]) && 
                formResponses[field.id].includes(option.id);
                
              return (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${field.id}-${option.id}`}
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(field.id, option.id, e.target.checked)}
                    className={`h-5 w-5 rounded border-${currentTheme.mode === 'dark' ? 'gray-600' : 'gray-300'} ${currentTheme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} ${extractMainColor(currentTheme.colors.accent)} focus:ring-opacity-50`}
                  />
                  <label 
                    htmlFor={`${field.id}-${option.id}`} 
                    className={`text-sm ${currentTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Tratamento específico para o campo de horário
    if (field.type === "time") {
      return (
        <div key={field.id} className="space-y-2">
          <label className={`block text-sm font-medium ${currentTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {field.label}
            {field.required && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <div className={`${currentTheme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'} border rounded-lg p-4`}>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className={currentTheme.colors.text} />
              <span className={`text-xs font-medium ${currentTheme.colors.text}`}>Horário em formato 24h</span>
            </div>
            <TimeScrollSelector 
              value={formResponses[field.id] || "00:00"} 
              onChange={(value) => handleInputChange(field.id, value)}
            />
          </div>
        </div>
      );
    }

    // Renderização padrão para outros tipos de campo
    return (
      <div key={field.id} className="space-y-2">
        <label className={`block text-sm font-medium ${currentTheme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {field.label}
          {field.required && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </label>
        {field.type === "date" ? (
          <div className="relative">
            <CustomDatePicker
              value={formResponses[field.id] || ""}
              onChange={(value) => handleInputChange(field.id, value)}
              required={field.required}
              className="w-full"
            />
            <small className={`block mt-1 ${currentTheme.colors.text} text-xs`}>Formato: DD/MM/AAAA</small>
          </div>
        ) : (
        <input
          type={field.type || "text"}
          value={formResponses[field.id] || ""}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.mode === 'dark' 
              ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
              : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'} focus:ring-2 focus:${extractMainColor(currentTheme.colors.text)} focus:border-${extractMainColor(currentTheme.colors.border)} transition-colors duration-200`}
          placeholder={getPlaceholder(field)}
          required={field.required}
        />
        )}
      </div>
    );
  };

  // Exibir mensagem quando há um divisor de passo no passo atual
  const renderStepDivider = () => {
    const currentFields = form?.fields.slice(
      currentStep === 1 ? 0 : stepDividers[currentStep - 1] + 1,
      currentStep < stepDividers.length ? stepDividers[currentStep] : form?.fields.length
    );
    
    if (currentFields?.some(field => field.isStepDivider)) {
  return (
        <div className="py-3 px-4 my-4 bg-indigo-900/30 border border-indigo-800 rounded-lg">
          <p className="text-indigo-400 text-sm">Próximo Passo</p>
            </div>
      );
    }
    
    return null;
  };

  // Função para renderizar os indicadores de steps de forma responsiva
  const renderStepIndicators = () => {
    if (!hasStepDividers || totalSteps <= 1) return null;
    
    return (
            <div className="mb-8">
        {/* Container com scroll horizontal para muitos steps */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <div className={`flex items-center space-x-2 ${totalSteps > 5 ? 'min-w-max' : ''}`}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={cn(
                    // Reduzir tamanho quando houver muitos steps
                    totalSteps > 5 ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
                    "rounded-full flex items-center justify-center font-medium transition-all duration-200",
                        currentStep === index + 1
                      ? currentTheme.colors.button.split(' ')[0] + " text-white"
                          : index + 1 < currentStep
                      ? "bg-opacity-20 border-2 " + currentTheme.colors.border
                          : "bg-gray-800 text-gray-400 border-2 border-gray-700"
                      )}
                  onClick={() => setCurrentStep(index + 1)}
                  style={{ cursor: 'pointer' }}
                    >
                      {index + 1}
                    </div>
                    {index < totalSteps - 1 && (
                      <div
                        className={cn(
                      // Reduzir tamanho da linha conectora para muitos steps
                      totalSteps > 5 ? "w-6 h-1" : "w-12 h-1",
                      "mx-1",
                          index + 1 < currentStep
                        ? currentTheme.colors.button.split(' ')[0]
                            : "bg-gray-700"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
        
        {/* Indicador de scroll quando há muitos steps (mostrar apenas em telas pequenas) */}
        {totalSteps > 5 && (
          <div className="mt-2 text-center text-xs text-gray-500 md:hidden">
            <span>← Deslize para ver mais passos →</span>
          </div>
        )}
      </div>
    );
  };

  // Função utilitária para extrair cor principal sem hover
  const extractMainColor = (colorClass: string) => {
    return colorClass.split(' ')[0];
  };

  // Efeito para comunicação com o iframe pai quando no modo embed
  useEffect(() => {
    if (!isEmbedded || window.parent === window) return;
    
    // Função para enviar altura para o container pai
    const sendHeightToParent = () => {
      try {
        const currentHeight = document.body.scrollHeight;
        if (isDebugMode) console.log("Enviando altura:", currentHeight);
        window.parent.postMessage({
          type: 'soren-form-height',
          height: currentHeight
        }, '*');
      } catch (error) {
        console.error("Erro ao enviar altura:", error);
      }
    };
    
    // Função para notificar o container pai que o formulário está completamente carregado
    const notifyLoadedToParent = () => {
      try {
        if (isDebugMode) console.log("Notificando que o formulário está carregado");
        window.parent.postMessage({
          type: 'soren-form-loaded',
          formId: id
        }, '*');
      } catch (error) {
        console.error("Erro ao notificar carregamento:", error);
      }
    };
    
    // Função para enviar mensagem de erro quando necessário
    const notifyErrorToParent = (message: string) => {
      try {
        if (isDebugMode) console.log("Enviando mensagem de erro:", message);
        window.parent.postMessage({
          type: 'soren-form-error',
          formId: id,
          message: message
        }, '*');
      } catch (error) {
        console.error("Erro ao enviar notificação de erro:", error);
      }
    };
    
    // Responder a mensagens do container pai
    const handleParentMessages = (event: MessageEvent) => {
      // Em produção, verificar a origem
      // if (event.origin !== expectedOrigin) return;
      
      if (!event.data || !event.data.type) return;
      
      if (event.data.type === 'soren-parent-loaded') {
        if (isDebugMode) console.log("Recebida mensagem do container pai:", event.data);
        // Se o formulário já estiver carregado, notifique imediatamente
        if (!isFormLoading && form) {
          notifyLoadedToParent();
          sendHeightToParent();
        }
        // Se houver erro, notifique
        if (formError) {
          notifyErrorToParent(formError.message || "Erro ao carregar o formulário");
        }
      }
      
      if (event.data.type === 'soren-parent-check') {
        if (isDebugMode) console.log("Recebido check do container pai");
        if (!isFormLoading && form) {
          notifyLoadedToParent();
        }
        sendHeightToParent();
      }
    };
    
    // Registrar manipulador de mensagens
    window.addEventListener('message', handleParentMessages);
    
    // Enviar altura inicial após renderização completa
    setTimeout(sendHeightToParent, 100);
    
    // Enviar notificação quando o formulário estiver pronto
    if (!isFormLoading && form) {
      setTimeout(notifyLoadedToParent, 200);
    }
    
    // Enviar notificação de erro se houver
    if (formError) {
      setTimeout(() => notifyErrorToParent(formError.message || "Erro ao carregar o formulário"), 300);
    }
    
    // Enviar quando tamanho mudar
    window.addEventListener('resize', sendHeightToParent);
    
    // Verificar novamente após 500ms e 1s (para imagens e conteúdo assíncrono)
    setTimeout(sendHeightToParent, 500);
    setTimeout(sendHeightToParent, 1000);
    
    return () => {
      window.removeEventListener('resize', sendHeightToParent);
      window.removeEventListener('message', handleParentMessages);
    };
  }, [isEmbedded, form, id, isFormLoading, formError]);

  // Componente melhorado para exibir o erro
  const renderErrorState = () => {
  return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className={`max-w-md w-full ${currentTheme.mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg p-6 shadow-md`}>
          <div className="text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${currentTheme.mode === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-6 w-6 ${currentTheme.mode === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              </div>
            <h2 className={`mt-4 text-lg font-medium ${currentTheme.colors.text}`}>
              Erro ao carregar o formulário
            </h2>
            <p className={`mt-2 ${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {formError?.message || "Não foi possível carregar o formulário. Verifique o ID e tente novamente."}
            </p>
            
            <div className={`mt-6 pt-4 border-t ${currentTheme.mode === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <p className={`${currentTheme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} text-sm font-medium mb-2`}>
                Possíveis causas:
              </p>
              <ul className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm list-disc pl-5 text-left space-y-1`}>
                <li>O ID do formulário não existe ou foi excluído</li>
                <li>O ID foi digitado incorretamente</li>
                <li>Problema temporário de conexão</li>
                    </ul>
              
              <div className={`mt-4 p-3 ${currentTheme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-md border text-left`}>
                <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs mb-1`}>
                  ID do formulário usado:
                </p>
                      <div className="flex items-center gap-2">
                  <code className={`${currentTheme.mode === 'dark' ? 'bg-gray-700 text-amber-400' : 'bg-gray-100 text-amber-600'} rounded px-2 py-1 text-xs flex-1 overflow-auto`}>
                    {id}
                  </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(id || "");
                            toast({
                              title: "ID copiado",
                              description: "ID do formulário copiado para a área de transferência",
                              variant: "default",
                            });
                          }}
                    className={`text-xs ${currentTheme.colors.primary} hover:opacity-80`}
                        >
                    Copiar
                        </button>
                      </div>
                    </div>
            </div>
            
            <div className="mt-6 flex gap-3 justify-center">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className={`${currentTheme.mode === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Tentar novamente
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={() => window.history.back()}
                className={currentTheme.colors.button}
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Effect para monitorar o estado de conexão e reiniciar consultas quando ficar online
  useEffect(() => {
    // Manipulador para quando o navegador ficar online
    const handleOnline = () => {
      console.log("🌐 Conexão de internet restabelecida. Recarregando dados...");
      
      // Mostrar toast informando o usuário
      toast({
        title: "Conexão restabelecida",
        description: "Recarregando formulário...",
      });
      
      // Invalidar o cache e forçar recarga dos dados do formulário
      queryClient.invalidateQueries({
        queryKey: ["form", id],
      });
    };
    
    // Manipulador para quando o navegador ficar offline
    const handleOffline = () => {
      console.log("📡 Conexão de internet perdida");
      
      // Mostrar toast informando o usuário sobre a perda de conexão
      toast({
        title: "Sem conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      });
    };
    
    // Registrar os event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Limpar os event listeners quando o componente for desmontado
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id, queryClient, toast]);

  // Adicionar este useEffect para detectar dispositivos móveis
  useEffect(() => {
    // Detectar se o dispositivo é móvel
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Verificar se é um dispositivo móvel pelo user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Verificar se é um dispositivo móvel pelo tamanho da tela
      const isMobileSize = window.innerWidth <= 768;
      
      return mobileRegex.test(userAgent) || isMobileSize;
    };
    
    // Definir o estado
    setIsMobileDevice(checkIfMobile());
    
    // Atualizar o estado quando a janela for redimensionada
    const handleResize = () => {
      setIsMobileDevice(checkIfMobile());
    };
    
    // Registrar o listener para redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Log para depuração
    if (isDebugMode) {
      console.log("📱 Dispositivo móvel detectado:", checkIfMobile());
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isDebugMode]);

  // Adicionar uma função utilitária para extrair o tenant_id de forma segura
  const extractTenantId = async (formId: string | undefined): Promise<string | undefined> => {
    if (!formId) return undefined;
    
    try {
      // Tentar extrair de forma segura
      const { data, error } = await supabase
        .from("forms")
        .select("user_id") // user_id é geralmente usado como tenant_id
        .eq("id", formId)
        .single();
        
      if (error) {
        console.warn("Erro ao buscar tenant_id do formulário:", error);
        return undefined;
      }
      
      if (data && 'user_id' in data) {
        return data.user_id as string;
      }
      
      return undefined;
    } catch (e) {
      console.error("Erro ao extrair tenant_id:", e);
      return undefined;
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col", 
      isEmbedded ? "" : "p-2 sm:p-4 md:p-6"
    )}>
      {isFormLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className={`h-8 w-8 animate-spin ${currentTheme.colors.text}`} />
            <p className={`mt-4 ${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              Carregando formulário...
                    </p>
                  </div>
        </div>
      ) : formError ? (
        renderErrorState()
      ) : (
        <div className={isEmbedded || isMobileDevice 
          ? "max-w-full" 
          : "max-w-6xl mx-auto"
        }>
          <div className={isEmbedded || isMobileDevice
            ? "" 
            : "grid grid-cols-1 lg:grid-cols-2 gap-8"
          }>
            {/* Coluna do Formulário - sempre visível */}
            <div className={`${currentTheme.mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl sm:rounded-2xl shadow-md border p-4 sm:p-6 md:p-8`}>
              {/* Conteúdo do formulário */}
              {showSuccess ? (
                // Estado de sucesso
                <div className="py-8 text-center">
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${currentTheme.mode === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                    <Check className={`h-6 w-6 ${currentTheme.mode === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <h1 className={`mt-4 text-2xl font-semibold ${currentTheme.colors.text}`}>
                    Formulário Enviado com Sucesso!
                  </h1>
                  <p className={`mt-2 ${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Obrigado por completar o formulário! Suas respostas foram enviadas com sucesso.
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => {
                        setShowSuccess(false);
                        setFormResponses({});
                        setCurrentStep(1);
                      }}
                    >
                      Voltar para o Início
                    </Button>
                  </div>
              </div>
            ) : !form?.fields || form.fields.length === 0 ? (
                // Estado de formulário vazio
              <div className={`${currentTheme.mode === 'dark' ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-100 border-amber-300'} border rounded-lg p-6 text-center`}>
                  <p className={`${currentTheme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-2`}>
                    Formulário vazio
                  </p>
                  <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Este formulário não possui campos configurados.
                  </p>
                  <p className={`${currentTheme.mode === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs mt-4`}>
                    ID do formulário: {id}
                  </p>
              </div>
            ) : (
                // Formulário normal
              <>
                {/* Indicadores de passo - adaptar para modo embed se necessário */}
                {(!isEmbedded || totalSteps > 1) && renderStepIndicators()}

            {/* Campos do Formulário */}
            <div className="space-y-6">
                  {getCurrentStepFields().length > 0 ? (
                    <>
                      {getCurrentStepFields().map(renderField)}
                      {renderStepDivider()}
                    </>
                  ) : (
                    <div className={`${currentTheme.mode === 'dark' ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-100 border-amber-300'} border rounded-lg p-4 text-center`}>
                      <p className={`${currentTheme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} text-sm`}>Nenhum campo disponível neste passo</p>
                    </div>
                  )}
            </div>

            {/* Botões de Navegação */}
            <div className="flex justify-between pt-6">
                  {hasStepDividers && !isFirstStep && (
                <Button 
                  onClick={prevStep} 
                  variant="outline"
                      className={`min-w-[120px] h-11 flex items-center justify-center gap-2 ${currentTheme.mode === 'dark' ? 'text-gray-300 border-gray-700 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 border-gray-300 bg-gray-100 hover:bg-gray-200'}`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Anterior</span>
                </Button>
              )}
                  
                  {hasStepDividers && !isLastStep ? (
                <Button 
                  onClick={nextStep} 
                      className={`min-w-[120px] h-11 ${currentTheme.colors.button} text-white flex items-center justify-center gap-2 transition-all duration-200 ${!isFirstStep ? 'ml-auto' : 'w-full'}`}
                >
                  <span>Próximo</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                      className={`min-w-[120px] h-11 ${currentTheme.colors.button} text-white flex items-center justify-center ${hasStepDividers && !isFirstStep ? 'ml-auto' : 'w-full'}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                  <span>Enviar</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                        </>
                      )}
                </Button>
              )}
            </div>
              </>
            )}
          </div>

            {/* Coluna da Imagem - ocultar no modo embed e em dispositivos móveis */}
            {!isEmbedded && !isMobileDevice && (
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <img
                src={form?.image_url || "/form-image.svg"}
                alt="Imagem do Formulário"
                  className={`w-full h-auto rounded-2xl object-cover shadow-lg border ${currentTheme.mode === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}
                onError={(e) => {
                  console.error("Erro ao carregar imagem:", e);
                  e.currentTarget.src = "/form-image.svg";
                }}
              />
                <div className={`mt-6 ${currentTheme.mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-md border`}>
                  <h3 className={`text-lg font-semibold ${currentTheme.colors.text} mb-2`}>
                  Sobre este formulário
                </h3>
                  <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  Complete todos os campos necessários. Suas respostas são importantes
                  para nós.
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      )}

      {/* Card de Sucesso */}
      <SuccessCard 
        open={showSuccess} 
        onOpenChange={setShowSuccess}
      />
    </div>
  );
};

export default ViewForm;

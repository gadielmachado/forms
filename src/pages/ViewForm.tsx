import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Clock } from "lucide-react";
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

  // Use isDebugMode para exibir informações diagnósticas no console
  const isDebugMode = true;

  // Função utilitária para validar UUID
  const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Effect para detectar e configurar tenant_id da URL se presente
  useEffect(() => {
    // Verificar se há tenant_id na URL
    const urlTenantId = new URLSearchParams(location.search).get('tenant_id');
    
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
    const urlThemeId = new URLSearchParams(location.search).get('theme_id');
    if (urlThemeId) {
      // Atualizar o tema no localStorage para garantir consistência
      localStorage.setItem('soren-forms-theme', urlThemeId);
      console.log("🎨 Aplicando tema da URL:", urlThemeId);
    }
  }, [location.search, currentTenant]);

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

      // Buscar o formulário apenas pelo ID, sem filtrar por tenant_id
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("[ViewForm] Erro ao buscar formulário:", error);
        throw error;
      }

      if (!data) {
        console.error(`[ViewForm] Formulário não encontrado com ID: ${id}`);
        throw new Error(`Formulário não encontrado com ID: ${id}`);
      }

      console.log("[ViewForm] Formulário encontrado:", data);
      return data as FormType;
    },
    retry: 1,
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
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('admin_email')
        .eq('id', 1)
        .single();

      if (settingsError) {
        console.error('Erro ao buscar configurações:', settingsError);
        toast({
          title: "Aviso",
          description: "Suas respostas foram salvas, mas não foi possível enviar notificação por email.",
          variant: "destructive",
        });
        
        setFormResponses({});
        setCurrentStep(1);
        setShowSuccess(true);
        return;
      }

      const adminEmail = settings?.admin_email;
      console.log('Email do administrador:', adminEmail);

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

  return (
    <div className={isEmbedded 
      ? `${currentTheme.mode === 'dark' ? 'bg-gray-950' : 'bg-gray-100'} py-4 px-4 rounded-xl` // Layout mais compacto para o modo incorporado
      : `min-h-screen ${currentTheme.mode === 'dark' ? 'bg-gray-950' : 'bg-gray-100'} py-8 px-4 sm:px-6 lg:px-8`
    }>
      <div className={isEmbedded ? "max-w-full" : "max-w-6xl mx-auto"}>
        {/* No modo embed, não usamos grid e omitimos a coluna da imagem */}
        <div className={isEmbedded 
          ? "" 
          : "grid grid-cols-1 lg:grid-cols-2 gap-8"
        }>
          {/* Coluna do Formulário - sempre visível */}
          <div className={`${currentTheme.mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-md border p-8`}>
            {isFormLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className={`h-8 w-8 animate-spin ${currentTheme.colors.text}`} />
                <p className={`mt-4 ${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Carregando formulário...</p>
              </div>
            ) : formError ? (
              <div className={`${currentTheme.mode === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-100 border-red-300'} border rounded-lg p-6 text-center`}>
                <p className={`${currentTheme.mode === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`}>Erro ao carregar o formulário</p>
                <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{formError.message}</p>
                {isEmbedded && (
                  <div className={`mt-4 pt-4 border-t ${currentTheme.mode === 'dark' ? 'border-red-800/50' : 'border-red-300/50'}`}>
                    <p className={`${currentTheme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} text-sm font-medium mb-2`}>Possíveis causas:</p>
                    <ul className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm list-disc pl-5 space-y-1`}>
                      <li>O ID do formulário não existe no banco de dados</li>
                      <li>O ID foi digitado incorretamente no código de incorporação</li>
                      <li>O formulário pode ter sido excluído ou desativado</li>
                    </ul>
                    <div className={`mt-3 p-2 ${currentTheme.mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-md border`}>
                      <p className={`${currentTheme.mode === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs mb-1`}>ID do formulário usado:</p>
                      <div className="flex items-center gap-2">
                        <code className={`${currentTheme.mode === 'dark' ? 'bg-gray-800 text-amber-500' : 'bg-gray-100 text-amber-600'} rounded px-2 py-1 text-xs overflow-auto`}>{id}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(id || "");
                            toast({
                              title: "ID copiado",
                              description: "ID do formulário copiado para a área de transferência",
                              variant: "default",
                            });
                          }}
                          className={`text-xs ${currentTheme.colors.text} hover:opacity-80`}
                        >
                          Copiar ID
                        </button>
                      </div>
                    </div>
                    <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs mt-4`}>
                      Verifique se está usando o ID correto e tente novamente.
                    </p>
                  </div>
                )}
              </div>
            ) : !form?.fields || form.fields.length === 0 ? (
              <div className={`${currentTheme.mode === 'dark' ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-100 border-amber-300'} border rounded-lg p-6 text-center`}>
                <p className={`${currentTheme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-2`}>Formulário vazio</p>
                <p className={`${currentTheme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Este formulário não possui campos configurados.</p>
                <p className={`${currentTheme.mode === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs mt-4`}>ID do formulário: {id}</p>
              </div>
            ) : (
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

          {/* Coluna da Imagem - ocultar no modo embed */}
          {!isEmbedded && (
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

      {/* Card de Sucesso */}
      <SuccessCard 
        open={showSuccess} 
        onOpenChange={setShowSuccess}
      />
    </div>
  );
};

export default ViewForm;

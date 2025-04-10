import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Plus, Search, FileText, Check, 
  FileSearch, Calendar, Layers, X, 
  FileSpreadsheet, FilePlus, FileEdit, Download,
  Trash2, FileQuestion, Sparkles,
  Palette, Globe, Brain, Stethoscope, CalendarDays, 
  Target, ClipboardList, HardHat, MousePointerClick, 
  Phone, LineChart, ShoppingCart, GraduationCap, Briefcase, Users, ThumbsUp, Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormCard from "@/components/forms/FormCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateProposalFromText } from "@/lib/textGenerator";
import { templateMap } from "@/lib/formTemplates";
import { useTenant } from "@/contexts/TenantContext";

interface FormType {
  id: string;
  name: string;
  fields: any[];
  created_at: string;
  updated_at: string;
  user_id: string;
  image_url: string;
}

interface SegmentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

interface FormResponseType {
  id: string;
  created_at: string;
  response_data: Record<string, string>;
  form_id: string;
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  { id: 'design', name: 'Design', icon: <Palette className="h-4 w-4" /> },
  { id: 'webdesign', name: 'Web Design', icon: <Globe className="h-4 w-4" /> },
  { id: 'psicologo', name: 'Psicólogo', icon: <Brain className="h-4 w-4" /> },
  { id: 'medico', name: 'Médico', icon: <Stethoscope className="h-4 w-4" /> },
  { id: 'eventos', name: 'Eventos', icon: <CalendarDays className="h-4 w-4" /> },
  { id: 'pesquisa', name: 'Pesquisa de Satisfação', icon: <Target className="h-4 w-4" /> },
  { id: 'briefing', name: 'Briefing', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'engenharia', name: 'Engenharia', icon: <HardHat className="h-4 w-4" /> },
  { id: 'leads', name: 'Captação de Leads', icon: <MousePointerClick className="h-4 w-4" /> },
  { id: 'contato', name: 'Formulário de Contato', icon: <Phone className="h-4 w-4" /> },
  { id: 'agendamento', name: 'Agendamento', icon: <Calendar className="h-4 w-4" /> },
];

// Renomeado de "segments" para "formTypes" para refletir a nova nomenclatura
const formTypes: SegmentOption[] = [
  {
    id: "marketing",
    name: "Marketing",
    icon: <LineChart className="h-5 w-5" />,
    description: "Formulários para campanhas de marketing e pesquisas"
  },
  {
    id: "captacao-leads",
    name: "Captação de Leads",
    icon: <Users className="h-5 w-5" />,
    description: "Formulários para captar potenciais clientes interessados"
  },
  {
    id: "pesquisa-satisfacao",
    name: "Pesquisa de Satisfação",
    icon: <ThumbsUp className="h-5 w-5" />,
    description: "Formulários para avaliar a satisfação de clientes"
  },
  {
    id: "call-reuniao",
    name: "Call/Reunião",
    icon: <Video className="h-5 w-5" />,
    description: "Formulários para agendamento de calls e reuniões virtuais"
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: <ShoppingCart className="h-5 w-5" />,
    description: "Formulários para lojas online e vendas"
  },
  {
    id: "educacao",
    name: "Educação",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Formulários para instituições educacionais"
  },
  {
    id: "saude",
    name: "Saúde",
    icon: <Stethoscope className="h-5 w-5" />,
    description: "Formulários para clínicas e serviços de saúde"
  },
  {
    id: "eventos",
    name: "Eventos",
    icon: <Calendar className="h-5 w-5" />,
    description: "Formulários para inscrição e organização de eventos"
  },
  {
    id: "servicos",
    name: "Serviços",
    icon: <Briefcase className="h-5 w-5" />,
    description: "Formulários para prestação de serviços diversos"
  },
  {
    id: "briefing",
    name: "Briefing",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Formulários para coleta de informações e requisitos de projetos"
  }
];

export default function SavedForms() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [formToDelete, setFormToDelete] = useState<FormType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGenAIDialogOpen, setIsGenAIDialogOpen] = useState(false);
  const [generationType, setGenerationType] = useState<"briefing" | "proposta" | "relatorio" | null>(null);
  const [isDocumentEditorOpen, setIsDocumentEditorOpen] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSegmentSelectorOpen, setIsSegmentSelectorOpen] = useState(false);
  const [segmentSearchQuery, setSegmentSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<FormResponseType | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponseType[]>([]);
  const [isResponseSelectorOpen, setIsResponseSelectorOpen] = useState(false);
  const [showPageLayout, setShowPageLayout] = useState(false);
  // Adicione este estado para controlar o carregamento da exclusão
  const [isDeletingForm, setIsDeletingForm] = useState(false);
  // Estados necessários para a função handleGenerateWithAI
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  // Adicione estas constantes para dimensões A4
  const A4_WIDTH_PX = 794;  // Largura A4 em 96dpi
  const A4_HEIGHT_PX = 1123; // Altura A4 em 96dpi
  const PAGE_MARGIN_PX = 40; // Margem em px

  // Buscar formulários - CRÍTICO: Filtrar por tenant_id para garantir isolamento de dados
  const { data: forms = [], isLoading, refetch } = useQuery({
    queryKey: ["forms", currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) {
        console.warn("Nenhum tenant selecionado, retornando lista vazia");
        return [];
      }

      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("tenant_id", currentTenant.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar formulários",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      console.log(`Carregados ${data?.length || 0} formulários para o tenant ${currentTenant.id}`);
      return data || [];
    },
    enabled: !!currentTenant?.id // Só executa a query quando há um tenant selecionado
  });

  // Filtrar formulários com base na busca
  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manipuladores de formulários
  const handleDelete = async (form: FormType) => {
    try {
      setIsDeletingForm(true);
      
      // 1. Primeiro, feche o diálogo
      setIsDeleteDialogOpen(false);
      
      // 2. Pequena pausa para garantir que o diálogo seja fechado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3. Execute a exclusão no banco de dados
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", form.id);

      if (error) throw error;

      // 4. Apenas após a conclusão bem-sucedida, recarregue os dados
      await refetch();

      // 5. Notificação de sucesso
      toast({
        title: "Formulário excluído",
        description: "O formulário foi excluído com sucesso.",
      });

    } catch (error: any) {
      console.error("Erro ao excluir formulário:", error);
      toast({
        title: "Erro ao excluir formulário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Garanta que o estado de exclusão seja sempre redefinido
      setIsDeletingForm(false);
      setFormToDelete(null);
    }
  };

  const handleEdit = (form: any) => {
    // Log para debug
    console.log("Editando formulário com ID:", form.id);
    
    // Redireciona para a rota de edição (a página raiz é a de criação de formulário)
    navigate(`/`, { state: { editingForm: form } });
  };

  const handleView = (form: any) => {
    // Log para debug
    console.log("Visualizando formulário com ID:", form.id);
    
    // Função mais robusta para detectar dispositivos móveis
    const isMobileDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Verificar se é um dispositivo móvel pelo user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Verificar se é um dispositivo móvel pelo tamanho da tela
      const isMobileSize = window.innerWidth <= 768;
      
      return mobileRegex.test(userAgent) || isMobileSize;
    };
    
    // Obter o tema atual do localStorage para garantir que será usado no formulário visualizado
    const currentThemeId = localStorage.getItem('soren-forms-theme');
    
    // Construir URL base - usar URL completa para evitar problemas com path relativo
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/${form.id}`;
    
    // Adicionar parâmetros à URL usando URLSearchParams
    const params = new URLSearchParams();
    
    // Adicionar tenant_id se disponível
    if (currentTenant?.id) {
      params.append('tenant_id', currentTenant.id);
    }
    
    // Adicionar theme_id se disponível
    if (currentThemeId) {
      params.append('theme_id', currentThemeId);
    }
    
    // Montar URL final
    const finalUrl = params.toString() 
      ? `${formUrl}?${params.toString()}`
      : formUrl;
    
    console.log("Abrindo formulário com URL:", finalUrl);
    
    // Copiar link para a área de transferência
    navigator.clipboard.writeText(finalUrl)
      .then(() => {
        // Notificar o usuário
        toast({
          title: "Link copiado!",
          description: "O link do formulário foi copiado para a área de transferência.",
          variant: "default",
        });
      })
      .catch(err => {
        console.error("Erro ao copiar link:", err);
      });
    
    try {
      // Verificar se estamos em dispositivo móvel
      const isMobile = isMobileDevice();
      
      if (isMobile) {
        // Em dispositivos móveis, navegar diretamente na mesma janela
        window.location.href = finalUrl;
      } else {
        // Em desktop, abrir em uma nova janela com configurações específicas
        const windowFeatures = 'width=1024,height=768,resizable=yes,scrollbars=yes,status=yes';
        const newWindow = window.open(finalUrl, `formView_${form.id}`, windowFeatures);
        
        // Verificar se a janela foi bloqueada pelo navegador
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          toast({
            title: "Popup bloqueado",
            description: "Seu navegador bloqueou a abertura do formulário. Por favor, permita popups para este site.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao abrir formulário:", error);
      toast({
        title: "Erro ao abrir formulário",
        description: "Não foi possível abrir o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleViewResponses = (form: any) => {
    // Log para debug
    console.log("Visualizando respostas do formulário com ID:", form.id);
    
    // Redireciona para a rota de respostas conforme definida no App.tsx
    navigate(`/forms/${form.id}/responses`);
  };

  const handleDownloadSheet = async (form: FormType) => {
    // Implementação atual de download
  };

  const handleDeleteClick = (form: FormType) => {
    setFormToDelete(form);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (formToDelete) {
      handleDelete(formToDelete);
    }
  };

  // Manipuladores para geração com IA
  const handleGerarComIA = () => {
    setIsGenAIDialogOpen(true);
  };

  const handleGerarBriefing = () => {
    setGenerationType("briefing");
    setIsGenAIDialogOpen(false);
    setSearchQuery("");
    setSelectedForm(null);
    setIsSearchOpen(true);
  };

  const handleGerarProposta = () => {
    setGenerationType("proposta");
    setIsGenAIDialogOpen(false);
    setSearchQuery("");
    setSelectedForm(null);
    setSelectedResponse(null);
    setIsSearchOpen(true);
  };

  const handleGerarRelatorio = () => {
    setGenerationType("relatorio");
    setIsGenAIDialogOpen(false);
    setSearchQuery("");
    setSelectedForm(null);
    setIsSearchOpen(true);
  };

  // Manipuladores para seleção e geração
  const handleSelectForm = (form: FormType) => {
    setSelectedForm(form);
    if (generationType === "proposta") {
      fetchFormResponses(form.id);
    }
  };

  const handleGenerate = async () => {
    if (!selectedForm) return;
    
    setIsGeneratingContent(true);
    
    try {
      // Buscar todas as respostas do formulário selecionado
      const { data: responses, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', selectedForm.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Recuperadas ${responses?.length || 0} respostas para o formulário ${selectedForm.id}`);
      
      let templateContent = "";
      let title = "";
      
      // Gera conteúdo diferente com base no tipo de documento
      if (generationType === "briefing") {
        title = `Briefing - ${selectedForm.name}`;
        templateContent = gerarModeloBriefing(selectedForm, responses || []);
      } else if (generationType === "proposta") {
        title = `Proposta - ${selectedForm.name}`;
        templateContent = gerarModeloProposta(selectedForm, responses || []);
      } else if (generationType === "relatorio") {
        title = `Relatório - ${selectedForm.name}`;
        templateContent = gerarModeloRelatorio(selectedForm, responses || []);
      }
      
      // Define o conteúdo e título do documento
      setDocumentContent(templateContent);
      setDocumentTitle(title);
      
      // Fecha o diálogo de busca e abre o editor
      setIsSearchOpen(false);
      setIsDocumentEditorOpen(true);
      
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
      toast({
        title: "Erro ao gerar documento",
        description: "Ocorreu um erro ao processar as informações do formulário.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Funções para gerar os modelos de documento (substitua com sua lógica real)
  const gerarModeloBriefing = (form: FormType, responses: any[]) => {
    // Exemplo simplificado - na prática você usaria as respostas reais para popular o modelo
    return `# Briefing: ${form.name}
    
## Informações do Cliente
**Nome do Projeto:** ${form.name}
**Data de Criação:** ${new Date(form.created_at).toLocaleDateString('pt-BR')}

## Objetivos do Projeto
${form.fields.map(field => `### ${field.label || 'Campo sem nome'}
${responses[0]?.[field.name] || 'Sem resposta'}`).join('\n\n')}

## Público-Alvo
- Defina aqui o público-alvo com base nas respostas

## Prazo
- Estabeleça o prazo com base nas informações coletadas

## Orçamento
- Defina o orçamento baseado nas necessidades identificadas

---
*Este briefing foi gerado automaticamente com base nas respostas do formulário ${form.name}. Edite conforme necessário para atender às necessidades específicas do projeto.*`;
  };
  
  const gerarModeloProposta = (form: FormType, responses: any[]) => {
    return `# Proposta Comercial: ${form.name}
    
## Apresentação
**Projeto:** ${form.name}
**Data:** ${new Date().toLocaleDateString('pt-BR')}

## Escopo do Projeto
${form.fields.map(field => `### ${field.label || 'Campo sem nome'}
${responses[0]?.[field.name] || 'Sem resposta'}`).join('\n\n')}

## Metodologia de Trabalho
- Descreva a metodologia a ser utilizada

## Cronograma
- Fase 1: Planejamento - X dias
- Fase 2: Desenvolvimento - Y dias
- Fase 3: Testes e Ajustes - Z dias
- Fase 4: Entrega Final - Data prevista

## Investimento
- Opção 1: R$ X
- Opção 2: R$ Y
- Opção 3: R$ Z

## Condições Comerciais
- Formas de pagamento
- Prazos de entrega
- Termos e condições

---
*Esta proposta foi gerada automaticamente com base nas respostas do formulário ${form.name}. Edite os valores e condições conforme necessário para atender às especificações do projeto.*`;
  };
  
  const gerarModeloRelatorio = (form: FormType, responses: FormResponseType[]) => {
    // Se não há respostas, criar um relatório vazio
    if (!responses.length) {
      return `<div>
        <h1 style="color: #4361ee; font-size: 28px; margin-bottom: 18px;">Relatório Analítico: ${form.name}</h1>
        
        <h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Resumo Executivo</h2>
        <p>Este formulário ainda não possui respostas registradas.</p>
        
        <h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Campos do Formulário</h2>
        <ul>
          ${form.fields.map(field => `<li><strong>${field.label || 'Campo sem nome'}</strong> (${field.type})</li>`).join('')}
        </ul>
      </div>`;
    }

    // Conteúdo HTML com estilos embutidos para o relatório
    let content = `<div>
      <h1 style="color: #4361ee; font-size: 28px; margin-bottom: 18px;">Relatório Analítico: ${form.name}</h1>
      
      <h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Resumo Executivo</h2>
      <p>Este relatório apresenta uma análise das informações coletadas através do formulário "${form.name}".</p>
      <p><strong>Total de respostas:</strong> ${responses.length}</p>
      <p><strong>Primeira resposta:</strong> ${new Date(responses[responses.length-1].created_at).toLocaleDateString('pt-BR')}</p>
      <p><strong>Última resposta:</strong> ${new Date(responses[0].created_at).toLocaleDateString('pt-BR')}</p>
      
      <h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Resumo das Respostas</h2>`;

    // Obter todos os campos únicos de todas as respostas
    const allFields = new Set<string>();
    responses.forEach(response => {
      Object.keys(response.response_data).forEach(key => {
        allFields.add(key);
      });
    });

    // Análise detalhada de cada campo
    content += `<h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Análise Detalhada por Campo</h2>`;

    Array.from(allFields).forEach(field => {
      content += `<h3 style="color: #4895ef; font-size: 18px; margin-top: 20px; margin-bottom: 10px;">${field}</h3>
      <ul style="margin-bottom: 16px; margin-left: 18px;">`;
      
      // Listar todas as respostas para este campo
      responses.forEach((response, index) => {
        if (response.response_data[field]) {
          content += `<li style="margin-bottom: 8px;">
            <strong>Resposta ${index + 1}</strong> (${new Date(response.created_at).toLocaleDateString('pt-BR')}): 
            ${response.response_data[field]}
          </li>`;
        }
      });
      
      content += `</ul>`;
    });

    // Conclusão e rodapé
    content += `<h2 style="color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Conclusões</h2>
      <p>Este relatório foi gerado automaticamente com base nas respostas coletadas no formulário "${form.name}".</p>
      <p>A análise detalhada dos dados e a interpretação dos resultados podem ser personalizadas conforme necessário.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 14px;">
        <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')} por Soren Forms</p>
      </div>
    </div>`;

    return content;
  };

  // Helpers para a interface de busca
  const getSearchTitle = () => {
    switch (generationType) {
      case "briefing":
        return "Gerar Briefing";
      case "proposta":
        return "Gerar Proposta";
      case "relatorio":
        return "Gerar Relatório";
      default:
        return "Selecionar Formulário";
    }
  };

  const getSearchDescription = () => {
    switch (generationType) {
      case "briefing":
        return "Selecione o formulário que deseja utilizar para gerar o briefing.";
      case "proposta":
        return "Selecione o formulário que deseja utilizar para gerar a proposta.";
      case "relatorio":
        return "Selecione o formulário que deseja utilizar para gerar o relatório.";
      default:
        return "Escolha um formulário para continuar.";
    }
  };

  const getActionIcon = () => {
    switch (generationType) {
      case "briefing":
        return <FileEdit className="h-5 w-5" />;
      case "proposta":
        return <FilePlus className="h-5 w-5" />;
      case "relatorio":
        return <FileSpreadsheet className="h-5 w-5" />;
      default:
        return <FileQuestion className="h-5 w-5" />;
    }
  };

  const getActionLabel = () => {
    switch (generationType) {
      case "briefing":
        return "Gerar Briefing";
      case "proposta":
        return "Gerar Proposta";
      case "relatorio":
        return "Gerar Relatório";
      default:
        return "Continuar";
    }
  };

  // Resolvendo problemas de tipo ao passar os parâmetros
  // Para o erro de incompatibilidade de tipos com Json vs array[]
  // Adicione essa função para fazer o cast seguro
  const formatFormForComponents = (form: any): FormType => {
    // Garante que o campo fields seja tratado como array
    return {
      id: form.id,
      name: form.name,
      fields: Array.isArray(form.fields) ? form.fields : [],
      created_at: form.created_at,
      updated_at: form.updated_at || form.created_at,
      user_id: form.user_id || "",
      image_url: form.image_url
    };
  };

  const handleGerarFormulario = () => {
    setIsGenAIDialogOpen(false);
    setIsSegmentSelectorOpen(true);
  };

  const handleSegmentSelect = async (segment: SegmentOption) => {
    console.log("Segmento selecionado:", segment);
    
    // Verificar se existe um tenant selecionado
    if (!currentTenant) {
      toast({
        title: "Erro",
        description: "Selecione uma organização antes de criar um formulário",
        variant: "destructive",
      });
      setIsSegmentSelectorOpen(false);
      return;
    }

    // Verificar se existe template para o segmento
    if (!templateMap[segment.id]) {
      toast({
        title: "Erro",
        description: "Template não encontrado para este tipo de formulário",
        variant: "destructive",
      });
      setIsSegmentSelectorOpen(false);
      return;
    }

    // Obter template do segmento selecionado
    const template = templateMap[segment.id];
    
    // Mostrar toast de carregamento
    toast({
      title: "Criando formulário",
      description: `Gerando formulário de ${segment.name}...`,
    });

    try {
      // Verificar se o usuário está logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      // Preparar dados do formulário
      const formData = {
        name: template.name,
        fields: template.fields,
        user_id: user.id,
        image_url: null,
        tenant_id: currentTenant.id
      };
      
      // Salvar o formulário no Supabase
      const { data, error } = await supabase
        .from("forms")
        .insert(formData)
        .select("id")
        .single();
        
      if (error) {
        throw error;
      }
      
      // Atualizar a lista de formulários
      await refetch();
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Sucesso",
        description: `Formulário de ${segment.name} criado com sucesso!`,
      });
      
      // Redirecionar para a página de formulários salvos em vez de para a edição
      navigate("/forms");
      
    } catch (error: any) {
      console.error("Erro ao criar formulário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar formulário",
        variant: "destructive",
      });
    } finally {
      // Fechar o diálogo
      setIsSegmentSelectorOpen(false);
    }
  };

  const filteredSegments = formTypes.filter(segment =>
    segment.name.toLowerCase().includes(segmentSearchQuery.toLowerCase())
  );

  // Adicione essa nova função para buscar as respostas do formulário
  const fetchFormResponses = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFormResponses(data || []);
      setIsSearchOpen(false);
      setIsResponseSelectorOpen(true);
    } catch (error) {
      console.error("Erro ao buscar respostas:", error);
      toast({
        title: "Erro ao carregar respostas",
        description: "Não foi possível carregar as respostas do formulário",
        variant: "destructive",
      });
    }
  };

  // Adicione essa função para selecionar a resposta
  const handleSelectResponse = (response: FormResponseType) => {
    setSelectedResponse(response);
    setIsResponseSelectorOpen(false);
    
    // Gerar conteúdo baseado nas respostas reais do usuário
    const templateContent = gerarConteudoComRespostas(selectedForm!, response);
    setDocumentContent(templateContent);
    setDocumentTitle(`Proposta - ${selectedForm?.name}`);
    setIsDocumentEditorOpen(true);
  };

  // Adicione esta nova função para formatar as respostas do usuário de forma adequada
  const gerarConteudoComRespostas = (form: FormType, response: FormResponseType) => {
    // Cabeçalho da proposta
    let content = `<h1>Proposta Comercial: ${form.name}</h1>
    
    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>`;

    // Informações do cliente baseadas nas respostas
    content += `<h2>Informações do Cliente</h2>`;
    
    // Busca por campos comuns de identificação do cliente (nome, empresa, etc.)
    const camposPrioritarios = ['nome', 'name', 'empresa', 'company', 'email', 'telefone', 'phone'];
    const camposExibidos = new Set();
    
    // Primeiro exibe os campos prioritários
    camposPrioritarios.forEach(campo => {
      Object.entries(response.response_data).forEach(([key, value]) => {
        if (key.toLowerCase().includes(campo) && !camposExibidos.has(key)) {
          content += `<p><strong>${key}:</strong> ${value}</p>`;
          camposExibidos.add(key);
        }
      });
    });
    
    // Seção para todas as respostas do formulário
    content += `<h2>Detalhes do Projeto</h2>`;
    
    // Exibe todos os campos restantes
    Object.entries(response.response_data).forEach(([key, value]) => {
      if (!camposExibidos.has(key)) {
        content += `<p><strong>${key}:</strong> ${value}</p>`;
      }
    });
    
    // Seções adicionais para a proposta
    content += `
    <h2>Escopo do Trabalho</h2>
    <p>Com base nas informações fornecidas, propomos o seguinte escopo de trabalho:</p>
    <ul>
      <li>Análise detalhada das necessidades do cliente</li>
      <li>Desenvolvimento da solução personalizada</li>
      <li>Implementação e testes</li>
      <li>Treinamento e suporte</li>
    </ul>

    <h2>Cronograma</h2>
    <p>O projeto será executado conforme o seguinte cronograma estimado:</p>
    <ul>
      <li>Fase 1: Planejamento - 5 dias úteis</li>
      <li>Fase 2: Desenvolvimento - 15 dias úteis</li>
      <li>Fase 3: Testes e ajustes - 5 dias úteis</li>
      <li>Fase 4: Entrega e treinamento - 5 dias úteis</li>
    </ul>

    <h2>Investimento</h2>
    <p>O valor do investimento para este projeto é:</p>
    <p><strong>Total:</strong> R$ 0,00</p>
    <p><em>* Este valor é uma estimativa inicial e pode ser ajustado conforme definição detalhada do escopo.</em></p>

    <h2>Condições Comerciais</h2>
    <ul>
      <li>50% na aprovação da proposta</li>
      <li>30% na conclusão da fase de desenvolvimento</li>
      <li>20% na entrega final</li>
    </ul>`;

    return content;
  };

  const handleGenerateWithAI = async (documentData: any, docType: string) => {
    try {
      setIsGeneratingContent(true);
      
      // Criar um elemento temporário para extrair texto de documentContent
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = documentData.documentContent || documentContent;
      const extractedText = tempDiv.textContent || tempDiv.innerText || "";

      // Define o prompt baseado no tipo de documento
      let prompt = "";
      let systemRole = "";
      
      if (docType === "report" || generationType === "relatorio") {
        prompt = `Analise os dados abaixo e crie um relatório estruturado com resumo executivo, análise detalhada e recomendações.

Dados:
${extractedText}

Formato: HTML com títulos e subtítulos. Use tags <strong> para destacar texto em negrito, não use asteriscos (**) para formatação.`;
        systemRole = "Você é um analista de dados especializado em criar análises detalhadas de relatórios. Use sempre formatação HTML para destaque (strong, em), nunca use asteriscos ou underlines.";
      } else {
        prompt = `Crie uma proposta comercial baseada nos dados abaixo.

Dados:
${extractedText}

Formato: HTML com títulos e subtítulos. Use tags <strong> para destacar texto em negrito, não use asteriscos (**) para formatação.`;
        systemRole = "Você é um especialista em criar propostas comerciais profissionais. Use sempre formatação HTML para destaque (strong, em), nunca use asteriscos ou underlines.";
      }

      // Utilizando diretamente a API do OpenAI com uma chave temporária
      const apiUrl = '/api/openai';
      const apiKey = 'API_KEY_REMOVIDA'; // Deve ser configurada como variável de ambiente

      console.log("Enviando requisição para OpenAI diretamente");
      
      // Notificar usuário
      toast({
        title: "Processando",
        description: docType === "report" || generationType === "relatorio"
          ? "Gerando análise com IA. Isso pode levar até 60 segundos..."
          : "Gerando proposta com IA. Isso pode levar até 60 segundos...",
      });
      
      // Configuração com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
      
      try {
        // Chamada direta à API OpenAI
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemRole },
              { role: "user", content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 1500
          }),
          signal: controller.signal
        });
        
        // Limpar timeout
        clearTimeout(timeoutId);
        
        // Verificar resposta
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error?.message || `${response.status}: ${response.statusText}`;
          console.error("Erro na API OpenAI:", response.status, errorMsg);
          throw new Error(`Erro na comunicação com a API OpenAI: ${errorMsg}`);
        }

        // Processar resposta
        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error("A API retornou uma resposta inválida");
        }

        // Formatar conteúdo gerado
        let generatedContent = data.choices[0].message.content.trim();
        generatedContent = generatedContent.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
        
        // Converter asteriscos duplos para tags strong
        generatedContent = generatedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Normalizar espaçamentos excessivos
        // 1. Normalizar quebras de linha múltiplas para uma única quebra
        generatedContent = generatedContent.replace(/\n{3,}/g, '\n\n');
        
        // 2. Converter quebras de linha em tags <br> ou <p> de forma adequada
        generatedContent = generatedContent.replace(/\n{2,}/g, '</p><p>');
        generatedContent = generatedContent.replace(/\n/g, '<br>');
        
        // 3. Garantir que o conteúdo esteja dentro de tags <p> se não estiver em um bloco de texto
        if (!generatedContent.startsWith('<h1') && 
            !generatedContent.startsWith('<h2') && 
            !generatedContent.startsWith('<h3') && 
            !generatedContent.startsWith('<p') && 
            !generatedContent.startsWith('<ul') && 
            !generatedContent.startsWith('<ol') && 
            !generatedContent.startsWith('<div')) {
          generatedContent = `<p>${generatedContent}</p>`;
        }
        
        // 4. Corrigir possíveis tags <p> quebradas devido à substituição
        generatedContent = generatedContent.replace(/<\/p><p><br><\/p><p>/g, '</p><p>');
        generatedContent = generatedContent.replace(/<p><\/p>/g, '');
        
        // Aplicar estilos (usando uma classe em vez de inline style, para facilitar remoção ao criar PDF)
        const styledContent = `
<style id="document-styles">
  h1 { color: #4361ee; font-size: 28px; margin-bottom: 18px; }
  h2 { color: #3a0ca3; font-size: 22px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  h3 { color: #4895ef; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
  p { margin-bottom: 12px; line-height: 1.6; }
  ul, ol { margin-bottom: 16px; margin-left: 18px; }
  li { margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background-color: #f8f9fa; color: #4361ee; text-align: left; padding: 12px; border: 1px solid #e2e8f0; }
  td { padding: 10px; border: 1px solid #e2e8f0; }
  strong { color: #3a0ca3; }
  /* Controle de espaçamento para evitar espaços grandes entre parágrafos */
  p + p { margin-top: 0.8em; }
  p + h2, p + h3 { margin-top: 1.2em; }
  h1 + p, h2 + p, h3 + p { margin-top: 0.5em; }
</style>
${generatedContent}`;
        
        // Atualizar documento e mostrar sucesso
        setDocumentContent(styledContent);
        
        toast({
          title: docType === "report" || generationType === "relatorio" 
            ? "Análise gerada com sucesso!" 
            : "Proposta gerada com sucesso!",
          description: docType === "report" || generationType === "relatorio"
            ? "Revise e personalize a análise conforme necessário."
            : "Revise e personalize a proposta conforme necessário.",
          variant: "default",
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("A requisição excedeu o tempo limite. Tente novamente mais tarde.");
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Erro na geração:", error);
      toast({
        title: docType === "report" || generationType === "relatorio" 
          ? "Erro ao gerar análise" 
          : "Erro ao gerar proposta",
        description: error.message || "Não foi possível gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Adicione essa função para download do documento
  const handleDownloadDocument = async (type: 'pdf' | 'docx') => {
    try {
      if (!editorRef.current) {
        toast({
          title: "Erro",
          description: "Editor não encontrado",
          variant: "destructive",
        });
        return;
      }
      
      const fileName = documentTitle || "documento";
      
      if (type === 'pdf') {
        // Mostrar toast de carregamento
        toast({
          title: "Processando",
          description: "Gerando PDF, aguarde...",
        });
        
        // Obter o conteúdo HTML do editor e remover a tag style
        const contentElement = editorRef.current;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentElement.innerHTML;
        
        // Remover a tag style para evitar que apareça no PDF
        const styleElement = tempDiv.querySelector('style');
        if (styleElement) {
          styleElement.remove();
        }
        
        // Usar o conteúdo sem a tag style
        const htmlContent = tempDiv.innerHTML;
        
        // Criar novo documento PDF com orientação retrato
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        // Configurações de estilo
        const titleFontSize = 16;
        const headerFontSize = 14;
        const textFontSize = 12;
        const marginLeft = 20;
        const marginTop = 20;
        const contentWidth = doc.internal.pageSize.width - (marginLeft * 2);
        
        // Função auxiliar para extrair texto do HTML
        const extractTextFromHtml = (html) => {
          const temp = document.createElement('div');
          temp.innerHTML = html;
          return temp.textContent || temp.innerText || '';
        };
        
        // Função para processar elementos HTML e extrair seu conteúdo
        const processElements = () => {
          const temp = document.createElement('div');
          temp.innerHTML = htmlContent;
          
          const elements = [];
          const processNode = (node) => {
            // Ignora nós de texto vazios e nós de comentário
            if ((node.nodeType === 3 && node.textContent.trim() === '') || node.nodeType === 8) {
              return;
            }
            
            if (node.nodeType === 3) { // Nó de texto
              if (node.textContent.trim()) {
                elements.push({
                  type: 'text',
                  content: node.textContent.trim(),
                  fontSize: textFontSize
                });
              }
            } else if (node.nodeType === 1) { // Elementos HTML
              const tagName = node.tagName.toLowerCase();
              
              // Tratamento específico por tipo de elemento
              if (tagName === 'h1') {
                elements.push({
                  type: 'heading',
                  content: node.textContent.trim(),
                  fontSize: titleFontSize,
                  isBold: true
                });
              } else if (tagName === 'h2') {
                elements.push({
                  type: 'heading',
                  content: node.textContent.trim(),
                  fontSize: headerFontSize,
                  isBold: true
                });
              } else if (tagName === 'h3') {
                elements.push({
                  type: 'heading',
                  content: node.textContent.trim(),
                  fontSize: headerFontSize - 2,
                  isBold: true
                });
              } else if (tagName === 'p') {
                elements.push({
                  type: 'paragraph',
                  content: node.textContent.trim(),
                  fontSize: textFontSize
                });
              } else if (tagName === 'table') {
                // Extrair dados da tabela
                const table = {
                  type: 'table',
                  headers: [],
                  rows: []
                };
                
                // Processar cabeçalhos
                const headers = node.querySelectorAll('th');
                headers.forEach(header => {
                  table.headers.push(header.textContent.trim());
                });
                
                // Processar linhas
                const rows = node.querySelectorAll('tr');
                rows.forEach(row => {
                  // Pular linhas de cabeçalho
                  if (row.querySelector('th')) return;
                  
                  const cells = row.querySelectorAll('td');
                  const rowData = [];
                  cells.forEach(cell => {
                    rowData.push(cell.textContent.trim());
                  });
                  
                  if (rowData.length > 0) {
                    table.rows.push(rowData);
                  }
                });
                
                if (table.headers.length > 0 || table.rows.length > 0) {
                  elements.push(table);
                }
              } else if (tagName === 'ul' || tagName === 'ol') {
                const items = [];
                const listItems = node.querySelectorAll('li');
                listItems.forEach(item => {
                  items.push(item.textContent.trim());
                });
                
                elements.push({
                  type: 'list',
                  items: items,
                  isOrdered: tagName === 'ol'
                });
              } else {
                // Para outros elementos, processar seus filhos
                node.childNodes.forEach(child => {
                  processNode(child);
                });
              }
            }
          };
          
          // Processar todos os nós filhos do conteúdo
          Array.from(temp.childNodes).forEach(processNode);
          return elements;
        };
        
        // Processar o conteúdo HTML
        const elements = processElements();
        
        // Adicionar data e título ao PDF
        let yPosition = marginTop;
        
        // Adicionar título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(titleFontSize);
        doc.text(fileName, marginLeft, yPosition);
        yPosition += 10;
        
        // Adicionar data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(textFontSize);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, yPosition);
        yPosition += 15;
        
        // Renderizar elementos no PDF
        elements.forEach(element => {
          // Verificar se é necessário adicionar uma nova página
          if (yPosition > doc.internal.pageSize.height - 30) {
            doc.addPage();
            yPosition = marginTop;
          }
          
          if (element.type === 'heading' || element.type === 'paragraph' || element.type === 'text') {
            // Configurar fonte
            doc.setFont("helvetica", element.isBold ? "bold" : "normal");
            doc.setFontSize(element.fontSize);
            
            // Quebrar texto longo em múltiplas linhas
            const lines = doc.splitTextToSize(element.content, contentWidth);
            
            // Verificar se é necessário adicionar nova página
            if (yPosition + (lines.length * 7) > doc.internal.pageSize.height - 20) {
              doc.addPage();
              yPosition = marginTop;
            }
            
            // Desenhar texto
            doc.text(lines, marginLeft, yPosition);
            yPosition += (lines.length * 7) + (element.type === 'paragraph' ? 5 : 3);
            
            // Adicionar espaço extra após títulos
            if (element.type === 'heading') {
              yPosition += 5;
            }
          } else if (element.type === 'list') {
            // Para cada item da lista
            element.items.forEach((item, index) => {
              // Verificar se é necessário adicionar nova página
              if (yPosition > doc.internal.pageSize.height - 30) {
                doc.addPage();
                yPosition = marginTop;
              }
              
              // Configurar fonte
              doc.setFont("helvetica", "normal");
              doc.setFontSize(textFontSize);
              
              // Prefixo do item (número ou ponto)
              const prefix = element.isOrdered ? `${index + 1}. ` : '• ';
              
              // Quebrar texto longo em múltiplas linhas com recuo
              const itemText = prefix + item;
              const lines = doc.splitTextToSize(itemText, contentWidth - 5);
              
              // Desenhar texto
              doc.text(lines, marginLeft, yPosition);
              yPosition += (lines.length * 7) + 3;
            });
            
            // Espaço após a lista
            yPosition += 5;
          } else if (element.type === 'table') {
            // Configurações da tabela
            const cellPadding = 3;
            const cellHeight = 10;
            
            // Calcular largura das colunas (distribuição igual)
            const numColumns = Math.max(
              element.headers.length,
              element.rows.length > 0 ? element.rows[0].length : 0
            );
            const colWidth = numColumns > 0 ? contentWidth / numColumns : contentWidth;
            
            // Desenhar cabeçalhos
            if (element.headers.length > 0) {
              // Verificar se é necessário adicionar nova página
              if (yPosition > doc.internal.pageSize.height - 30) {
                doc.addPage();
                yPosition = marginTop;
              }
              
              // Configurar fonte para cabeçalhos
              doc.setFont("helvetica", "bold");
              doc.setFontSize(textFontSize);
              
              // Desenhar células do cabeçalho
              element.headers.forEach((header, idx) => {
                // Calcular posição x
                const x = marginLeft + (idx * colWidth);
                
                // Adicionar borda e fundo da célula
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(240, 240, 240);
                doc.rect(x, yPosition - cellHeight + cellPadding, colWidth, cellHeight, 'FD');
                
                // Texto do cabeçalho
                const headerText = doc.splitTextToSize(header, colWidth - (cellPadding * 2));
                doc.text(headerText, x + cellPadding, yPosition - cellHeight/2 + cellPadding/2);
              });
              
              // Avançar posição Y
              yPosition += cellHeight;
            }
            
            // Desenhar linhas de dados
            element.rows.forEach(row => {
              // Verificar se é necessário adicionar nova página
              if (yPosition > doc.internal.pageSize.height - 30) {
                doc.addPage();
                yPosition = marginTop;
              }
              
              // Configurar fonte para dados
              doc.setFont("helvetica", "normal");
              doc.setFontSize(textFontSize);
              
              // Altura para esta linha (pode aumentar se houver texto longo)
              let maxCellHeight = cellHeight;
              
              // Calcular altura máxima da célula baseada no conteúdo
              row.forEach((cell, idx) => {
                const x = marginLeft + (idx * colWidth);
                const text = doc.splitTextToSize(cell, colWidth - (cellPadding * 2));
                const cellContentHeight = text.length * 7;
                
                if (cellContentHeight > maxCellHeight) {
                  maxCellHeight = cellContentHeight + (cellPadding * 2);
                }
              });
              
              // Desenhar células
              row.forEach((cell, idx) => {
                const x = marginLeft + (idx * colWidth);
                
                // Adicionar borda da célula
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, yPosition - maxCellHeight + cellPadding, colWidth, maxCellHeight, 'S');
                
                // Texto da célula
                const cellText = doc.splitTextToSize(cell, colWidth - (cellPadding * 2));
                doc.text(cellText, x + cellPadding, yPosition - maxCellHeight + cellPadding * 2);
              });
              
              // Avançar posição Y
              yPosition += maxCellHeight;
            });
            
            // Espaço após a tabela
            yPosition += 10;
          }
        });
        
        // Adicionar numeração de páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
        
        // Salvar o PDF
        doc.save(`${fileName}.pdf`);
        
        toast({
          title: "Sucesso",
          description: "PDF baixado com sucesso!",
          variant: "default",
        });
      } 
      else if (type === 'docx') {
        // Manter a implementação original para Word pois funciona bem
        toast({
          title: "Processando",
          description: "Gerando documento Word, aguarde...",
        });
        
        // Obter o conteúdo HTML
        const htmlContent = editorRef.current.innerHTML;
        
        // Criar um arquivo HTML completo que o Word pode importar
        const completeHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                xmlns:w="urn:schemas-microsoft-com:office:word" 
                xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="utf-8">
              <title>${documentTitle}</title>
              <!--[if gte mso 9]>
              <xml>
                <w:WordDocument>
                  <w:View>Print</w:View>
                  <w:Zoom>90</w:Zoom>
                  <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
              </xml>
              <![endif]-->
              <style>
                /* Estilos para Word */
                body {
                  font-family: 'Calibri', sans-serif;
                  font-size: 11pt;
                }
                h1 { font-size: 18pt; color: #4361ee; margin-bottom: 12pt; }
                h2 { font-size: 14pt; color: #3a0ca3; margin-top: 12pt; margin-bottom: 6pt; }
                h3 { font-size: 12pt; color: #4895ef; margin-top: 10pt; margin-bottom: 6pt; }
                p { margin-bottom: 8pt; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1pt solid #e2e8f0; padding: 5pt; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `;
        
        // Criar blob
        const blob = new Blob([completeHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        
        // Criar link para download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: "Documento Word baixado com sucesso!",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Erro ao baixar documento:", error);
      toast({
        title: "Erro ao baixar documento",
        description: error.message || "Ocorreu um erro ao processar o download",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Formulários</h1>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsSegmentSelectorOpen(true)} // Alterado para abrir o seletor de tipos
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-5 h-auto text-base font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/30 hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> 
            Criar Formulário
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGerarComIA} 
            className="gap-2 px-6 py-5 h-auto text-base font-medium border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" /> 
            Gerar com IA
          </Button>
        </div>
      </div>
      
      {/* Dialog para opções de Gerar com IA */}
      <Dialog open={isGenAIDialogOpen} onOpenChange={setIsGenAIDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900 border-0 shadow-xl">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6">
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Sparkles className="h-6 w-6" /> Gerar com IA
              </DialogTitle>
              <DialogDescription className="text-indigo-100 text-base mt-2">
                Escolha o tipo de documento que você deseja criar automaticamente.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            {/* Layout horizontal com grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Novo Card - Gerar Formulário */}
              <div 
                onClick={handleGerarFormulario}
                className="group flex flex-col h-full p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/70 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <Plus className="h-7 w-7 text-indigo-600 dark:text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center text-gray-800 dark:text-gray-200">Gerar Formulário</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center flex-grow leading-relaxed">
                  Crie formulários automaticamente com base em suas necessidades específicas.
                </p>
              </div>
              
              {/* Opção de Proposta */}
              <div 
                onClick={handleGerarProposta}
                className="group flex flex-col h-full p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/70 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <FilePlus className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center text-gray-800 dark:text-gray-200">Proposta</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center flex-grow leading-relaxed">
                  Gere uma proposta comercial profissional com escopo e valores sugeridos.
                </p>
              </div>
              
              {/* Opção de Relatório */}
              <div 
                onClick={handleGerarRelatorio}
                className="group flex flex-col h-full p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/70 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <FileSpreadsheet className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center text-gray-800 dark:text-gray-200">Relatório</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center flex-grow leading-relaxed">
                  Crie relatórios analíticos com métricas e resumos dos dados coletados.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50/80 dark:bg-gray-900/50 p-5 border-t border-gray-100 dark:border-gray-800">
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsGenAIDialogOpen(false)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para seleção de formulário */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-5">
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {getActionIcon()} {getSearchTitle()}
              </DialogTitle>
              <DialogDescription className="text-indigo-100">
                {getSearchDescription()}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Conteúdo do modal */}
          <div className="p-5 space-y-5">
            {/* Campo de busca com animação */}
            <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
              <Input
                type="search"
                placeholder="Buscar formulário pelo nome..."
                className="pl-10 py-6 rounded-lg border-indigo-200 dark:border-indigo-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Lista de formulários */}
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
              {filteredForms.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FileSearch className="h-12 w-12 mx-auto text-indigo-300 mb-3" />
                  <p>Nenhum formulário encontrado com esse nome</p>
                </div>
              ) : (
                filteredForms.map((form) => (
                  <div
                    key={form.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedForm?.id === form.id
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                        : "hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                    }`}
                    onClick={() => handleSelectForm(formatFormForComponents(form))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedForm?.id === form.id
                          ? "bg-indigo-100 dark:bg-indigo-800"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          selectedForm?.id === form.id
                            ? "text-indigo-500" 
                            : "text-gray-500"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          selectedForm?.id === form.id
                            ? "text-indigo-700 dark:text-indigo-300" 
                            : ""
                        }`}>{form.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <Layers className="h-3 w-3 mr-1" />
                            <span>
                              {Array.isArray(form.fields) 
                                ? form.fields.length 
                                : (typeof form.fields === 'object' && form.fields !== null)
                                  ? Object.keys(form.fields).length
                                  : 0} campos
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{new Date(form.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {selectedForm?.id === form.id && (
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800">
            <DialogFooter className="sm:justify-between flex flex-row gap-3">
                <Button
                  variant="outline"
                onClick={() => setIsSearchOpen(false)}
                className="hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                Cancelar
                </Button>
              <Button
                disabled={!selectedForm}
                onClick={handleGenerate}
                className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white gap-2 px-6 transition-all duration-300 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500"
              >
                {getActionIcon()} {getActionLabel()}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmação de exclusão */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          // Se estiver fechando o diálogo, apenas faça isso se não estiver excluindo
          if (!open && !isDeletingForm) {
            setIsDeleteDialogOpen(false);
            // Limpe o formToDelete após um breve atraso
            setTimeout(() => setFormToDelete(null), 100);
          } else if (open) {
            // Se estiver abrindo, apenas defina como aberto
            setIsDeleteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir formulário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este formulário? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
                <Button
                  variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingForm}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingForm}
            >
              {isDeletingForm ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor de Documento */}
      <Dialog 
        open={isDocumentEditorOpen} 
        onOpenChange={(open) => {
          if (!open && documentContent) {
            if (confirm("Tem certeza que deseja fechar o editor? Alterações não salvas serão perdidas.")) {
              setIsDocumentEditorOpen(false);
              setDocumentContent("");
              setDocumentTitle("");
            }
          } else {
            setIsDocumentEditorOpen(open);
          }
        }}
        className="sm:max-w-5xl"
      >
        <DialogContent className="max-w-5xl p-0 h-[90vh] flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-3 flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-white mr-2" />
              <span className="text-white font-medium">{documentTitle}</span>
            </div>
            <div className="flex gap-2">
              {/* Botão Gerar com IA */}
              <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleGenerateWithAI({documentContent}, generationType === "relatorio" ? "report" : "proposal")}
                variant="outline" 
                size="sm"
                disabled={isGeneratingContent}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
              >
                {isGeneratingContent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGeneratingContent 
                  ? "Gerando..." 
                  : generationType === "relatorio"
                    ? "Gerar análise de relatório" 
                    : "Gerar proposta com IA"}
              </Button>
              </div>
              
              {/* Menu de download com opções PDF e DOCX */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadDocument('pdf')}>
                    <FileText className="h-4 w-4 mr-2" /> Baixar como PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadDocument('docx')}>
                    <FileText className="h-4 w-4 mr-2" /> Baixar como Word (.docx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                onClick={() => setIsDocumentEditorOpen(false)}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-1" /> Fechar
              </Button>
            </div>
          </div>
          
          {/* NOVA BARRA DE FERRAMENTAS DE FORMATAÇÃO */}
          <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-2">
            {/* Botões de estilo de texto */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('bold', false, '')}
              title="Negrito"
            >
              <span className="font-bold text-lg">B</span>
            </Button>
            
              <Button 
              variant="ghost" 
                size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('italic', false, '')}
              title="Itálico"
              >
              <span className="italic text-lg">I</span>
              </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('underline', false, '')}
              title="Sublinhado"
            >
              <span className="underline text-lg">U</span>
            </Button>
            
            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            {/* Alinhamento de texto */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('justifyLeft', false, '')}
              title="Alinhar à esquerda"
            >
              <div className="flex flex-col items-start">
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-3 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300"></div>
          </div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('justifyCenter', false, '')}
              title="Centralizar"
            >
              <div className="flex flex-col items-center">
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-3 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300"></div>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('justifyRight', false, '')}
              title="Alinhar à direita"
            >
              <div className="flex flex-col items-end">
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-3 h-1 bg-gray-600 dark:bg-gray-300 mb-0.5"></div>
                <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300"></div>
              </div>
            </Button>
            
            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            {/* Listas - apenas lista com marcadores */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8 rounded"
              onClick={() => document.execCommand('insertUnorderedList', false, '')}
              title="Lista com marcadores"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-300 mr-1"></div>
                  <div className="w-3 h-1 bg-gray-600 dark:bg-gray-300"></div>
                </div>
                <div className="flex items-center mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-300 mr-1"></div>
                  <div className="w-4 h-1 bg-gray-600 dark:bg-gray-300"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-300 mr-1"></div>
                  <div className="w-3 h-1 bg-gray-600 dark:bg-gray-300"></div>
                </div>
              </div>
            </Button>
            
            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            {/* Cores de texto */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 rounded flex items-center gap-1"
                title="Cor do texto"
              >
                <span className="flex items-center">
                  <span className="h-3 w-3 bg-black dark:bg-white rounded-sm block mr-1"></span>
                  Cor
                </span>
              </Button>
              <input 
                type="color" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
              />
            </div>
          </div>
          
          {/* Indicador de loading durante a geração */}
          {isGeneratingContent && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-gray-700 dark:text-gray-200">
                  {generationType === "relatorio" 
                    ? "Gerando análise de relatório..." 
                    : "Gerando proposta com IA..."}
                </span>
              </div>
            </div>
          )}
          
          {/* Modal de status da geração */}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {generationError ? "Erro na geração" : "Gerando conteúdo"}
                </DialogTitle>
                <DialogDescription>
                  {generationError || progressStatus}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {!generationError && !generatedContent && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                )}
                
                {generatedContent && (
                  <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Conteúdo gerado com sucesso! Clique em "Aplicar" para usar este conteúdo.
                    </p>
                  </div>
                )}
                
                {generationError && (
                  <div className="border border-red-200 rounded-md p-3 bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {generationError}
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {generationError && (
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Fechar
                  </Button>
                )}
                
                {generatedContent && (
                  <>
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        setDocumentContent(generatedContent);
                        setShowModal(false);
                      }}
                    >
                      Aplicar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900">
            {/* Container centralizado para modo de página */}
            <div className={`${showPageLayout ? 'flex flex-col items-center' : ''}`}>
              {/* Editor com suas páginas */}
              <div 
                ref={editorRef}
                contentEditable 
                className={`prose prose-indigo dark:prose-invert focus:outline-none ${
                  showPageLayout 
                    ? 'bg-white shadow-lg' 
                    : 'min-h-full max-w-none bg-white dark:bg-gray-950'
                }`}
                style={showPageLayout ? {
                  width: `${A4_WIDTH_PX}px`,
                  minHeight: `${A4_HEIGHT_PX}px`,
                  padding: `${PAGE_MARGIN_PX}px`,
                  marginBottom: '2rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {}}
                dangerouslySetInnerHTML={{ __html: documentContent.replace(/\n/g, '<br>') }}
                onBlur={(e) => setDocumentContent(e.currentTarget.innerHTML)}
              />

              {/* Botão para adicionar nova página (quando no modo de página) */}
              {showPageLayout && (
                <Button 
                  variant="outline"
                  className="mb-6 mt-2"
                  onClick={() => {
                    const newPage = document.createElement('div');
                    newPage.className = 'page bg-white shadow-lg';
                    newPage.style.width = `${A4_WIDTH_PX}px`;
                    newPage.style.minHeight = `${A4_HEIGHT_PX}px`;
                    newPage.style.padding = `${PAGE_MARGIN_PX}px`;
                    newPage.style.marginBottom = '2rem';
                    newPage.style.border = '1px solid #e2e8f0';
                    newPage.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    newPage.contentEditable = 'true';
                    
                    // Adicionar ao editor
                    editorRef.current.appendChild(newPage);
                    
                    // Foco na nova página
                    newPage.focus();
                    
                    // Atualiza o conteúdo do documento
                    setDocumentContent(editorRef.current.innerHTML);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Nova página
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 border-t border-gray-200 dark:border-gray-800 flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Edite o documento conforme necessário antes de baixar
            </span>
            
            {/* Substituir o botão único por um menu de download */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600">
                  <Download className="h-4 w-4 mr-1" /> Baixar Documento
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownloadDocument('pdf')}>
                  <FileText className="h-4 w-4 mr-2" /> Baixar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadDocument('docx')}>
                  <FileText className="h-4 w-4 mr-2" /> Baixar como Word (.docx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para seleção de segmento */}
      <Dialog open={isSegmentSelectorOpen} onOpenChange={setIsSegmentSelectorOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6">
            <DialogHeader className="text-white">
              <DialogTitle className="text-xl font-semibold">
                Selecione um Tipo de Formulário
              </DialogTitle>
              <DialogDescription className="text-indigo-100 text-base">
                Selecione o tipo de formulário que melhor atende às suas necessidades
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar segmento..."
                value={segmentSearchQuery}
                onChange={(e) => setSegmentSearchQuery(e.target.value)}
                className="pl-10 py-5 text-base"
              />
            </div>

            {/* Lista de segmentos */}
            <div className="flex flex-wrap gap-3">
              {filteredSegments.map((segment) => (
                <button
                  key={segment.id}
                  onClick={() => handleSegmentSelect(segment)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200 group"
                >
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200">
                    {segment.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {segment.name}
                  </span>
                </button>
              ))}
            </div>
                    </div>
                    
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800">
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSegmentSelectorOpen(false)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adicione esse novo Dialog para seleção de resposta */}
      <Dialog open={isResponseSelectorOpen} onOpenChange={setIsResponseSelectorOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6">
            <DialogHeader className="text-white">
              <DialogTitle className="text-2xl font-semibold">
                Selecionar Resposta
              </DialogTitle>
              <DialogDescription className="text-indigo-100 text-base">
                Escolha a resposta que deseja usar para gerar a proposta
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {formResponses.length === 0 ? (
              <div className="text-center py-10">
                <FileSearch className="h-12 w-12 mx-auto text-indigo-300 mb-3" />
                <p className="text-gray-500">Este formulário ainda não possui respostas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formResponses.map((response) => (
                  <div
                    key={response.id}
                    onClick={() => handleSelectResponse(response)}
                    className="p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <FileText className="h-5 w-5 text-indigo-500" />
                    </div>
                        <div>
                          <p className="font-medium">
                            Resposta #{response.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(response.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        Selecionar
                      </Button>
                    </div>
                    
                    {/* Preview das respostas */}
                    <div className="mt-4 space-y-2">
                      {Object.entries(response.response_data).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{value}</span>
                  </div>
                ))}
                      {Object.keys(response.response_data).length > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          ... e mais {Object.keys(response.response_data).length - 3} campos
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800">
            <DialogFooter>
                <Button 
                variant="outline"
                onClick={() => {
                  setIsResponseSelectorOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                Voltar
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de formulários */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center p-10 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            Você ainda não possui formulários
          </h2>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro formulário para começar a receber respostas.
          </p>
          <Button onClick={() => navigate("/")}>
            <Plus className="mr-2 h-4 w-4" /> Criar Formulário
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={formatFormForComponents(form)}
              onEdit={() => handleEdit(formatFormForComponents(form))}
              onView={() => handleView(formatFormForComponents(form))}
              onViewResponses={() => handleViewResponses(formatFormForComponents(form))}
              onDownload={() => handleDownloadSheet(formatFormForComponents(form))}
              onDelete={() => handleDeleteClick(formatFormForComponents(form))}
              className="min-w-[280px] min-h-[180px] p-5"
            />
          ))}
              </div>
            )}
          </div>
  );
} 

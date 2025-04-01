import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, Clock, Download, Filter, Search, SortAsc, ArrowLeft, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FormResponse {
  id: string;
  created_at: string;
  response_data: Record<string, string>;
}

interface Form {
  id: string;
  name: string;
  fields: {
    id: string;
    type: string;
    label: string;
  }[];
}

const FormResponses = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  // Buscar informações do formulário
  const { data: form } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Form;
    },
  });

  // Efeito para carregar as respostas quando houver um ID
  useEffect(() => {
    if (id) {
      console.log("Buscando respostas para o formulário:", id);
      
      const fetchResponses = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("form_responses")
            .select("*")
            .eq("form_id", id)
            .order('created_at', { ascending: false });
            
          if (error) {
            toast({
              title: "Erro ao carregar respostas",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          if (data) {
            console.log("Respostas carregadas:", data.length);
            setResponses(data);
          }
        } catch (error) {
          console.error("Erro ao buscar respostas:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as respostas",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchResponses();
    }
  }, [id, toast]);

  // Filtrar respostas baseado no termo de busca
  const filteredResponses = responses?.filter(response => 
    Object.values(response.response_data).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleExportPDF = async () => {
    try {
      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Configurações de estilo
      const titleFontSize = 18;
      const headerFontSize = 14;
      const textFontSize = 12;
      const marginLeft = 20;
      const marginRight = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Adicionar título do formulário
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleFontSize);
      doc.text(form?.name || 'Respostas do Formulário', marginLeft, 20);

      // Adicionar data de geração
      doc.setFont("helvetica", "normal");
      doc.setFontSize(textFontSize);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, 30);
      doc.text(`Total de respostas: ${responses.length}`, marginLeft, 37);

      let yPosition = 50;

      // Organizar respostas por campo
      form?.fields.forEach((field) => {
        if (field.type !== "headline") {
          // Verificar se precisa adicionar nova página
          if (yPosition > doc.internal.pageSize.height - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Adicionar título do campo
          doc.setFont("helvetica", "bold");
          doc.setFontSize(headerFontSize);
          doc.text(field.label, marginLeft, yPosition);
          yPosition += 10;

          // Adicionar respostas do campo
          doc.setFont("helvetica", "normal");
          doc.setFontSize(textFontSize);

          responses.forEach((response, index) => {
            const resposta = response.response_data[field.label] || 'Sem resposta';
            
            // Quebrar texto longo em múltiplas linhas
            const splitText = doc.splitTextToSize(
              `${index + 1}. ${resposta}`, 
              contentWidth
            );

            // Verificar se precisa adicionar nova página
            if (yPosition + (splitText.length * 7) > doc.internal.pageSize.height - 20) {
              doc.addPage();
              yPosition = 20;
            }

            // Adicionar texto com recuo
            splitText.forEach((line) => {
              doc.text(line, marginLeft, yPosition);
              yPosition += 7;
            });
          });

          yPosition += 10; // Espaço entre campos
        }
      });

      // Adicionar rodapé com numeração de páginas
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Baixar o PDF
      const fileName = `${form?.name || 'respostas'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado automaticamente",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive",
      });
    }
  };

  // Função para copiar todas as respostas em formato de texto
  const handleCopyResponses = () => {
    try {
      if (!form || !filteredResponses.length) {
        toast({
          title: "Não há respostas para copiar",
          variant: "destructive"
        });
        return;
      }

      // Formatação do texto das respostas
      let textContent = `${form.name}\n`;
      textContent += `${filteredResponses.length} ${filteredResponses.length === 1 ? 'resposta' : 'respostas'}\n`;
      textContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Para cada resposta, formatar as perguntas e respostas
      filteredResponses.forEach((response, responseIndex) => {
        // Adicionar cabeçalho da resposta com data e hora
        textContent += `------------------------------------------\n`;
        textContent += `RESPOSTA ${responseIndex + 1} - ${format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}\n`;
        textContent += `------------------------------------------\n\n`;
        
        // Adicionar cada pergunta e resposta
        form.fields.forEach((field) => {
          if (field.type !== "headline") {
            const resposta = response.response_data[field.label] || 'Sem resposta';
            textContent += `> ${field.label}:\n${resposta}\n\n`;
          }
        });
      });

      // Copiar para a área de transferência
      navigator.clipboard.writeText(textContent);
      
      toast({
        title: "Respostas copiadas!",
        description: `${filteredResponses.length} ${filteredResponses.length === 1 ? 'resposta copiada' : 'respostas copiadas'} para a área de transferência`
      });
    } catch (error) {
      console.error("Erro ao copiar respostas:", error);
      toast({
        title: "Erro ao copiar respostas",
        description: "Não foi possível copiar as respostas",
        variant: "destructive"
      });
    }
  };
  
  // Função para formatar e copiar uma única resposta
  const formatAndCopyResponse = (response: FormResponse) => {
    if (!form) return;
    
    try {
      // Formatação do texto da resposta individual
      let textContent = `${form.name}\n`;
      textContent += `Resposta de ${format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}\n\n`;
      
      // Adicionar cada pergunta e resposta
      form.fields.forEach((field) => {
        if (field.type !== "headline") {
          const resposta = response.response_data[field.label] || 'Sem resposta';
          textContent += `> ${field.label}:\n${resposta}\n\n`;
        }
      });
      
      // Copiar para a área de transferência
      navigator.clipboard.writeText(textContent);
      
      toast({
        title: "Resposta copiada!",
        description: "A resposta foi copiada para a área de transferência"
      });
    } catch (error) {
      console.error("Erro ao copiar resposta:", error);
      toast({
        title: "Erro ao copiar resposta",
        description: "Não foi possível copiar a resposta",
        variant: "destructive"
      });
    }
  };

  // Adicione esta função para truncar texto longo
  const TruncatedText = ({ text, maxLength = 100 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!text || text.length <= maxLength) {
      return <span>{text || <span className="text-gray-400 italic">Sem resposta</span>}</span>;
    }
    
    return (
      <div className="space-y-2">
        {isExpanded ? (
          <div className="whitespace-pre-wrap break-words">{text}</div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{text.substring(0, maxLength)}...</div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </button>
      </div>
    );
  };

  // Função para abrir o modal de detalhes
  const handleViewDetails = (response: FormResponse) => {
    setSelectedResponse(response);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-16 bg-gray-100 animate-pulse"></div>
          <div className="p-8">
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-xl font-semibold text-white">{form?.name}</h1>
          <p className="text-indigo-100 text-sm">
            {responses?.length || 0} {responses?.length === 1 ? 'resposta' : 'respostas'} encontradas
          </p>
        </div>

        {/* Barra de ferramentas */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar nas respostas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filtrar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleCopyResponses}
            >
              <Copy className="h-4 w-4" />
              <span>Copiar respostas</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {!responses?.length ? (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma resposta encontrada</h3>
            <p className="text-gray-500">Este formulário ainda não recebeu respostas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredResponses.map((response) => (
              <div key={response.id} className="border-b border-gray-200 dark:border-gray-700 py-6 px-6">
                {/* Cabeçalho da resposta com data/hora */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3 mr-1 text-indigo-500" />
                      {format(new Date(response.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1 text-indigo-400" />
                      {format(new Date(response.created_at), "HH:mm:ss", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center gap-1"
                      onClick={() => formatAndCopyResponse(response)}
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleViewDetails(response)}
                    >
                      Visualizar detalhes
                    </Button>
                  </div>
                </div>
                
                {/* Respostas em formato vertical */}
                <div className="grid grid-cols-1 gap-4">
                  {form?.fields.map((field) => (
                    field.type !== "headline" && (
                      <div key={field.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          <TruncatedText 
                            text={response.response_data[field.label]} 
                            maxLength={150}
                          />
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        {responses && responses.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {filteredResponses.length} de {responses.length} respostas
            </p>
          </div>
        )}
      </div>
      
      {/* Modal de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes da Resposta</DialogTitle>
            <DialogDescription className="flex items-center text-sm">
              <Calendar className="h-3 w-3 mr-1 text-indigo-500" />
              {selectedResponse && format(new Date(selectedResponse.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                locale: ptBR,
              })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResponse && (
            <div className="py-4 space-y-6">
              {form?.fields.map((field) => (
                field.type !== "headline" && (
                  <div key={field.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-md min-h-[40px] whitespace-pre-wrap break-words text-gray-900">
                      {selectedResponse.response_data[field.label] || (
                        <span className="text-gray-400 italic">Sem resposta</span>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
          
          <DialogFooter>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (selectedResponse) {
                    formatAndCopyResponse(selectedResponse);
                  }
                }}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar resposta</span>
              </Button>
              <Button 
                onClick={() => setIsDetailsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormResponses; 
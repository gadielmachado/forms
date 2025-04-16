import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import FormFieldsList from "@/components/form-builder/FormFieldsList";
import FormHeader from "@/components/form-builder/FormHeader";
import ImageUpload from "@/components/form-builder/ImageUpload";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Save } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

// Adicione a interface para as opções de checkbox
interface CheckboxOption {
  id: string;
  label: string;
  isEditing?: boolean;
}

interface FormFieldType {
  id: string;
  type: string;
  label: string;
  checkboxOptions?: CheckboxOption[]; // Adicione esta propriedade
  required?: boolean; // Adicionar campo para controlar se é obrigatório
}

const CreateForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  
  const [initialForm, setInitialForm] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<FormFieldType[]>([{ id: "1", type: "text", label: "", required: false }]);
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormName("");
    setFields([{ id: "1", type: "text", label: "", required: false }]);
    setImageUrl(null);
  };

  // Função para depurar a estrutura dos campos
  const logFieldsStructure = (prefix: string, fieldsData: FormFieldType[]) => {
    console.log(`${prefix} - Número de campos:`, fieldsData.length);
    
    // Verificar campos do tipo checkbox
    const checkboxFields = fieldsData.filter(field => field.type === "checkbox");
    console.log(`${prefix} - Campos checkbox:`, checkboxFields.length);
    
    // Log detalhado dos campos checkbox e suas opções
    checkboxFields.forEach((field, index) => {
      console.log(`${prefix} - Checkbox #${index+1} (id: ${field.id}):`, {
        label: field.label,
        optionsCount: field.checkboxOptions?.length || 0,
        options: field.checkboxOptions
      });
    });
  }

  // Esta função é crucial para garantir que as opções do checkbox sejam preservadas
  const handleFieldsChange = (updatedFields: FormFieldType[]) => {
    console.log("Campos atualizados:", updatedFields);
    
    // Garantir que cada campo do tipo checkbox mantenha suas opções
    const processedFields = updatedFields.map(field => {
      // Para campos do tipo checkbox, garantimos que as opções sejam preservadas
      if (field.type === "checkbox") {
        // Se não tiver opções, inicialize com um valor padrão
        if (!field.checkboxOptions || !Array.isArray(field.checkboxOptions) || field.checkboxOptions.length === 0) {
          return {
            ...field,
            checkboxOptions: [{ id: "1", label: "Opção 1" }]
          };
        }
      }
      return field;
    });
    
    setFields(processedFields);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome para o formulário",
        variant: "destructive",
      });
      return;
    }

    if (!currentTenant) {
      toast({
        title: "Erro",
        description: "Selecione uma organização antes de salvar o formulário",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar formulários",
          variant: "destructive",
        });
        return;
      }

      // Log para depuração dos campos antes de salvar
      logFieldsStructure("ANTES DE SALVAR", fields);

      // Importante: Prepare os campos para salvar, garantindo que as opções de checkbox sejam preservadas
      const cleanedFields = fields.map(field => {
        // Crie uma cópia profunda do campo para evitar referências
        const cleanField = { ...field };
        
        // Garantir que o valor required seja preservado
        cleanField.required = field.required || false;
        
        // Tratamento específico para campos do tipo checkbox
        if (field.type === "checkbox") {
          // Garanta que checkboxOptions exista e seja um array válido
          if (field.checkboxOptions && Array.isArray(field.checkboxOptions)) {
            // Crie uma nova array de opções sem propriedades temporárias de UI
            cleanField.checkboxOptions = field.checkboxOptions.map(option => ({
              id: option.id,
              label: option.label
              // isEditing é removido intencionalmente, pois é apenas estado de UI
            }));
          } else {
            // Se não houver opções, crie uma padrão para evitar erros
            cleanField.checkboxOptions = [{ id: "1", label: "Opção 1" }];
          }
        }
        
        return cleanField;
      });

      // Log para depuração dos campos limpos
      logFieldsStructure("APÓS LIMPEZA", cleanedFields);
      
      // Prepara os dados para salvar, incluindo o tenant_id
      const formData = {
        name: formName,
        fields: cleanedFields,
        user_id: user.id,
        image_url: imageUrl,
        tenant_id: currentTenant.id
      };

      console.log("Dados a serem salvos:", JSON.stringify(formData, null, 2));

      let result;
      
      if (initialForm?.id) {
        result = await supabase
          .from("forms")
          .update(formData)
          .eq("id", initialForm.id);
      } else {
        result = await supabase.from("forms").insert(formData);
      }

      if (result.error) {
        console.error("Erro ao salvar no Supabase:", result.error);
        throw result.error;
      }

      // Atualize o restante do código para o formulário que acabamos de salvar
      if (initialForm?.id) {
        // Busque novamente o formulário do banco de dados para verificar se os dados foram salvos corretamente
        const { data: savedForm, error: fetchError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", initialForm.id)
          .single();

        if (fetchError) {
          console.error("Erro ao buscar formulário salvo:", fetchError);
        } else {
          console.log("Formulário salvo e recuperado:", savedForm);
          
          // Verifique se os campos foram salvos corretamente
          if (savedForm.fields) {
            const savedFields = Array.isArray(savedForm.fields) 
              ? savedForm.fields 
              : (typeof savedForm.fields === 'string' ? JSON.parse(savedForm.fields) : []);
            
            logFieldsStructure("CAMPOS SALVOS NO BANCO", savedFields);
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["forms"] });

      toast({
        title: "Sucesso",
        description: initialForm?.id 
          ? "Formulário atualizado com sucesso!"
          : "Formulário salvo com sucesso!",
      });

      if (!initialForm?.id) {
        resetForm();
      }

      navigate("/forms");
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar formulário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchForm = async () => {
        setIsLoading(true);
        try {
          console.log("Buscando formulário com ID:", id);
          
          const { data, error } = await supabase
            .from("forms")
            .select("*")
            .eq("id", id)
            .single();
          
          if (error) {
            console.error("Erro na consulta ao Supabase:", error);
            toast({
              title: "Erro ao carregar formulário",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          if (data) {
            console.log("Formulário carregado do Supabase:", data);
            setFormName(data.name || "");
            setImageUrl(data.image_url || null);
            
            // Processar os campos do formulário para garantir a estrutura correta
            let rawFields;
            
            // Determinar se os campos estão como array ou string JSON
            if (Array.isArray(data.fields)) {
              rawFields = data.fields;
            } else if (typeof data.fields === 'string') {
              try {
                rawFields = JSON.parse(data.fields);
              } catch (e) {
                console.error("Erro ao processar JSON de campos:", e);
                rawFields = [];
              }
            } else if (data.fields && typeof data.fields === 'object') {
              rawFields = Object.values(data.fields);
            } else {
              rawFields = [];
            }
            
            console.log("Campos brutos carregados:", rawFields);
            
            // Processar cada campo para garantir a estrutura correta, especialmente para checkboxes
            const processedFields = rawFields.map((field: any) => {
              const processedField: FormFieldType = {
                id: field.id || Math.random().toString(),
                type: field.type || "text",
                label: field.label || "",
                required: field.required || false
              };
              
              // Tratamento específico para campos checkbox
              if (field.type === "checkbox") {
                // Verifique se checkboxOptions existe e é um array válido
                if (field.checkboxOptions && Array.isArray(field.checkboxOptions) && field.checkboxOptions.length > 0) {
                  processedField.checkboxOptions = field.checkboxOptions.map((option: any) => ({
                    id: option.id || Math.random().toString(),
                    label: option.label || "Opção",
                    isEditing: false // Estado UI inicial
                  }));
                } else {
                  // Se não existir ou não for válido, crie um valor padrão
                  processedField.checkboxOptions = [{ id: "1", label: "Opção 1", isEditing: false }];
                }
                
                console.log(`Campo checkbox processado (id: ${processedField.id}):`, processedField.checkboxOptions);
              }
              
              return processedField;
            });
            
            // Log detalhado dos campos processados
            logFieldsStructure("CAMPOS PROCESSADOS PARA EDIÇÃO", processedFields);
            
            setFields(processedFields);
            setInitialForm(data);
          }
        } catch (error) {
          console.error("Erro ao buscar formulário:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar o formulário",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchForm();
    }
  }, [id, toast]);

  useEffect(() => {
    if (location.state?.editingForm) {
      const formToEdit = location.state.editingForm;
      console.log("Formulário recebido via state:", formToEdit);
      
      setFormName(formToEdit.name || "");
      setImageUrl(formToEdit.image_url || null);
      
      // Processamento dos campos do formulário
      let processedFields: FormFieldType[] = [];
      
      if (Array.isArray(formToEdit.fields)) {
        processedFields = [...formToEdit.fields]; // Crie uma cópia para evitar mutações
      } else {
        // Se não for um array, tente converter
        try {
          processedFields = typeof formToEdit.fields === 'string' 
            ? JSON.parse(formToEdit.fields) 
            : [];
        } catch (e) {
          console.error("Erro ao processar campos do state:", e);
          processedFields = [{ id: "1", type: "text", label: "", required: false }];
        }
      }
      
      // Log para depuração
      logFieldsStructure("CAMPOS DO STATE", processedFields);
      
      // Garantir que cada campo checkbox tenha a propriedade checkboxOptions
      processedFields = processedFields.map(field => {
        if (field.type === "checkbox") {
          return {
            ...field,
            checkboxOptions: Array.isArray(field.checkboxOptions) 
              ? field.checkboxOptions 
              : [{ id: "1", label: "Opção 1" }],
            required: field.required || false
          };
        }
        return field;
      });
      
      // Log para depuração
      logFieldsStructure("CAMPOS PROCESSADOS DO STATE", processedFields);
      
      setFields(processedFields);
      setInitialForm(formToEdit);
    }
  }, [location.state]);

  // Monitor para depurar mudanças nos campos
  useEffect(() => {
    logFieldsStructure("CAMPOS ATUALIZADOS", fields);
  }, [fields]);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header responsivo: em mobile fica com título e botões empilhados */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="bg-indigo-600 h-8 w-1 rounded-full"></div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome do formulário"
                  className="text-xl font-semibold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-0 w-full transition-colors"
                  aria-label="Nome do formulário"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {fields.length} {fields.length === 1 ? "campo" : "campos"} adicionados
                </p>
              </div>
            </div>
            
            {/* Botões empilhados em mobile, lado a lado em desktop */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                onClick={() => navigate(`/view/${initialForm?.id}`)}
                disabled={!initialForm?.id}
              >
                <Eye className="h-4 w-4" />
                <span>Visualizar</span>
              </Button>
              
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Grid de 1 coluna em mobile, 2 colunas em desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Em mobile, os campos do formulário aparecem primeiro */}
          <FormFieldsList 
            fields={fields} 
            onFieldsChange={handleFieldsChange}
            className="order-1"
          />

          {/* Em mobile, o upload de imagem aparece abaixo dos campos */}
          <div className="flex justify-center order-2">
            <ImageUpload 
              onImageUpload={setImageUrl}
              currentImageUrl={imageUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;

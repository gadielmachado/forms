import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Sun, Moon } from "lucide-react";
import { useTheme, availableThemes } from "@/contexts/ThemeContext";
import { toast } from "@/components/ui/use-toast";

const Customization = () => {
  const { currentTheme, setTheme, toggleMode, isLoading } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme.id);
  const [selectedMode, setSelectedMode] = useState<'dark' | 'light'>(currentTheme.mode);
  const [activeTab, setActiveTab] = useState("themes");
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar o tema e modo selecionado quando o contexto mudar
  useEffect(() => {
    setSelectedTheme(currentTheme.id);
    setSelectedMode(currentTheme.mode);
  }, [currentTheme]);

  // Encontrar o tema selecionado
  const displayTheme = availableThemes.find((theme) => theme.id === selectedTheme);

  // Função para salvar a preferência
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      
      // Primeiro, salvar o tema
      if (selectedTheme !== currentTheme.id) {
        await setTheme(selectedTheme);
      }
      
      // Depois, salvar o modo (claro/escuro)
      if (selectedMode !== currentTheme.mode) {
        await toggleMode(selectedMode);
      }
      
      toast({
        title: "Tema salvo com sucesso",
        description: "Suas preferências de tema foram aplicadas a todos os formulários.",
      });
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências de tema.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando preferências de tema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Personalização de Formulários</h1>
        <Button 
          onClick={handleSavePreferences} 
          disabled={isSaving || (selectedTheme === currentTheme.id && selectedMode === currentTheme.mode)}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Salvando...
            </>
          ) : (
            "Salvar Preferências"
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="themes">Temas de Cores</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="fonts">Fontes</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-6">
          <p className="text-muted-foreground mb-6">
            Escolha um tema de cores para seu formulário. Os visitantes verão seu formulário com este estilo visual.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableThemes.map((theme) => (
              <div 
                key={theme.id} 
                onClick={() => setSelectedTheme(theme.id)}
                className="cursor-pointer relative"
              >
                {/* Indicador de seleção */}
                {selectedTheme === theme.id && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-md z-10">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                )}

                <Card className={`overflow-hidden border-2 transition-all ${selectedTheme === theme.id ? `${theme.colors.border} shadow-lg` : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`h-2 w-full bg-gradient-to-r ${theme.colors.primary}`}></div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{theme.name}</CardTitle>
                  </CardHeader>
                  
                  {/* Wireframe do formulário */}
                  <CardContent className="p-3">
                    {/* Cabeçalho do formulário */}
                    <div className="w-full h-6 mb-3 bg-gray-200 rounded-md"></div>
                    
                    {/* Campos do formulário */}
                    <div className="space-y-2 mb-4">
                      <div className="w-full h-8 bg-gray-100 rounded-md"></div>
                      <div className="w-full h-8 bg-gray-100 rounded-md"></div>
                      <div className="w-full h-8 bg-gray-100 rounded-md"></div>
                    </div>
                    
                    {/* Botão estilizado com a cor do tema */}
                    <div className={`w-20 h-8 rounded-md ${theme.colors.button}`}></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <p className="text-muted-foreground mb-6">
            Escolha o modo de visualização do seu formulário. Isso afetará as cores de fundo e texto.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setSelectedMode('dark')}
              className="cursor-pointer relative"
            >
              {/* Indicador de seleção para modo escuro */}
              {selectedMode === 'dark' && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-md z-10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}
              
              <Card className={`overflow-hidden border-2 transition-all ${selectedMode === 'dark' ? `border-indigo-600 shadow-lg` : 'border-gray-200 hover:border-gray-300'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" />
                    Modo Escuro
                  </CardTitle>
                  <CardDescription>Formulário com fundo escuro e texto claro</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-64 h-64 bg-gray-900 rounded-md border border-gray-800 flex flex-col p-4 items-center justify-center">
                    <div className="w-4/5 h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="w-4/5 h-8 bg-gray-800 rounded mb-3"></div>
                    <div className="w-4/5 h-8 bg-gray-800 rounded mb-3"></div>
                    <div className="w-4/5 h-8 bg-gray-800 rounded mb-3"></div>
                    <div className={`w-2/5 h-8 ${displayTheme?.colors.button.split(' ')[0]} rounded`}></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${selectedMode === 'dark' ? displayTheme?.colors.button.split(' ')[0] : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    onClick={() => setSelectedMode('dark')}
                    disabled={selectedMode === 'dark'}
                  >
                    {selectedMode === 'dark' ? "Modo Atual" : "Selecionar Modo Escuro"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div 
              onClick={() => setSelectedMode('light')}
              className="cursor-pointer relative"
            >
              {/* Indicador de seleção para modo claro */}
              {selectedMode === 'light' && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-md z-10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}
              
              <Card className={`overflow-hidden border-2 transition-all ${selectedMode === 'light' ? `border-indigo-600 shadow-lg` : 'border-gray-200 hover:border-gray-300'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Modo Claro
                  </CardTitle>
                  <CardDescription>Formulário com fundo claro e texto escuro</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-64 h-64 bg-white rounded-md border border-gray-200 flex flex-col p-4 items-center justify-center">
                    <div className="w-4/5 h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="w-4/5 h-8 bg-gray-100 rounded border border-gray-200 mb-3"></div>
                    <div className="w-4/5 h-8 bg-gray-100 rounded border border-gray-200 mb-3"></div>
                    <div className="w-4/5 h-8 bg-gray-100 rounded border border-gray-200 mb-3"></div>
                    <div className={`w-2/5 h-8 ${displayTheme?.colors.button.split(' ')[0]} rounded`}></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${selectedMode === 'light' ? displayTheme?.colors.button.split(' ')[0] : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    onClick={() => setSelectedMode('light')}
                    disabled={selectedMode === 'light'}
                  >
                    {selectedMode === 'light' ? "Modo Atual" : "Selecionar Modo Claro"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-6">
          <p className="text-muted-foreground mb-6">
            Escolha a tipografia para seu formulário. Esta opção será disponibilizada em breve.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="font-sans">
                  <div className="text-2xl font-bold mb-2">Sans-serif</div>
                  <p className="mb-4">Formulário com fonte sans-serif moderna e limpa.</p>
                  <div className="text-sm text-gray-500">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">Disponível em breve</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="font-serif">
                  <div className="text-2xl font-bold mb-2">Serif</div>
                  <p className="mb-4">Formulário com fonte serif elegante e clássica.</p>
                  <div className="text-sm text-gray-500">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">Disponível em breve</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="font-mono">
                  <div className="text-2xl font-bold mb-2">Monospace</div>
                  <p className="mb-4">Formulário com fonte monospace técnica.</p>
                  <div className="text-sm text-gray-500">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">Disponível em breve</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {displayTheme && (
        <div className="mt-8 border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-medium">Visualização</h2>
            <p className="text-sm text-gray-500">Este é um exemplo de como seu formulário ficará com o tema selecionado</p>
          </div>
          
          <div className="p-6 flex flex-col md:flex-row gap-8">
            {/* Visualização do formulário com tema selecionado */}
            <div className={`flex-1 ${selectedMode === 'dark' ? 'bg-gray-950' : 'bg-gray-100'} p-4 rounded-xl`}>
              <div className={`flex flex-col ${selectedMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-md overflow-hidden`}>
                {/* Cabeçalho do formulário */}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${selectedMode === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Exemplo de Formulário</h3>
                  <p className={`${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Preencha todos os campos abaixo</p>
                </div>
                
                {/* Campos do formulário */}
                <div className="space-y-4 mb-6">
                  <div className="space-y-1">
                    <label className={`block text-sm font-medium ${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nome completo</label>
                    <div className={`w-full px-4 py-3 rounded-lg border ${selectedMode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}></div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className={`block text-sm font-medium ${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>E-mail</label>
                    <div className={`w-full px-4 py-3 rounded-lg border ${selectedMode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}></div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className={`block text-sm font-medium ${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Mensagem</label>
                    <div className={`w-full h-24 px-4 py-3 rounded-lg border ${selectedMode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}></div>
                  </div>
                </div>
                
                {/* Botão estilizado com a cor do tema */}
                <div className={`w-full md:w-auto px-4 py-2 rounded-lg text-white font-medium ${displayTheme.colors.button} text-center`}>
                  Enviar
                </div>
              </div>
            </div>
            
            {/* Painel de informações */}
            <div className="flex-1 max-w-md">
              <h3 className="text-lg font-medium mb-4">Detalhes do tema</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Nome</div>
                  <div className="text-gray-700">{displayTheme.name}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Modo</div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {selectedMode === 'dark' ? (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Modo Escuro</span>
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Modo Claro</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Cores principais</div>
                  <div className="flex gap-2">
                    <div className={`w-8 h-8 rounded bg-gradient-to-r ${displayTheme.colors.primary}`}></div>
                    <div className={`w-8 h-8 rounded ${displayTheme.colors.button.split(" ")[0]}`}></div>
                    <div className={`w-8 h-8 rounded ${displayTheme.colors.accent}`}></div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Este tema será aplicado a:</div>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>Todos os seus formulários</li>
                    <li>Páginas de formulário visualizadas pelos usuários</li>
                    <li>Páginas de resposta</li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className={`w-full ${displayTheme.colors.button}`}
                    onClick={handleSavePreferences}
                    disabled={isSaving || (selectedTheme === currentTheme.id && selectedMode === currentTheme.mode)}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Aplicando...
                      </>
                    ) : (
                      "Aplicar este tema"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customization; 
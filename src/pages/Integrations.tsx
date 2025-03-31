import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import emailjs from '@emailjs/browser';
import { useTenant } from "@/contexts/TenantContext";
import { useLocation } from "react-router-dom";
import { Copy, CheckCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Configuração do Supabase
const supabaseUrl = 'https://pdlsbcxkbszahcmaluds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbHNiY3hrYnN6YWhjbWFsdWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NjM5NTcsImV4cCI6MjA1NTEzOTk1N30.m12oP25YLYcYtR4lZTiYDnKmRgjyp2Qx2wMX8EvoLwU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ID fixo para configuração global
const SETTINGS_ID = 1;

// Interface para formulários
interface Form {
  id: string;
  name: string;
  created_at: string;
}

export default function Integrations() {
  const { currentTenant } = useTenant();
  const [adminEmail, setAdminEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embed') === 'true';
  
  // Estados para a funcionalidade de código de incorporação
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [embedCode, setEmbedCode] = useState<string>("");
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    loadAdminEmail();
    loadForms();
  }, []);

  useEffect(() => {
    if (isEmbedded && window.parent !== window) {
      // Enviar mensagem para ajustar altura
      const sendHeight = () => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({
          type: 'soren-form-height',
          height: height
        }, '*');
      };
      
      // Enviar altura assim que o componente montar
      sendHeight();
      
      // Enviar altura quando o tamanho mudar
      window.addEventListener('resize', sendHeight);
      
      // Checar novamente após 1 segundo (para garantir que imagens sejam carregadas)
      setTimeout(sendHeight, 1000);
      
      return () => window.removeEventListener('resize', sendHeight);
    }
  }, [isEmbedded]);

  const loadAdminEmail = async () => {
    if (!currentTenant) return;

    try {
      setIsLoading(true);
      console.log("Carregando configurações...");

      const { data, error } = await supabase
        .from('settings')
        .select('admin_email')
        .eq('tenant_id', currentTenant.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log("Nenhuma configuração encontrada, será criada ao salvar");
          return;
        }
        throw error;
      }

      if (data?.admin_email) {
        setAdminEmail(data.admin_email);
        console.log("Email carregado:", data.admin_email);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar o email do administrador.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar os formulários do tenant atual
  const loadForms = async () => {
    if (!currentTenant) return;

    try {
      setIsLoadingForms(true);
      console.log("Carregando formulários...");

      const { data, error } = await supabase
        .from('forms')
        .select('id, name, created_at')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setForms(data);
        console.log("Formulários carregados:", data.length);
      }
    } catch (error) {
      console.error("Erro ao carregar formulários:", error);
      toast({
        title: "Erro ao carregar formulários",
        description: "Não foi possível carregar seus formulários. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForms(false);
    }
  };

  // Função para gerar o código de incorporação
  const generateEmbedCode = (formId: string) => {
    // Obter a URL base do site atual
    const { protocol, host } = window.location;
    const baseUrl = `${protocol}//${host}`;
    
    // Criar o código de incorporação usando iframe
    const code = `<iframe 
  src="${baseUrl}/form/view/${formId}?embed=true"
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
  title="Formulário Soren"
  allow="accelerometer; camera; microphone; geolocation" 
  loading="lazy">
</iframe>

<script>
  // Script para ajustar a altura do iframe automaticamente
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'soren-form-height') {
      const iframe = document.querySelector('iframe[src*="view/${formId}"]');
      if (iframe) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>`;
    
    return code;
  };

  // Handler para quando um formulário é selecionado
  const handleFormSelection = (formId: string) => {
    setSelectedFormId(formId);
    if (formId) {
      const code = generateEmbedCode(formId);
      setEmbedCode(code);
    } else {
      setEmbedCode("");
    }
    setCopiedToClipboard(false);
  };

  // Função para copiar o código para a área de transferência
  const copyEmbedCode = async () => {
    if (!embedCode) return;
    
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedToClipboard(true);
      toast({
        title: "Código copiado!",
        description: "O código de incorporação foi copiado para a área de transferência.",
        variant: "success",
      });
      
      // Resetar o ícone após 3 segundos
      setTimeout(() => {
        setCopiedToClipboard(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao copiar para a área de transferência:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código. Selecione-o manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEmail = async () => {
    if (!adminEmail || !currentTenant) return;

    try {
      setIsSaving(true);
      console.log("Salvando email:", adminEmail);

      const { error } = await supabase
        .from('settings')
        .upsert({
          tenant_id: currentTenant.id,
          admin_email: adminEmail,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Email do administrador atualizado com sucesso.",
        variant: "success",
      });
      
      console.log("Email salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar email:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!adminEmail || !currentTenant) return;

    try {
      setIsTesting(true);
      console.log("Enviando email de teste para:", adminEmail);

      // Usar a mesma origem da página atual para a API
      const { protocol, host } = window.location;
      const apiUrl = `${protocol}//${host}`;
      
      console.log('URL da API:', `${apiUrl}/api/email/test-email`);

      const response = await fetch(`${apiUrl}/api/email/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailDestino: adminEmail })
      });

      // Obter a resposta como texto primeiro
      const responseText = await response.text();
      console.log('Resposta bruta:', responseText);
      
      // Tentar converter para JSON, se possível
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error('Erro ao processar resposta JSON:', error);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(`Falha no envio: ${data.error || response.statusText}`);
      }

      toast({
        title: "Email de teste enviado",
        description: "Verifique sua caixa de entrada. O email foi enviado de contato@sorenmarketing.com.br",
        variant: "success",
      });
    } catch (error) {
      console.error("Erro detalhado:", error);
      
      let errorMessage = "Não foi possível enviar o email de teste.";
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Erro de conexão com o servidor. Verifique se o servidor backend está rodando.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Erro no envio",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestEmailJS = async () => {
    if (!adminEmail || !currentTenant) return;

    try {
      setIsTesting(true);
      
      // Usar o ID de template correto e formato de parâmetros correto
      const result = await emailjs.send(
        'service_1brm6jm',
        'template_zhbnvj4',
        {
          from_name: "Soren Forms",
          to_email: adminEmail,
          formulario: "Teste Direto EmailJS",
          data: new Date().toLocaleDateString('pt-BR'),
          respostas_html: `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Teste</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">Este é um teste direto do EmailJS</td>
            </tr>
          `,
          reply_to: "sorensolucoesdigitais@gmail.com"
        },
        'TYGTN6iQMuk1SSehj'
      );

      console.log("Resultado do envio:", result);
      
      toast({
        title: "Email de teste enviado",
        description: `Email enviado com sucesso! Status: ${result.text}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Erro no teste direto do EmailJS:", error);
      
      toast({
        title: "Erro no envio",
        description: `Falha ao enviar email: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Integrações</h2>
        <div className="grid gap-6">
          {/* Card de Integração de Email */}
          <Card>
            <CardHeader>
              <CardTitle>Integração de Email</CardTitle>
              <CardDescription>
                Configure o email que receberá as respostas dos formulários via Mandrill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email do Administrador</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEmail}
                  disabled={isSaving || !adminEmail || isLoading}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={isTesting || !adminEmail || isLoading}
                >
                  {isTesting ? "Enviando..." : "Testar Envio"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleTestEmailJS}
                  disabled={isTesting || !adminEmail || isLoading}
                >
                  Testar EmailJS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Novo Card para Código de Incorporação */}
          <Card>
            <CardHeader>
              <CardTitle>Código de Incorporação</CardTitle>
              <CardDescription>
                Incorpore seus formulários em outros sites como WordPress, Wix, Framer ou qualquer projeto com código
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formSelect">Selecione um formulário</Label>
                <Select 
                  value={selectedFormId}
                  onValueChange={handleFormSelection}
                >
                  <SelectTrigger id="formSelect" disabled={isLoadingForms}>
                    <SelectValue placeholder="Selecione um formulário" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map(form => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFormId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="embedCode">Código de incorporação</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyEmbedCode}
                      disabled={!embedCode}
                      className="h-8 px-2"
                    >
                      {copiedToClipboard ? (
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs">
                        {copiedToClipboard ? "Copiado!" : "Copiar"}
                      </span>
                    </Button>
                  </div>
                  <Textarea
                    id="embedCode"
                    value={embedCode}
                    readOnly
                    rows={8}
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Cole este código HTML em qualquer lugar onde você queira exibir o formulário. O iframe se ajustará automaticamente à altura do conteúdo.
                  </p>
                </div>
              )}

              {!selectedFormId && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-300">
                  <p>Selecione um formulário para gerar o código de incorporação.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}
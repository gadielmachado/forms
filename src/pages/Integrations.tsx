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

// Configuração do Supabase
const supabaseUrl = 'https://pdlsbcxkbszahcmaluds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbHNiY3hrYnN6YWhjbWFsdWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NjM5NTcsImV4cCI6MjA1NTEzOTk1N30.m12oP25YLYcYtR4lZTiYDnKmRgjyp2Qx2wMX8EvoLwU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ID fixo para configuração global
const SETTINGS_ID = 1;

export default function Integrations() {
  const { currentTenant } = useTenant();
  const [adminEmail, setAdminEmail] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embed') === 'true';

  useEffect(() => {
    loadAdminEmail();
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
        .select('admin_email, redirect_url')
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
      
      if (data?.redirect_url) {
        setRedirectUrl(data.redirect_url);
        console.log("URL de redirecionamento carregado:", data.redirect_url);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!adminEmail || !currentTenant) return;

    try {
      setIsSaving(true);
      console.log("Salvando email:", adminEmail);
      console.log("Salvando URL de redirecionamento:", redirectUrl);

      const { error } = await supabase
        .from('settings')
        .upsert({
          tenant_id: currentTenant.id,
          admin_email: adminEmail,
          redirect_url: redirectUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Configurações atualizadas com sucesso.",
        variant: "success",
      });
      
      console.log("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
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
          
          <Card>
            <CardHeader>
              <CardTitle>Redirecionamento</CardTitle>
              <CardDescription>
                Configure uma URL para redirecionar o usuário após o envio do formulário (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redirectUrl">URL de Redirecionamento</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  placeholder="https://exemplo.com/obrigado"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  disabled={isLoading || isSaving}
                />
                <p className="text-sm text-gray-500">
                  Deixe em branco se não desejar redirecionamento após o envio.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEmail}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}
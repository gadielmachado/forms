import express from "express";
import mandrill from "mandrill-api/mandrill";
import { Router } from "express";
import dotenv from "dotenv";

// Garante que as variáveis de ambiente sejam carregadas
dotenv.config();

const router = Router();

// Nova API key gerada especificamente para o curso
const MANDRILL_API_KEY = 'md-VoWPtYsKLUib4f2HqAzQmB'; // API key dedicada ao curso
const SENDER_EMAIL = 'contato@sorenmarketing.com.br';

// Debug mode - DESATIVADO para produção
const TEST_MODE = false; 
const DEBUG_EMAIL = "gadiel@sorenmarketing.com.br"; // Email para debugging

// Validação das variáveis de ambiente
console.log('⚙️ Configurações de email:');
console.log(`- Email remetente: ${SENDER_EMAIL}`);
console.log(`- API Mandrill: ${MANDRILL_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);
console.log(`- Modo teste: ${TEST_MODE ? 'ATIVADO' : 'Desativado'}`);

// Inicializando cliente Mandrill
const client = new mandrill.Mandrill(MANDRILL_API_KEY);

// Função de envio de email unificada (usando Promises para consistência)
const sendEmail = (messageObj) => {
  return new Promise((resolve, reject) => {
    client.messages.send(
      { message: messageObj },
      (result) => {
        console.log("✅ Email enviado com sucesso:", JSON.stringify(result, null, 2));
        
        // Log detalhado de cada destinatário
        result.forEach(r => {
          console.log(`📧 Status para ${r.email}: ${r.status}`);
          if (r.reject_reason) {
            console.log(`❌ Motivo de rejeição: ${r.reject_reason}`);
          }
        });
        
        resolve(result);
      },
      (error) => {
        console.error("❌ Erro ao enviar email:", error);
        reject(error);
      }
    );
  });
};

// Rota para testar se o servidor está funcionando
router.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    mandrill: {
      configured: Boolean(MANDRILL_API_KEY),
      sender: SENDER_EMAIL,
      test_mode: TEST_MODE
    }
  });
});

// Rota para enviar email de teste
router.post("/test-email", async (req, res) => {
  try {
    const { emailDestino } = req.body;

    if (!emailDestino) {
      console.error("❌ Email de destino não fornecido");
      return res.status(400).json({ 
        success: false, 
        error: "Email de destino não fornecido" 
      });
    }

    console.log('🧪 Iniciando teste de envio para:', emailDestino);
    
    const messageObj = {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4361ee;">Teste de Email - Ephesus.App</h1>
          <p>Este é um email de teste para confirmar que a integração com Mandrill está funcionando corretamente.</p>
          <p>Se você está recebendo este email, significa que a configuração está correta!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Enviado por Ephesus.App em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `,
      subject: "Teste de Email - Ephesus.App",
      from_email: SENDER_EMAIL,
      from_name: "Ephesus.App",
      to: [
        {
          email: emailDestino,
          type: "to"
        }
      ],
      headers: {
        "Reply-To": SENDER_EMAIL
      }
    };

    const result = await sendEmail(messageObj);
    
    res.json({ 
      success: true, 
      message: "Email de teste enviado com sucesso!",
      details: result 
    });
  } catch (error) {
    console.error("❌ Erro completo:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Falha ao enviar email"
    });
  }
});

// Rota para enviar email de resposta do formulário
router.post("/form-response", async (req, res) => {
  console.log('📝 [FORM-RESPONSE] Processando nova requisição');
  
  try {
    console.log('📨 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const { resposta, emailDestino } = req.body;

    // Validação dos dados
    if (!resposta) {
      console.error('❌ Objeto "resposta" não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: "Dados do formulário não fornecidos" 
      });
    }
    
    if (!emailDestino) {
      console.error('❌ Email de destino não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: "Email de destino não fornecido" 
      });
    }

    console.log(`📧 Enviando para: ${emailDestino}`);
    console.log(`📋 Formulário: ${resposta.nomeDoFormulario || "Nome não fornecido"}`);
    
    // Criar tabela HTML com as respostas
    let tabelaRespostas = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Campo</th>
          <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Resposta</th>
        </tr>
      </thead>
      <tbody>
    `;

    // Adicionar cada resposta à tabela
    Object.entries(resposta.campos || {}).forEach(([campo, valor]) => {
      tabelaRespostas += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${campo}</strong></td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${valor}</td>
        </tr>
      `;
    });

    tabelaRespostas += `
      </tbody>
    </table>`;

    // Montar HTML completo do email
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee; border-bottom: 2px solid #4361ee; padding-bottom: 10px;">
          Nova Resposta do Formulário
        </h1>
        
        <p><strong>Formulário:</strong> ${resposta.nomeDoFormulario || "Formulário"}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <h2 style="color: #3a0ca3; margin-top: 25px;">Respostas Submetidas</h2>
        ${tabelaRespostas}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>Este é um email automático enviado pelo Ephesus.App</p>
        </div>
      </div>
    `;

    // Configurar objeto de mensagem para o Mandrill
    const messageObj = {
      html: htmlMessage,
      subject: `Nova resposta: ${resposta.nomeDoFormulario || "Formulário"}`,
      from_email: SENDER_EMAIL,
      from_name: "Ephesus.App",
      to: [
        {
          email: emailDestino,
          name: "Administrador",
          type: "to"
        },
        // Email adicional para debug quando TEST_MODE estiver ativado
        ...(TEST_MODE && DEBUG_EMAIL !== emailDestino ? [{
          email: DEBUG_EMAIL,
          name: "Debug",
          type: "bcc" // Usando BCC para não expor esse email ao destinatário principal
        }] : [])
      ],
      headers: {
        "Reply-To": SENDER_EMAIL
      },
      important: true,
      track_opens: true,
      track_clicks: true
    };

    console.log("📤 Enviando email via Mandrill...");
    
    // Usar a função unificada de envio
    const result = await sendEmail(messageObj);
    
    res.status(200).json({ 
      success: true, 
      message: "Email enviado com sucesso", 
      result 
    });
  } catch (error) {
    console.error("❌ Erro completo:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Erro desconhecido" 
    });
  }
});

// Rota para testar diretamente via navegador
router.get("/test-direct", async (req, res) => {
  try {
    const testEmail = req.query.email || 'gadiel@sorenmarketing.com.br';
    
    console.log(`🧪 Teste direto para: ${testEmail}`);
    
    const messageObj = {
      html: `
        <p>Teste direto via rota API: ${new Date().toISOString()}</p>
        <p>Esta é uma mensagem de teste enviada diretamente pela rota /test-direct</p>
      `,
      subject: "Teste Direto API - Ephesus",
      from_email: SENDER_EMAIL,
      from_name: "Ephesus App",
      to: [
        {
          email: testEmail,
          type: "to"
        }
      ]
    };
    
    const result = await sendEmail(messageObj);
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Erro no teste direto:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 
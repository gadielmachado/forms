import * as postmark from 'postmark';
import dotenv from 'dotenv';

dotenv.config();

// Utilizar valores fixos se as variáveis de ambiente não estiverem disponíveis
const API_KEY = process.env.POSTMARK_API_KEY || '83a66049-9421-4666-b61e-063dfc7bf7a9';
const SENDER = process.env.SENDER_EMAIL || 'gadiel@sorenmarketing.com.br';

// Criar cliente Postmark com a API key
const client = new postmark.ServerClient(API_KEY);

/**
 * Envia um email usando o Postmark
 */
export async function sendEmail(to, subject, htmlBody) {
  try {
    console.log('Iniciando envio de email via serviço:', {
      de: SENDER,
      para: to,
      assunto: subject
    });
    
    // Enviar o email via Postmark
    const response = await client.sendEmail({
      From: SENDER,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: 'outbound'
    });
    
    console.log('Email enviado com sucesso:', response.MessageID);
    return { success: true, messageId: response.MessageID };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao enviar email' 
    };
  }
} 
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Stripe com a chave secreta da API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração para não usar o body parser para webhooks do Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para processar o buffer de dados
const buffer = async (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Método não permitido' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não está configurado');
    return res.status(500).send('Erro de configuração do webhook');
  }

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Erro no webhook: ${err.message}`);
    return res.status(400).send(`Erro no webhook: ${err.message}`);
  }

  console.log(`Evento recebido: ${event.type}`);

  try {
    // Processar eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extrair metadados que contêm o ID do usuário
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_details?.email;
        
        if (!userId && !customerEmail) {
          console.error('Não foi possível identificar o usuário');
          break;
        }
        
        // Buscar usuário por email se o userId não estiver disponível
        let userRecord;
        
        if (userId) {
          const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.error('Erro ao buscar usuário:', error);
          } else {
            userRecord = user;
          }
        } else if (customerEmail) {
          // Buscar usuário pelo email
          const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', customerEmail)
            .single();
            
          if (error) {
            console.error('Erro ao buscar usuário por email:', error);
          } else {
            userRecord = user;
          }
        }
        
        if (userRecord) {
          // Atualizar status do usuário
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({ 
              status_assinatura: 'ativo',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              data_atualizacao: new Date().toISOString()
            })
            .eq('id', userRecord.id);
            
          if (updateError) {
            console.error('Erro ao atualizar usuário:', updateError);
          } else {
            console.log(`Usuário ${userRecord.id} atualizado com sucesso`);
            
            // TODO: Enviar email de confirmação
            // await enviarEmailConfirmacao(customerEmail);
          }
        } else {
          console.error('Usuário não encontrado');
        }
        
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          console.error('ID da assinatura não encontrado');
          break;
        }
        
        // Obter detalhes da assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(subscription.current_period_end * 1000);
        
        // Atualizar usuário no banco de dados
        const { error } = await supabase
          .from('usuarios')
          .update({ 
            status_assinatura: 'ativo',
            data_expiracao: periodEnd.toISOString(),
            data_atualizacao: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        if (error) {
          console.error('Erro ao atualizar após pagamento:', error);
        } else {
          console.log(`Assinatura ${subscriptionId} renovada até ${periodEnd}`);
        }
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerEmail = invoice.customer_email;
        
        if (!subscriptionId) {
          console.error('ID da assinatura não encontrado');
          break;
        }
        
        // Marcar assinatura como pendente de pagamento
        const { error } = await supabase
          .from('usuarios')
          .update({ 
            status_assinatura: 'pendente',
            data_atualizacao: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        if (error) {
          console.error('Erro ao atualizar status pendente:', error);
        } else {
          console.log(`Pagamento falhou para assinatura ${subscriptionId}`);
          
          // TODO: Enviar email de falha no pagamento
          // await enviarEmailFalhaPagamento(customerEmail);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        if (!subscriptionId) {
          console.error('ID da assinatura não encontrado');
          break;
        }
        
        // Cancelar acesso do usuário
        const { error } = await supabase
          .from('usuarios')
          .update({ 
            status_assinatura: 'cancelado',
            data_expiracao: new Date().toISOString(),
            data_atualizacao: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        if (error) {
          console.error('Erro ao cancelar assinatura:', error);
        } else {
          console.log(`Assinatura ${subscriptionId} cancelada`);
          
          // TODO: Enviar email de cancelamento
          // await enviarEmailCancelamento(user.email);
        }
        
        break;
      }
      
      default:
        console.log(`Evento não processado: ${event.type}`);
    }
  } catch (error) {
    console.error(`Erro ao processar evento ${event.type}:`, error);
  }

  // Responder com sucesso ao Stripe
  res.status(200).json({ received: true });
} 
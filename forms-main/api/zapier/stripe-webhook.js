import Stripe from 'stripe';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Stripe com a chave secreta da API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Aceitar tanto métodos GET quanto POST para facilitar teste e integração com Zapier
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter sessão ID do parâmetro da query (GET) ou do body (POST)
    const sessionId = 
      req.method === 'GET' 
        ? req.query.session_id 
        : (req.body?.session_id || req.body?.data?.session_id);

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'ID da sessão não fornecido',
        received_query: req.query,
        received_body: req.body 
      });
    }

    console.log(`Buscando informações da sessão: ${sessionId}`);

    // Buscar informações da sessão no Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'payment_intent', 'subscription']
      });

      // Extrair informações úteis da sessão
      const responseData = {
        success: true,
        session_id: session.id,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        payment_status: session.payment_status,
        subscription_id: session.subscription?.id,
        subscription_status: session.subscription?.status,
        total_amount: session.amount_total,
        currency: session.currency,
        created_at: new Date(session.created * 1000).toISOString(),
        metadata: session.metadata || {},
        customer_id: session.customer,
        is_test_mode: session.id.startsWith('cs_test_')
      };

      console.log('Sessão encontrada e processada com sucesso');
      return res.status(200).json(responseData);
      
    } catch (stripeError) {
      // Tratar erros específicos do Stripe
      console.error('Erro ao buscar sessão do Stripe:', stripeError);
      
      return res.status(404).json({
        error: 'Sessão não encontrada',
        message: stripeError.message,
        type: stripeError.type,
        session_id: sessionId,
        stripe_error: true,
        detail: `Verifique se o ID da sessão está correto e se você está usando o ambiente correto (teste/produção)`,
        is_test_mode: sessionId.startsWith('cs_test_'),
        help: 'Certifique-se de que está usando a API key do ambiente correto no Zapier'
      });
    }
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
} 
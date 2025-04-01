import Stripe from 'stripe';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Stripe com a chave secreta da API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'ID do preço é obrigatório' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Email do usuário é obrigatório' });
    }

    // Configurar metadados com informações do usuário
    const metadata = {
      userId: userId || '',
    };

    // URL de retorno após pagamento bem-sucedido
    const success_url = successUrl || `${req.headers.origin || process.env.WEBSITE_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    
    // URL de retorno após cancelamento
    const cancel_url = cancelUrl || `${req.headers.origin || process.env.WEBSITE_URL}/cancelado`;

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // ou 'payment' para pagamento único
      success_url,
      cancel_url,
      customer_email: userEmail,
      metadata,
      allow_promotion_codes: true,
    });

    // Retornar a URL da sessão para o cliente redirecionar
    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      error: 'Falha ao criar sessão de pagamento',
      message: error.message 
    });
  }
} 
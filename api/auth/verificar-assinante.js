import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Stripe com tratamento de erro
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      timeout: 5000 // 5 segundos de timeout para requisições Stripe
    });
  }
} catch (error) {
  console.error('Erro ao inicializar Stripe:', error);
}

// Inicializar Supabase com tratamento de erro
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
  } else {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }
} catch (error) {
  console.error('Erro ao inicializar Supabase:', error);
}

export default async function handler(req, res) {
  // Se o Stripe não estiver configurado, retornar mensagem amigável
  if (!stripe) {
    return res.status(500).json({ 
      success: false, 
      message: "Para criar sua conta no Soren Forms, você precisa ser um assinante. Por favor, adquira uma assinatura para continuar."
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    // Definir timeout para a Promise geral
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000); // 3 segundos de timeout
    });

    // Buscar cliente pelo email no Stripe com timeout
    const customerPromise = stripe.customers.list({
      email: email,
      limit: 1
    });

    // Usar race para aplicar o timeout
    const customers = await Promise.race([customerPromise, timeoutPromise])
      .catch(error => {
        if (error.message === 'Timeout') {
          console.error('Timeout ao buscar cliente no Stripe');
          return { data: [] };
        }
        throw error;
      });

    if (customers.data.length === 0) {
      console.log(`Nenhum cliente encontrado para o email: ${email}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Para criar sua conta no Soren Forms, você precisa ter uma assinatura ativa. Adquira agora e tenha acesso a todos os recursos.'
      });
    }

    console.log(`Cliente encontrado para o email ${email}: ${JSON.stringify(customers.data[0])}`);
    const customerId = customers.data[0].id;

    // Buscar assinatura ativa para o cliente com timeout
    const subscriptionPromise = stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    // Usar race para aplicar o timeout (reaproveitando o timeoutPromise)
    const subscriptions = await Promise.race([subscriptionPromise, new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000);
    })]).catch(error => {
      if (error.message === 'Timeout') {
        console.error('Timeout ao buscar assinaturas no Stripe');
        return { data: [] };
      }
      throw error;
    });

    if (subscriptions.data.length === 0) {
      console.log(`Nenhuma assinatura ativa encontrada para o cliente: ${customerId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Sua assinatura não está ativa. Renove agora para criar sua conta e aproveitar todos os recursos do Soren Forms.'
      });
    }

    console.log(`Assinatura ativa encontrada: ${JSON.stringify(subscriptions.data[0])}`);
    // Cliente possui assinatura ativa
    return res.status(200).json({ 
      success: true,
      customer: {
        id: customerId,
        subscription_id: subscriptions.data[0].id
      }
    });
  } catch (error) {
    console.error('Erro ao verificar assinante:', error);
    return res.status(500).json({
      success: false,
      message: "Não foi possível verificar sua assinatura. Para criar uma conta no Soren Forms, você precisa ser um assinante ativo. Adquira sua assinatura agora."
    });
  }
} 
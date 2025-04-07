import Stripe from 'stripe';

// Utilizamos variáveis de ambiente para não expor as chaves no código
// IMPORTANTE: Nunca adicione chaves diretamente no código
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

// Verificação de segurança para garantir que a chave está definida
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente');
}

// Cliente do Stripe para uso no servidor (backend)
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Usar a versão mais recente da API
});

// Exportando a chave pública para uso no frontend
export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Verificação de segurança para garantir que a chave pública está definida
if (!STRIPE_PUBLIC_KEY) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está configurada nas variáveis de ambiente');
} 
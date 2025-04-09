/**
 * Utilitário para verificação de assinaturas Stripe
 * 
 * Este arquivo contém funções para verificar se um email tem uma assinatura ativa.
 * Em produção, isso deve ser substituído por uma verificação real no servidor.
 */

// Emails para simular assinantes ativos
const SUBSCRIBED_EMAILS = [
  "assinante@example.com",
  "cliente@gmail.com",
  "paid@test.com",
  "subscriber@domain.com",
  // Adicione o email que você usou para comprar a assinatura
  "gadielmachado.bm@gmail.com",
  "gadielbizarramachado@gmail.com",
  "gadyel.bm@gmail.com",
  "gadielmachado01@gmail.com"
];

/**
 * Verifica se um email está associado a uma assinatura ativa
 * 
 * @param email Email a ser verificado
 * @returns Promise<boolean> True se for assinante, false caso contrário
 */
export const verifySubscription = async (email: string): Promise<boolean> => {
  // Simula um pequeno atraso para parecer uma verificação real
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Verifica se o email está na lista de assinantes
  return SUBSCRIBED_EMAILS.includes(email.toLowerCase());
};

/**
 * Informações de checkout e links para assinatura
 */
export const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/6oEg225u68Ivf2obIJ";

/**
 * Mensagens de erro padronizadas
 */
export const SUBSCRIPTION_MESSAGES = {
  CHECKING: "Verificando sua assinatura...",
  REQUIRED: "Para criar sua conta no Soren Forms, você precisa ser um assinante. Por favor, adquira uma assinatura para continuar.",
  NETWORK_ERROR: "Não foi possível verificar sua assinatura. Por favor, verifique sua conexão ou adquira uma assinatura para continuar."
}; 
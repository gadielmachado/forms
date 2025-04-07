import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type SubscriptionStatus = 'ativo' | 'pendente' | 'cancelado' | 'inativo' | 'loading' | 'error';

interface SubscriptionData {
  status: SubscriptionStatus;
  expiresAt: Date | null;
  isActive: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  error: Error | null;
}

/**
 * Hook para verificar e gerenciar o status da assinatura do usuário
 */
export function useSubscription(userId: string | undefined) {
  // Se não tiver userId, retorna estado inativo
  if (!userId) {
    return {
      status: 'inativo' as SubscriptionStatus,
      expiresAt: null,
      isActive: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  // Buscar dados da assinatura do usuário
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userSubscription', userId],
    queryFn: async () => {
      // Buscar usuário no Supabase
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('status_assinatura, data_expiracao, stripe_customer_id, stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      // Verifica se a assinatura está ativa e não expirada
      const isActive = 
        userData?.status_assinatura === 'ativo' && 
        (!userData.data_expiracao || new Date(userData.data_expiracao) > new Date());

      return {
        status: userData?.status_assinatura || 'inativo',
        expiresAt: userData?.data_expiracao ? new Date(userData.data_expiracao) : null,
        isActive,
        stripeCustomerId: userData?.stripe_customer_id || null,
        stripeSubscriptionId: userData?.stripe_subscription_id || null,
      };
    },
  });

  const subscriptionData: SubscriptionData = {
    status: isLoading ? 'loading' : error ? 'error' : data?.status || 'inativo',
    expiresAt: data?.expiresAt || null,
    isActive: data?.isActive || false,
    stripeCustomerId: data?.stripeCustomerId || null,
    stripeSubscriptionId: data?.stripeSubscriptionId || null,
    error: error as Error | null,
  };

  return {
    ...subscriptionData,
    refetch,
  };
} 
// API para obter configurações específicas de tenant
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase com variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar tenant_id
    const tenantId = req.query.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'tenant_id é obrigatório' });
    }
    
    console.log('API: Buscando configurações do tenant:', tenantId);
    
    // Tentar buscar as configurações do tenant - primeiro na tabela específica
    let adminEmail = null;
    
    try {
      // Primeira tentativa: tenant_settings
      const { data: tenantSettings, error: tenantError } = await supabase
        .from('tenant_settings')
        .select('admin_email')
        .eq('tenant_id', tenantId)
        .maybeSingle();
        
      if (!tenantError && tenantSettings?.admin_email) {
        adminEmail = tenantSettings.admin_email;
        console.log('API: Email encontrado em tenant_settings:', adminEmail);
      }
    } catch (err) {
      console.warn('API: Erro ao buscar de tenant_settings:', err);
    }
    
    // Segunda tentativa: profiles
    if (!adminEmail) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', tenantId)
          .maybeSingle();
          
        if (!profileError && profile?.email) {
          adminEmail = profile.email;
          console.log('API: Email encontrado no perfil:', adminEmail);
        }
      } catch (err) {
        console.warn('API: Erro ao buscar de profiles:', err);
      }
    }
    
    // Terceira tentativa: forms (user_id)
    if (!adminEmail) {
      try {
        // Buscar o owner_id do formulário
        const { data: formOwner, error: formError } = await supabase
          .from('forms')
          .select('user_id')
          .eq('tenant_id', tenantId)
          .limit(1)
          .maybeSingle();
          
        if (!formError && formOwner?.user_id) {
          // Buscar o email do usuário
          const { data: ownerProfile, error: ownerError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', formOwner.user_id)
            .maybeSingle();
            
          if (!ownerError && ownerProfile?.email) {
            adminEmail = ownerProfile.email;
            console.log('API: Email encontrado via owner:', adminEmail);
          }
        }
      } catch (err) {
        console.warn('API: Erro ao buscar via forms/owner:', err);
      }
    }
    
    // Retornar o resultado
    return res.status(200).json({
      admin_email: adminEmail || 'contato@sorenmarketing.com.br', // Email padrão como fallback
      tenant_id: tenantId
    });
    
  } catch (error) {
    console.error('API: Erro ao buscar configurações do tenant:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
} 
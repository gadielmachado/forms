// API para obter configurações do sistema
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
    console.log('API: Buscando configurações');
    
    // Determinar tenant_id
    let tenantId = null;
    
    // Verificar query string
    if (req.query.tenant_id) {
      tenantId = req.query.tenant_id;
      console.log('API: Usando tenant_id da query string:', tenantId);
    }
    
    // Tentar diferentes estratégias para buscar as configurações
    let adminEmail = null;
    
    // 1. Tentar a tabela tenant_settings com tenant_id
    if (tenantId) {
      try {
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
        console.log('API: Erro ao buscar de tenant_settings:', err);
      }
    }
    
    // 2. Tentar a tabela settings global
    if (!adminEmail) {
      try {
        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('admin_email')
          .eq('id', 1)
          .maybeSingle();
          
        if (!settingsError && settings?.admin_email) {
          adminEmail = settings.admin_email;
          console.log('API: Email encontrado em settings:', adminEmail);
        }
      } catch (err) {
        console.log('API: Erro ao buscar de settings:', err);
      }
    }
    
    // 3. Tentar obter do perfil do usuário
    if (!adminEmail && tenantId) {
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
        console.log('API: Erro ao buscar de profiles:', err);
      }
    }
    
    // Retornar as configurações
    return res.status(200).json({
      admin_email: adminEmail || 'contato@sorenmarketing.com.br', // Email padrão como fallback
      tenant_id: tenantId
    });
    
  } catch (error) {
    console.error('API: Erro ao buscar configurações:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
} 
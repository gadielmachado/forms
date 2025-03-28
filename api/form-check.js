// API para verificar a existência de um formulário no Supabase
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar CORS para permitir acesso
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder imediatamente às requisições OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas processar requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter o ID do formulário e tenant_id (opcional) da query
    const { formId, tenant_id } = req.query;
    
    if (!formId) {
      return res.status(400).json({ error: 'ID do formulário não fornecido' });
    }

    console.log(`Verificando formulário com ID: ${formId}${tenant_id ? `, Tenant ID: ${tenant_id}` : ''}`);

    // Inicializar o cliente Supabase com a URL e a chave anônima
    const supabaseUrl = process.env.SUPABASE_URL || 'https://pdlsbcxkbszahcmaluds.supabase.co';
    
    // REVERTER PARA A CHAVE ANÔNIMA em vez da SERVICE_ROLE
    // Isso vai fazer com que as políticas RLS sejam respeitadas novamente
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    // Criar cliente Supabase com a chave anônima para respeitar RLS
    console.log('Criando cliente Supabase com chave anônima (RLS ativado)');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Construir a consulta com base nos parâmetros fornecidos
    let query = supabase
      .from('forms')
      .select('id, name, tenant_id, user_id, created_at, fields')
      .eq('id', formId.trim())
      .limit(1);
    
    // Se um tenant_id foi fornecido, adicionar filtro para garantir isolamento dos dados
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id.trim());
    }
    
    // Executar a consulta
    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar formulário:', error);
      return res.status(500).json({ error: `Erro ao consultar banco de dados: ${error.message}` });
    }

    if (!data || data.length === 0) {
      // Se tenant_id foi fornecido, tentar buscar novamente sem o filtro para diagnóstico
      if (tenant_id) {
        const { data: checkData } = await supabase
          .from('forms')
          .select('id, tenant_id')
          .eq('id', formId.trim())
          .limit(1);
        
        if (checkData && checkData.length > 0) {
          // Formulário existe, mas pertence a outro tenant
          console.log(`Formulário existe mas pertence ao tenant: ${checkData[0].tenant_id}, não ao tenant: ${tenant_id}`);
          return res.status(403).json({ 
            exists: true,
            accessible: false,
            message: 'Formulário existe mas pertence a outro tenant', 
            formId,
            requestedTenant: tenant_id,
            actualTenant: checkData[0].tenant_id
          });
        }
      }
      
      console.log(`Formulário com ID ${formId} não encontrado`);
      return res.status(404).json({ 
        exists: false, 
        message: 'Formulário não encontrado', 
        formId 
      });
    }

    // Formulário encontrado
    console.log(`Formulário com ID ${formId} encontrado com sucesso`);
    return res.status(200).json({
      exists: true,
      accessible: true,
      formId,
      form: data[0],
      message: 'Formulário encontrado'
    });

  } catch (error) {
    console.error('Erro não tratado:', error);
    return res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
} 
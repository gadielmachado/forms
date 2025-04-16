// Proxy API para OpenAI na Vercel
import fetch from 'node-fetch';
import { OpenAI } from 'openai';

// Configurações e limites para evitar timeouts na Vercel
const LIMITES = {
  TIMEOUT_FUNCAO_MS: 9000,       // 9 segundos para toda a função (Vercel tem limite de 10s)
  TIMEOUT_API_MS: 6000,          // 6 segundos para chamada da API
  TAMANHO_MAX_MENSAGEM: 1200,    // Caracteres por mensagem
  TAMANHO_MAX_PROMPT: 6000,      // Caracteres totais
  MAX_TOKENS: 400,               // Tokens na resposta
  TENTATIVAS_MAX: 0              // Sem retentativas (melhor falhar rápido)
};

// Função para verificar se está se aproximando do timeout
function verificarTimeout(tempoInicio, limiteMs = LIMITES.TIMEOUT_FUNCAO_MS * 0.7) {
  const agora = Date.now();
  const tempoDecorrido = agora - tempoInicio;
  return tempoDecorrido > limiteMs;
}

// Função para truncar mensagens longas
function truncarMensagens(mensagens, tamanhoMax = LIMITES.TAMANHO_MAX_MENSAGEM) {
  return mensagens.map(msg => {
    if (msg.content && msg.content.length > tamanhoMax) {
      console.log(`[OpenAI] Mensagem truncada de ${msg.content.length} para ${tamanhoMax} caracteres`);
      return {
        ...msg,
        content: msg.content.substring(0, tamanhoMax) + "... [truncado]"
      };
    }
    return msg;
  });
}

export default async function handler(req, res) {
  const inicioFuncao = Date.now();
  console.log(`[OpenAI] Início da requisição: ${new Date(inicioFuncao).toISOString()}`);
  
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Verificar método OPTIONS (pre-flight)
  if (req.method === 'OPTIONS') {
    console.log("[OpenAI] Requisição OPTIONS (pre-flight)");
    res.status(200).end();
    return;
  }

  // Verificar se é POST
  if (req.method !== 'POST') {
    console.error(`[OpenAI] Método inválido: ${req.method}`);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar corpo da requisição
    if (!req.body) {
      console.error('[OpenAI] Corpo da requisição ausente');
      return res.status(400).json({ error: 'O corpo da requisição está vazio' });
    }
    
    console.log(`[OpenAI] Corpo recebido: ${JSON.stringify(req.body).substring(0, 100)}...`);
    
    // Validar campos obrigatórios
    const { model, messages, temperature, max_tokens } = req.body;
    
    if (!model) {
      console.error('[OpenAI] Campo model não fornecido');
      return res.status(400).json({ error: 'O campo model é obrigatório' });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('[OpenAI] Campo messages inválido', messages);
      return res.status(400).json({ error: 'O campo messages deve ser um array não vazio' });
    }

    // Truncar mensagens longas
    const mensagensTruncadas = truncarMensagens(messages);
    
    // Verificar tamanho total do prompt
    let tamanhoTotalPrompt = 0;
    mensagensTruncadas.forEach(msg => {
      tamanhoTotalPrompt += msg.content ? msg.content.length : 0;
    });
    console.log(`[OpenAI] Tamanho total do prompt: ${tamanhoTotalPrompt} caracteres`);

    // Abortar se o prompt for muito grande
    if (tamanhoTotalPrompt > LIMITES.TAMANHO_MAX_PROMPT) {
      console.warn(`[OpenAI] Prompt muito grande (${tamanhoTotalPrompt} caracteres)`);
      return res.status(413).json({
        error: 'Prompt muito grande. Reduza o tamanho do conteúdo.',
        tamanho_atual: tamanhoTotalPrompt,
        tamanho_maximo: LIMITES.TAMANHO_MAX_PROMPT
      });
    }

    // Limitar max_tokens
    const tokensMaximos = Math.min(max_tokens || LIMITES.MAX_TOKENS, LIMITES.MAX_TOKENS);
    
    console.log(`[OpenAI] Model: ${model}`);
    console.log(`[OpenAI] Mensagens: ${messages.length}`);
    console.log(`[OpenAI] Temperature: ${temperature || 0.7}`);
    console.log(`[OpenAI] Max tokens: ${tokensMaximos}`);

    // Obter API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('[OpenAI] API key não encontrada');
      return res.status(500).json({ error: 'API key não configurada no servidor' });
    }
    
    // Verificar tempo antes de iniciar chamada
    if (verificarTimeout(inicioFuncao, LIMITES.TIMEOUT_FUNCAO_MS * 0.5)) {
      console.error('[OpenAI] Processamento preliminar demorou muito');
      return res.status(503).json({
        error: 'Servidor ocupado, tente novamente',
        tempo_decorrido: Date.now() - inicioFuncao
      });
    }
    
    // Inicializar cliente OpenAI
    console.log('[OpenAI] Inicializando cliente OpenAI');
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: LIMITES.TIMEOUT_API_MS,
    });

    try {
      console.log(`[OpenAI] Enviando requisição em ${new Date().toISOString()}`);
      
      // Configuração otimizada para respostas rápidas
      const configAPI = {
        model,
        messages: mensagensTruncadas,
        temperature: temperature || 0.7,
        max_tokens: tokensMaximos,
        stream: false,
        top_p: 0.1,  // Menos variabilidade = respostas mais rápidas
        presence_penalty: 0,
        frequency_penalty: 0,
      };
      
      // Timeout de segurança
      const resposta = await Promise.race([
        openai.chat.completions.create(configAPI),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout interno')), LIMITES.TIMEOUT_API_MS)
        )
      ]);
      
      // Tempo de processamento
      const tempoAPI = Date.now() - inicioFuncao;
      console.log(`[OpenAI] Resposta recebida em ${tempoAPI}ms`);
      
      // Validar resposta
      if (!resposta.choices || resposta.choices.length === 0 || !resposta.choices[0].message) {
        console.error('[OpenAI] Resposta inválida:', JSON.stringify(resposta).substring(0, 200));
        return res.status(500).json({ 
          error: 'A API da OpenAI retornou uma resposta vazia ou inválida',
          resposta_parcial: JSON.stringify(resposta).substring(0, 200)
        });
      }
      
      // Verificar conteúdo vazio
      if (!resposta.choices[0].message.content || resposta.choices[0].message.content.trim() === '') {
        console.warn('[OpenAI] Conteúdo vazio na resposta');
        resposta.choices[0].message.content = "Não foi possível gerar uma resposta. Por favor, tente novamente com um prompt diferente.";
      }
      
      // Log da resposta
      console.log(`[OpenAI] ID da resposta: ${resposta.id}`);
      console.log(`[OpenAI] Modelo usado: ${resposta.model}`);
      console.log(`[OpenAI] Tokens usados: ${resposta.usage?.total_tokens || 'N/A'}`);
      console.log(`[OpenAI] Tamanho da resposta: ${resposta.choices[0].message.content.length} caracteres`);
      
      // Adicionar diagnóstico
      resposta._info_debug = {
        tempo_total_ms: Date.now() - inicioFuncao,
        tamanho_prompt: tamanhoTotalPrompt,
        tamanho_resposta: resposta.choices[0].message.content.length,
        ambiente: process.env.NODE_ENV || 'unknown'
      };
      
      return res.status(200).json(resposta);
      
    } catch (erro) {
      // Log do erro
      console.error(`[OpenAI] Erro na chamada: ${erro.message}`);
      
      // Determinar tipo de erro
      let statusCode = 500;
      let mensagemErro = 'Erro ao processar requisição para OpenAI';
      
      if (erro.message.includes('timeout') || erro.message.includes('Timeout') || 
          erro.code === 'ETIMEDOUT' || erro.code === 'ESOCKETTIMEDOUT') {
        statusCode = 504;
        mensagemErro = 'Tempo limite excedido. Tente simplificar seu pedido.';
      } else if (erro.response) {
        statusCode = erro.response.status || 500;
        mensagemErro = `Erro da API OpenAI (${erro.response.status}): ${
          erro.response.data?.error?.message || 'Erro desconhecido'
        }`;
      }
      
      // Retornar erro com diagnóstico
      return res.status(statusCode).json({
        error: mensagemErro,
        debug: {
          erro_tipo: erro.name,
          erro_mensagem: erro.message,
          erro_codigo: erro.code,
          tempo_total: Date.now() - inicioFuncao,
          sugestoes: [
            'Reduza o tamanho do prompt',
            'Reduza o valor de max_tokens',
            'Use um modelo mais rápido (ex: gpt-3.5-turbo)'
          ]
        }
      });
    }
    
  } catch (erro) {
    const tempoTotal = Date.now() - inicioFuncao;
    console.error(`[OpenAI] Erro final após ${tempoTotal}ms:`, erro.message);
    
    // Determinar tipo de erro
    let statusCode = 500;
    let mensagemErro = 'Erro interno no servidor';
    
    // Verificar tipo específico de erro
    if (tempoTotal > LIMITES.TIMEOUT_FUNCAO_MS * 0.9) {
      statusCode = 504;
      mensagemErro = 'A requisição excedeu o tempo limite. Tente reduzir o tamanho do prompt.';
    } else if (erro.code === 'ENOTFOUND' || erro.code === 'ECONNREFUSED') {
      statusCode = 503;
      mensagemErro = 'Não foi possível conectar ao serviço da OpenAI. Tente novamente mais tarde.';
    }
    
    return res.status(statusCode).json({ 
      error: mensagemErro,
      debug: {
        erro_tipo: erro.name,
        erro_codigo: erro.code,
        erro_mensagem: erro.message,
        tempo_total: tempoTotal
      }
    });
  }
} 
// Proxy API para OpenAI na Vercel
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";

// Definição de limites ajustados para evitar timeouts na Vercel
const LIMITS = {
  FUNCTION_TIMEOUT_MS: 8000,  // 8 segundos no total para função serverless (reduzido de 15s)
  API_TIMEOUT_MS: 5000,       // 5 segundos para chamada da API (reduzido de 6s)
  HEALTH_CHECK_TIMEOUT_MS: 2000, // 2 segundos para verificação de saúde
  MAX_MESSAGE_LENGTH: 1000,   // 1000 caracteres por mensagem (reduzido de 1500)
  MAX_PROMPT_LENGTH: 6000,    // 6000 caracteres no total (reduzido de 10000)
  MAX_TOKENS: 300,            // 300 tokens máximos (reduzido de 400)
  MAX_RETRIES: 0              // Sem retries (reduzido de 1) - melhor falhar rápido que exceder timeout
};

// Função para verificar se está se aproximando do timeout da função serverless
function isApproachingTimeout(startTime, timeoutLimit = LIMITS.FUNCTION_TIMEOUT_MS * 0.7) {
  const now = Date.now();
  const elapsedTime = now - startTime;
  return elapsedTime > timeoutLimit;
}

// Função para truncar o conteúdo de mensagens para evitar payloads muito grandes
function truncateMessages(messages, maxLength = LIMITS.MAX_MESSAGE_LENGTH) {
  return messages.map(msg => {
    if (msg.content && msg.content.length > maxLength) {
      console.log(`Mensagem truncada de ${msg.content.length} para ${maxLength} caracteres`);
      return {
        ...msg,
        content: msg.content.substring(0, maxLength) + "... [truncado]"
      };
    }
    return msg;
  });
}

// Função para verificar a saúde da API OpenAI
async function checkOpenAIHealth(apiKey) {
  try {
    const healthCheckUrl = 'https://api.openai.com/v1/models';
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: LIMITS.HEALTH_CHECK_TIMEOUT_MS
    });
    
    console.log(`[OpenAI Health Check] Status: ${response.status}`);
    
    // Verificar cabeçalhos para diagnóstico
    const headers = {};
    response.headers.forEach((value, name) => {
      if (name.startsWith('x-') || name.startsWith('openai-')) {
        headers[name] = value;
      }
    });
    console.log(`[OpenAI Health Check] Headers: ${JSON.stringify(headers)}`);
    
    return {
      healthy: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: headers
    };
  } catch (error) {
    console.error('[OpenAI Health Check] Erro:', error.message);
    return {
      healthy: false,
      error: error.message,
      error_type: error.name,
      error_code: error.code
    };
  }
}

export default async function handler(req, res) {
  const functionStartTime = Date.now();
  console.log(`[OpenAI API] Início do processamento: ${new Date(functionStartTime).toISOString()}`);
  console.log(`[OpenAI API] Método: ${req.method}`);
  console.log(`[OpenAI API] URL: ${req.url}`);
  console.log(`[OpenAI API] Headers: ${JSON.stringify(req.headers['user-agent'] || 'N/A')}`);
  
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
    console.log("[OpenAI API] Requisição OPTIONS (pre-flight)");
    res.status(200).end();
    return;
  }

  // Verificar se é POST
  if (req.method !== 'POST') {
    console.error(`[OpenAI API] Método inválido: ${req.method}`);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar envio de corpo da requisição
    if (!req.body) {
      console.error('[OpenAI API] Corpo da requisição ausente');
      return res.status(400).json({ error: 'O corpo da requisição está vazio' });
    }
    
    console.log(`[OpenAI API] Corpo da requisição: ${JSON.stringify(req.body).substring(0, 100)}...`);
    
    // Validação de campos obrigatórios
    const { model, messages, temperature, max_tokens } = req.body;
    
    if (!model) {
      console.error('[OpenAI API] Campo model não fornecido');
      return res.status(400).json({ error: 'O campo model é obrigatório' });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('[OpenAI API] Campo messages inválido', messages);
      return res.status(400).json({ error: 'O campo messages deve ser um array não vazio' });
    }

    // Verificar e limitar o tamanho das mensagens
    const truncatedMessages = truncateMessages(messages, LIMITS.MAX_MESSAGE_LENGTH);
    
    // Verificar tamanho do prompt completo
    let totalPromptLength = 0;
    truncatedMessages.forEach(msg => {
      totalPromptLength += msg.content ? msg.content.length : 0;
    });
    console.log(`[OpenAI API] Tamanho total do prompt: ${totalPromptLength} caracteres`);

    // Verificar se o prompt é excessivamente grande
    if (totalPromptLength > LIMITS.MAX_PROMPT_LENGTH) {
      console.warn(`[OpenAI API] ALERTA: Prompt muito grande (${totalPromptLength} caracteres)`);
      return res.status(413).json({
        error: 'Prompt muito grande. Por favor, reduza o tamanho do conteúdo.',
        debug_info: {
          prompt_length: totalPromptLength,
          max_allowed: LIMITS.MAX_PROMPT_LENGTH
        }
      });
    }

    // Verificar e limitar max_tokens
    const safeMaxTokens = Math.min(max_tokens || LIMITS.MAX_TOKENS, LIMITS.MAX_TOKENS);
    if (safeMaxTokens !== max_tokens) {
      console.log(`[OpenAI API] max_tokens reduzido de ${max_tokens || 'indefinido'} para ${safeMaxTokens}`);
    }

    console.log(`[OpenAI API] Model: ${model}`);
    console.log(`[OpenAI API] Mensagens: ${messages.length}`);
    console.log(`[OpenAI API] Temperature: ${temperature}`);
    console.log(`[OpenAI API] Max tokens: ${safeMaxTokens}`);

    // Obter API key da variável de ambiente
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[OpenAI API] API key não encontrada');
      return res.status(500).json({ error: 'API key não configurada no servidor' });
    }
    
    // Log do formato da API key (sem revelar a chave completa)
    console.log(`[OpenAI API] API key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    console.log(`[OpenAI API] Comprimento da API key: ${apiKey.length} caracteres`);

    // Verificar formato da API key
    if (!apiKey.startsWith('sk-') && !apiKey.includes('sk-')) {
      console.warn('[OpenAI API] Formato da API key possivelmente inválido');
      // Verificação adicional de saúde da API
      const healthResult = await checkOpenAIHealth(apiKey);
      console.log(`[OpenAI API] Verificação de saúde: ${JSON.stringify(healthResult)}`);
      
      if (!healthResult.healthy) {
        return res.status(401).json({ 
          error: 'API key da OpenAI inválida ou serviço indisponível',
          debug_info: healthResult
        });
      }
    }

    // Preparar chamada para OpenAI
    console.log('[OpenAI API] Inicializando cliente OpenAI');
    
    // Verifica se já estamos próximos do timeout antes de iniciar a chamada
    if (isApproachingTimeout(functionStartTime, LIMITS.FUNCTION_TIMEOUT_MS * 0.5)) {
      console.error('[OpenAI API] Tempo de processamento preliminar muito longo, abortando');
      return res.status(503).json({
        error: 'Servidor ocupado, tente novamente',
        debug_info: {
          time_elapsed_ms: Date.now() - functionStartTime,
          reason: 'Pré-processamento consumiu muito tempo'
        }
      });
    }
    
    // Inicializa o cliente OpenAI com timeout reduzido
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: LIMITS.API_TIMEOUT_MS,
    });

    // Rastreamento de tempos para diagnóstico
    const timings = {
      start: functionStartTime,
      pre_api_call: Date.now() - functionStartTime
    };

    try {
      console.log(`[OpenAI API] Enviando requisição para OpenAI em ${new Date().toISOString()}`);
      console.log(`[OpenAI API] Tempo decorrido: ${timings.pre_api_call}ms`);
      
      // Objeto de configuração para a chamada da API
      const apiConfig = {
        model,
        messages: truncatedMessages,
        temperature: temperature || 0.7,
        max_tokens: safeMaxTokens,
        stream: false,
        // Adicionar parâmetros para acelerar a resposta
        top_p: 0.01,  // Reduz a variabilidade para respostas mais rápidas
        presence_penalty: 0,
        frequency_penalty: 0,
      };
      
      console.log(`[OpenAI API] Configuração: ${JSON.stringify(apiConfig, null, 2)}`);
      
      // Enviar solicitação com um timeout específico
      const response = await Promise.race([
        openai.chat.completions.create(apiConfig),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout interno de segurança')), 
          LIMITS.API_TIMEOUT_MS)
        )
      ]);
      
      // Registrar o tempo após a chamada
      const apiCallDuration = Date.now() - functionStartTime - timings.pre_api_call;
      timings.api_call_duration = apiCallDuration;
      timings.post_api_call = Date.now() - functionStartTime;
      
      console.log(`[OpenAI API] Resposta recebida em ${new Date().toISOString()}`);
      console.log(`[OpenAI API] Duração da chamada API: ${apiCallDuration}ms`);
      
      // Validar a resposta
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        console.error('[OpenAI API] Resposta sem conteúdo válido:', 
          JSON.stringify(response).substring(0, 200));
        
        return res.status(500).json({ 
          error: 'A API da OpenAI retornou uma resposta vazia ou inválida',
          debug_info: {
            received_response: JSON.stringify(response).substring(0, 200),
            had_choices: Boolean(response.choices),
            choices_length: response.choices ? response.choices.length : 0,
            timings
          }
        });
      }
      
      // Verificar se o conteúdo da mensagem está vazio
      if (!response.choices[0].message.content || response.choices[0].message.content.trim() === '') {
        console.warn('[OpenAI API] A mensagem retornada está vazia');
        response.choices[0].message.content = "Não foi possível gerar uma resposta. Por favor, tente novamente com um prompt diferente.";
      }
      
      // Log da resposta
      console.log(`[OpenAI API] ID da resposta: ${response.id}`);
      console.log(`[OpenAI API] Modelo usado: ${response.model}`);
      console.log(`[OpenAI API] Tokens usados: ${response.usage?.total_tokens || 'N/A'}`);
      console.log(`[OpenAI API] Tamanho da resposta: ${response.choices[0].message.content.length} caracteres`);
      
      // Resposta válida, retornar para o cliente
      const totalDuration = Date.now() - functionStartTime;
      console.log(`[OpenAI API] Enviando resposta ao cliente após ${totalDuration}ms`);
      
      // Adicionar informações de diagnóstico
      response._debug_info = {
        processing_time_ms: totalDuration,
        timings,
        prompt_length: totalPromptLength,
        response_length: response.choices[0].message.content.length,
        max_tokens_used: safeMaxTokens,
        environment: process.env.NODE_ENV || 'unknown'
      };
      
      return res.status(200).json(response);
      
    } catch (error) {
      // Registrar o momento do erro para diagnóstico
      timings.error_time = Date.now() - functionStartTime;
      
      // Log detalhado do erro
      console.error(`[OpenAI API] Erro na chamada API (${timings.error_time}ms):`, error.message);
      
      if (error.response) {
        // Log de informações da resposta de erro
        console.error('[OpenAI API] Status:', error.response.status);
        console.error('[OpenAI API] Headers:', JSON.stringify(error.response.headers));
        
        // Adicionar headers ao diagnóstico
        timings.response_status = error.response.status;
        timings.response_headers = {};
        
        for (const [key, value] of Object.entries(error.response.headers)) {
          if (key.startsWith('x-') || key.startsWith('openai-') || 
              ['content-type', 'date', 'server'].includes(key)) {
            timings.response_headers[key] = value;
          }
        }
        
        try {
          const errorData = typeof error.response.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response.data;
          console.error('[OpenAI API] Data:', JSON.stringify(errorData).substring(0, 200));
          timings.response_data = JSON.stringify(errorData).substring(0, 200);
        } catch (jsonError) {
          console.error('[OpenAI API] Erro ao analisar response.data:', 
            typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : '[Não é string]');
        }
      } else {
        // Log para erros sem resposta
        console.error('[OpenAI API] Tipo de erro:', error.name);
        console.error('[OpenAI API] Código de erro:', error.code);
        console.error('[OpenAI API] Stack trace:', error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'N/A');
      }
      
      // Determinar tipo de erro e mensagem apropriada
      let statusCode = 500;
      let errorMessage = 'Erro ao processar requisição para OpenAI';
      
      if (error.message.includes('timeout') || error.message.includes('Timeout') || 
          error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        statusCode = 504;
        errorMessage = 'Tempo limite excedido na conexão com a OpenAI. Tente simplificar seu pedido.';
      } else if (error.response) {
        statusCode = error.response.status || 500;
        errorMessage = `Erro da API OpenAI (${error.response.status}): ${
          error.response.data?.error?.message || 
          error.response.statusText || 
          'Erro desconhecido'
        }`;
      }
      
      // Retornar erro para o cliente com diagnóstico
      return res.status(statusCode).json({
        error: errorMessage,
        debug_info: {
          error_type: error.name,
          error_message: error.message,
          error_code: error.code,
          total_duration: Date.now() - functionStartTime,
          timings,
          suggested_actions: [
            'Reduza o tamanho do prompt',
            'Reduza o valor de max_tokens',
            'Use um modelo mais rápido (ex: gpt-3.5-turbo)'
          ]
        }
      });
    }
    
  } catch (error) {
    const totalDuration = Date.now() - functionStartTime;
    console.error(`[OpenAI API] Erro final após ${totalDuration}ms:`, error.message);
    
    // Determinar tipo de erro e mensagem apropriada
    let statusCode = 500;
    let errorMessage = 'Erro interno no servidor';
    let debugInfo = {
      error_type: error.name,
      error_code: error.code,
      error_message: error.message,
      total_duration: totalDuration,
      runtime_env: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'unknown')
    };
    
    // Verificar tipo de erro para personalizar mensagem
    if (totalDuration > LIMITS.FUNCTION_TIMEOUT_MS * 0.9) {
      statusCode = 504;
      errorMessage = 'A requisição excedeu o tempo limite. Tente reduzir o tamanho do prompt.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Não foi possível conectar ao serviço da OpenAI. Tente novamente mais tarde.';
    }
    
    console.error(`[OpenAI API] Retornando erro ${statusCode}: ${errorMessage}`);
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      debug_info: debugInfo
    });
  }
} 
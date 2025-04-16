// Proxy API para OpenAI na Vercel
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";

// Função para verificar se está se aproximando do timeout da função serverless
function isApproachingTimeout(startTime, timeoutLimit = 9000) { // 9 segundos (deixando 1s de margem)
  const now = Date.now();
  const elapsedTime = now - startTime;
  return elapsedTime > timeoutLimit;
}

// Função para truncar o conteúdo de mensagens para evitar payloads muito grandes
function truncateMessages(messages, maxLength = 2000) { // Reduzido para 2000 caracteres
  return messages.map(msg => {
    if (msg.content && msg.content.length > maxLength) {
      console.log(`Mensagem truncada de ${msg.content.length} para ${maxLength} caracteres`);
      return {
        ...msg,
        content: msg.content.substring(0, maxLength) + "... [truncado para evitar timeout]"
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
      timeout: 5000 // Timeout curto para verificação de saúde
    });
    
    console.log(`[OpenAI Health Check] Status: ${response.status}`);
    return {
      healthy: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('[OpenAI Health Check] Erro:', error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  const functionStartTime = Date.now();
  console.log(`[OpenAI API] Início do processamento da requisição: ${new Date(functionStartTime).toISOString()}`);
  console.log(`[OpenAI API] Método: ${req.method}`);
  
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
    
    console.log(`[OpenAI API] Corpo da requisição recebido: ${JSON.stringify(req.body).substring(0, 150)}...`);
    
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

    // Verificar e limitar o tamanho das mensagens para evitar timeout
    const truncatedMessages = truncateMessages(messages, 2000); // Reduzido para 2000 caracteres
    
    // Verificar tamanho do prompt completo
    let totalPromptLength = 0;
    truncatedMessages.forEach(msg => {
      totalPromptLength += msg.content ? msg.content.length : 0;
    });
    console.log(`[OpenAI API] Tamanho total do prompt: ${totalPromptLength} caracteres`);

    // Verificar e limitar max_tokens se necessário - reduzido para 500 máximo
    const safeMaxTokens = Math.min(max_tokens || 800, 500);
    if (safeMaxTokens !== max_tokens) {
      console.log(`[OpenAI API] max_tokens reduzido de ${max_tokens || 'indefinido'} para ${safeMaxTokens}`);
    }

    console.log(`[OpenAI API] Model: ${model}`);
    console.log(`[OpenAI API] Número de mensagens: ${messages.length}`);
    console.log(`[OpenAI API] Temperature: ${temperature}`);
    console.log(`[OpenAI API] Max tokens aplicado: ${safeMaxTokens}`);

    // Obter API key da variável de ambiente
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[OpenAI API] API key não encontrada nas variáveis de ambiente');
      return res.status(500).json({ error: 'API key não configurada no servidor' });
    }
    
    // Log do formato da API key (sem revelar a chave completa)
    console.log(`[OpenAI API] API key carregada: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    console.log(`[OpenAI API] Comprimento da API key: ${apiKey.length} caracteres`);

    // Verificar formato da API key
    if (!apiKey.startsWith('sk-') && !apiKey.includes('sk-')) {
      console.warn('[OpenAI API] Aviso: formato da API key pode ser inválido (não começa com sk-)');
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
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 12000, // Reduzido para 12 segundos para melhor compatibilidade com serverless
    });

    // Implementar retry com backoff 
    const maxRetries = 2; // Aumentado para 2 tentativas
    let lastError = null;
    let lastResponseInfo = null;

    // Configurar timeout para a função inteira
    const maxFunctionTime = 20000; // 20 segundos totais para toda a função
    
    // Função para verificar se estamos perto do timeout
    const isApproachingTimeout = () => {
      const elapsed = Date.now() - functionStartTime;
      const isClose = elapsed > (maxFunctionTime * 0.7); // 70% do tempo máximo
      if (isClose) {
        console.log(`[OpenAI API] ALERTA: Aproximando-se do timeout. Tempo decorrido: ${elapsed}ms`);
      }
      return isClose;
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Verificar se estamos perto do limite de tempo da função
        if (isApproachingTimeout()) {
          console.log('[OpenAI API] Aproximando-se do timeout da função serverless, retornando resposta parcial');
          // Ao invés de abortar, retornar uma resposta parcial se tivermos alguma
          if (lastResponseInfo) {
            return res.status(206).json({
              choices: [{ 
                message: { 
                  content: "O processamento foi interrompido devido a restrições de tempo. Tente reduzir o tamanho do prompt ou simplificar a solicitação."
                },
                finish_reason: "timeout" 
              }],
              warning: "Resposta parcial devido a restrições de tempo",
              debug_info: lastResponseInfo
            });
          }
          throw new Error('Aproximando-se do timeout da função serverless');
        }

        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(1.5, attempt - 1), 3000); // Máximo de 3s de espera
          console.log(`[OpenAI API] Tentativa ${attempt+1}/${maxRetries+1} após falha anterior. Aguardando ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const attemptStartTime = Date.now();
        console.log(`[OpenAI API] Enviando requisição para OpenAI (tentativa ${attempt+1}/${maxRetries+1}) em ${new Date(attemptStartTime).toISOString()}`);
        console.log(`[OpenAI API] Tempo decorrido desde o início: ${attemptStartTime - functionStartTime}ms`);
        
        // Fazer a chamada para a API com parâmetros limitados e timeout mais curto
        const response = await openai.chat.completions.create({
          model,
          messages: truncatedMessages,
          temperature: temperature || 0.7,
          max_tokens: safeMaxTokens,
          stream: false,
          timeout: 10000, // 10 segundos para a chamada específica
        });
        
        const attemptEndTime = Date.now();
        const attemptDuration = attemptEndTime - attemptStartTime;
        console.log(`[OpenAI API] Resposta recebida em ${new Date(attemptEndTime).toISOString()}`);
        console.log(`[OpenAI API] Duração da tentativa: ${attemptDuration}ms`);
        console.log('[OpenAI API] Resposta recebida com sucesso');
        
        // Salvar informações da resposta para uso em caso de timeout
        lastResponseInfo = {
          id: response.id,
          model: response.model,
          duration_ms: attemptDuration,
          total_tokens: response.usage?.total_tokens || 'N/A'
        };
        
        // Validar a resposta
        if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
          console.error('[OpenAI API] Resposta sem conteúdo válido:', JSON.stringify(response).substring(0, 200));
          
          // Se não for a última tentativa, continua para o próximo loop
          if (attempt < maxRetries && !isApproachingTimeout()) {
            console.log('[OpenAI API] Resposta sem choices válidos, tentando novamente');
            continue;
          }
          
          return res.status(500).json({ 
            error: 'A API da OpenAI retornou uma resposta vazia ou inválida',
            debug_info: {
              received_response: JSON.stringify(response).substring(0, 200),
              had_choices: Boolean(response.choices),
              choices_length: response.choices ? response.choices.length : 0,
              has_message: response.choices && response.choices[0] ? Boolean(response.choices[0].message) : false,
              total_duration: Date.now() - functionStartTime,
            }
          });
        }
        
        // Verificar se o conteúdo da mensagem está vazio
        if (!response.choices[0].message.content || response.choices[0].message.content.trim() === '') {
          console.warn('[OpenAI API] A mensagem retornada está vazia');
          
          // Se não for a última tentativa, continua para o próximo loop
          if (attempt < maxRetries && !isApproachingTimeout()) {
            console.log('[OpenAI API] Conteúdo vazio, tentando novamente');
            continue;
          }
          
          // Na última tentativa, retorna uma mensagem amigável
          response.choices[0].message.content = "Não foi possível gerar uma resposta. Por favor, tente novamente com um prompt diferente.";
        }
        
        // Log da resposta
        console.log(`[OpenAI API] ID da resposta: ${response.id}`);
        console.log(`[OpenAI API] Modelo usado: ${response.model}`);
        console.log(`[OpenAI API] Número de tokens usados: ${response.usage?.total_tokens || 'N/A'}`);
        console.log(`[OpenAI API] Tamanho da resposta: ${response.choices[0].message.content.length} caracteres`);
        
        // Resposta válida, retornar para o cliente
        const totalDuration = Date.now() - functionStartTime;
        console.log(`[OpenAI API] Enviando resposta ao cliente após ${totalDuration}ms`);
        return res.status(200).json(response);
        
      } catch (error) {
        lastError = error;
        
        // Log detalhado do erro
        console.error(`[OpenAI API] Erro na tentativa ${attempt + 1} (${Date.now() - functionStartTime}ms desde o início):`, error.message);
        
        if (error.response) {
          // Log de informações da resposta de erro
          console.error('[OpenAI API] Status:', error.response.status);
          console.error('[OpenAI API] Headers:', JSON.stringify(error.response.headers));
          
          try {
            const errorData = typeof error.response.data === 'string' 
              ? JSON.parse(error.response.data) 
              : error.response.data;
            console.error('[OpenAI API] Data:', JSON.stringify(errorData).substring(0, 500));
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
        
        // Se estamos nos aproximando do timeout, retornar resposta parcial ou erro
        if (isApproachingTimeout()) {
          console.log('[OpenAI API] Não tentando novamente devido à proximidade do timeout');
          if (lastResponseInfo) {
            // Retornar resposta parcial com informações de diagnóstico
            return res.status(206).json({
              choices: [{ 
                message: { 
                  content: "A solicitação expirou antes de ser concluída. Tente reduzir o tamanho do prompt."
                },
                finish_reason: "timeout" 
              }],
              warning: "Resposta parcial devido a restrições de tempo",
              debug_info: {
                ...lastResponseInfo,
                error_message: error.message,
                error_type: error.name
              }
            });
          }
          
          return res.status(504).json({
            error: 'Tempo limite excedido ao processar a solicitação',
            debug_info: {
              error_message: error.message,
              error_type: error.name,
              total_duration: Date.now() - functionStartTime
            }
          });
        }
        
        // Se for um erro temporário e não for a última tentativa, continua para próxima
        const retryableStatus = [429, 500, 502, 503, 504];
        const isRetryableError = 
          (error.response && retryableStatus.includes(error.response.status)) ||
          error.code === 'ETIMEDOUT' || 
          error.code === 'ESOCKETTIMEDOUT' || 
          error.code === 'ECONNRESET' ||
          error.message.includes('timeout') ||
          error.message.includes('Tempo limite');
        
        if (isRetryableError && attempt < maxRetries) {
          const statusStr = error.response ? `status ${error.response.status}` : `código ${error.code}`;
          console.log(`[OpenAI API] Erro retentável (${statusStr}), tentando novamente`);
          continue;
        }
        
        // Na última tentativa ou para erros que não devem ser repetidos, lançar o erro
        if (attempt >= maxRetries) {
          console.log('[OpenAI API] Máximo de tentativas atingido, desistindo');
          throw error;
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new Error('Todas as tentativas para o OpenAI falharam');
    
  } catch (error) {
    const totalDuration = Date.now() - functionStartTime;
    console.error(`[OpenAI API] Erro final após ${totalDuration}ms:`, error.message);
    
    // Determinar tipo de erro e mensagem apropriada
    let statusCode = 500;
    let errorMessage = 'Erro interno no servidor ao processar requisição para OpenAI';
    let debugInfo = {
      error_type: error.name,
      error_code: error.code,
      error_message: error.message,
      total_duration: totalDuration
    };
    
    if (error.response) {
      statusCode = error.response.status || 500;
      debugInfo.status_code = error.response.status;
      debugInfo.status_text = error.response.statusText;
      
      try {
        if (error.response.data && error.response.data.error) {
          errorMessage = `OpenAI API: ${error.response.data.error.message || error.response.data.error}`;
          debugInfo.openai_error = error.response.data.error;
        } else {
          errorMessage = `OpenAI API retornou status ${error.response.status}: ${error.response.statusText || 'Erro desconhecido'}`;
        }
        
        // Adicionar headers para diagnóstico
        if (error.response.headers) {
          debugInfo.response_headers = {
            'x-request-id': error.response.headers['x-request-id'],
            'openai-organization': error.response.headers['openai-organization'],
            'openai-processing-ms': error.response.headers['openai-processing-ms'],
            'content-type': error.response.headers['content-type']
          };
        }
      } catch (parseError) {
        console.error('[OpenAI API] Erro ao analisar corpo da resposta de erro:', parseError);
        errorMessage = `OpenAI API retornou status ${error.response.status}`;
        debugInfo.parse_error = parseError.message;
      }
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ECONNABORTED') {
      statusCode = 504;
      errorMessage = 'Tempo limite excedido ao conectar à API da OpenAI. Tente reduzir o tamanho do prompt.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      statusCode = 503;
      errorMessage = 'Não foi possível conectar ao serviço da OpenAI. Serviço pode estar indisponível.';
    }
    
    // Verificar se o erro é relacionado ao timeout do serverless
    if (totalDuration > 15000 || error.message.includes('timeout') || 
        error.message.includes('Tempo limite') || error.message.includes('serverless')) {
      statusCode = 504;
      errorMessage = 'A requisição excedeu o tempo limite do servidor. Tente reduzir o tamanho do prompt ou o número de tokens solicitados.';
      debugInfo.suggestions = [
        'Reduza o tamanho do prompt',
        'Divida a requisição em partes menores',
        'Use um modelo mais rápido como gpt-3.5-turbo',
        'Reduza max_tokens para valor menor que 500'
      ];
    }
    
    console.error(`[OpenAI API] Retornando erro ${statusCode}: ${errorMessage}`);
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      debug_info: debugInfo
    });
  }
} 
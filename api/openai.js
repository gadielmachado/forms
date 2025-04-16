// Proxy API para OpenAI na Vercel
import fetch from 'node-fetch';
import { OpenAI } from 'openai';

export default async function handler(req, res) {
  console.log("[OpenAI API] Início do processamento da requisição");
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

    console.log(`[OpenAI API] Model: ${model}`);
    console.log(`[OpenAI API] Número de mensagens: ${messages.length}`);
    console.log(`[OpenAI API] Temperature: ${temperature}`);
    console.log(`[OpenAI API] Max tokens: ${max_tokens}`);

    // Obter API key da variável de ambiente
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[OpenAI API] API key não encontrada nas variáveis de ambiente');
      return res.status(500).json({ error: 'API key não configurada no servidor' });
    }
    
    console.log(`[OpenAI API] API key carregada: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`[OpenAI API] Comprimento da API key: ${apiKey.length} caracteres`);

    // Verificar formato da API key
    if (!apiKey.startsWith('sk-') && !apiKey.includes('sk-')) {
      console.warn('[OpenAI API] Aviso: formato da API key pode ser inválido (não começa com sk-)');
    }

    // Preparar chamada para OpenAI
    console.log('[OpenAI API] Inicializando cliente OpenAI');
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000, // 30 segundos
    });

    // Implementar retry com backoff
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[OpenAI API] Tentativa ${attempt}/${maxRetries} após falha anterior`);
          // Esperar entre tentativas (backoff exponencial)
          const waitTime = 1000 * Math.pow(2, attempt - 1);
          console.log(`[OpenAI API] Aguardando ${waitTime}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        console.log(`[OpenAI API] Enviando requisição para OpenAI (tentativa ${attempt + 1}/${maxRetries + 1})`);
        
        // Log do início da requisição com timestamp
        const startTime = new Date();
        console.log(`[OpenAI API] Timestamp início: ${startTime.toISOString()}`);
        
        // Fazer a chamada para a API
        const response = await openai.chat.completions.create({
          ...req.body,
          stream: false,
        });
        
        // Log do fim da requisição com timestamp e duração
        const endTime = new Date();
        const duration = endTime - startTime;
        console.log(`[OpenAI API] Timestamp fim: ${endTime.toISOString()}`);
        console.log(`[OpenAI API] Duração da requisição: ${duration}ms`);
        console.log('[OpenAI API] Resposta recebida com sucesso');
        
        // Validar a resposta
        if (!response.choices || response.choices.length === 0) {
          console.error('[OpenAI API] Resposta sem choices:', JSON.stringify(response));
          
          // Se não for a última tentativa, continua para o próximo loop
          if (attempt < maxRetries) {
            console.log('[OpenAI API] Resposta sem choices, tentando novamente');
            continue;
          }
          
          return res.status(500).json({ 
            error: 'A API da OpenAI retornou uma resposta vazia ou inválida',
            debug_info: {
              received_response: JSON.stringify(response),
              had_choices: Boolean(response.choices),
              choices_length: response.choices ? response.choices.length : 0
            }
          });
        }
        
        // Log da resposta
        console.log(`[OpenAI API] ID da resposta: ${response.id}`);
        console.log(`[OpenAI API] Modelo usado: ${response.model}`);
        console.log(`[OpenAI API] Número de tokens usados: ${response.usage?.total_tokens || 'N/A'}`);
        
        // Resposta válida, retornar para o cliente
        console.log('[OpenAI API] Enviando resposta ao cliente');
        return res.status(200).json(response);
        
      } catch (error) {
        lastError = error;
        
        // Log detalhado do erro
        console.error(`[OpenAI API] Erro na tentativa ${attempt + 1}:`, error.message);
        
        if (error.response) {
          // Log de informações da resposta de erro
          console.error('[OpenAI API] Status:', error.response.status);
          console.error('[OpenAI API] Headers:', JSON.stringify(error.response.headers));
          
          try {
            const errorData = typeof error.response.data === 'string' 
              ? JSON.parse(error.response.data) 
              : error.response.data;
            console.error('[OpenAI API] Data:', JSON.stringify(errorData));
          } catch (jsonError) {
            console.error('[OpenAI API] Erro ao analisar response.data:', error.response.data);
          }
        } else {
          // Log para erros sem resposta
          console.error('[OpenAI API] Tipo de erro:', error.name);
          console.error('[OpenAI API] Código de erro:', error.code);
          console.error('[OpenAI API] Stack trace:', error.stack);
        }
        
        // Se for um erro temporário e não for a última tentativa, continua para próxima
        const retryableStatus = [429, 500, 502, 503, 504];
        if (error.response && 
            retryableStatus.includes(error.response.status) && 
            attempt < maxRetries) {
          console.log(`[OpenAI API] Erro retentável (status ${error.response.status}), tentando novamente`);
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
    console.error('[OpenAI API] Erro final:', error.message);
    
    // Determinar tipo de erro e mensagem apropriada
    let statusCode = 500;
    let errorMessage = 'Erro interno no servidor ao processar requisição para OpenAI';
    let debugInfo = {
      error_type: error.name,
      error_code: error.code,
      error_message: error.message
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
            'openai-processing-ms': error.response.headers['openai-processing-ms']
          };
        }
      } catch (parseError) {
        console.error('[OpenAI API] Erro ao analisar corpo da resposta de erro:', parseError);
        errorMessage = `OpenAI API retornou status ${error.response.status}`;
        debugInfo.parse_error = parseError.message;
      }
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ECONNABORTED') {
      statusCode = 504;
      errorMessage = 'Tempo limite excedido ao conectar à API da OpenAI';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      statusCode = 503;
      errorMessage = 'Não foi possível conectar ao serviço da OpenAI';
    }
    
    console.error(`[OpenAI API] Retornando erro ${statusCode}: ${errorMessage}`);
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      debug_info: debugInfo
    });
  }
} 
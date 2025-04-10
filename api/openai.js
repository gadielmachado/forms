// Proxy API para OpenAI na Vercel
import fetch from 'node-fetch';

export default async function handler(req, res) {
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
    res.status(200).end();
    return;
  }

  // Verificar se é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('Recebido pedido para OpenAI API');
    
    // Obter a chave da API das variáveis de ambiente
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('Chave da API OpenAI não está configurada');
      return res.status(500).json({ 
        error: 'Chave da API não está configurada no servidor. Configure a variável de ambiente OPENAI_API_KEY.'
      });
    }
    
    // Verificar se o body contém os parâmetros necessários
    if (!req.body || !req.body.model || !req.body.messages) {
      console.error('Parâmetros da requisição inválidos');
      return res.status(400).json({
        error: 'Parâmetros inválidos. Verifique se "model" e "messages" estão presentes.'
      });
    }
    
    console.log('Fazendo chamada para OpenAI API');
    
    // Definir timeout para a requisição
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 85000); // 85 segundos de timeout
    
    try {
      // Fazer a chamada para a API da OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      
      // Limpar o timeout após receber a resposta
      clearTimeout(timeout);
      
      // Verificar status da resposta
      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('Erro na API da OpenAI:', openaiResponse.status, errorData);
        
        // Retornar mensagens de erro mais informativas baseadas no código HTTP
        if (openaiResponse.status === 401) {
          return res.status(401).json({ 
            error: 'Erro de autenticação. Verifique a chave da API OpenAI.' 
          });
        } else if (openaiResponse.status === 429) {
          return res.status(429).json({ 
            error: 'Limite de requisições excedido na API OpenAI. Aguarde um momento e tente novamente.' 
          });
        }
        
        return res.status(openaiResponse.status).json(errorData);
      }

      // Obter a resposta como JSON
      const data = await openaiResponse.json();
      
      console.log('Resposta recebida da OpenAI API com sucesso');
      
      // Retornar a resposta com o mesmo status
      res.status(openaiResponse.status).json(data);
      
    } catch (fetchError) {
      clearTimeout(timeout);
      
      // Tratar erro de timeout
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao aguardar resposta da OpenAI API');
        return res.status(504).json({ 
          error: 'A requisição para a API OpenAI excedeu o tempo limite.' 
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor: ' + (error.message || 'Ocorreu um erro desconhecido') 
    });
  }
} 
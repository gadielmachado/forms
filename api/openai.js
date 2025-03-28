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
      return res.status(500).json({ error: 'Chave da API não está configurada no servidor. Configure a variável de ambiente OPENAI_API_KEY.' });
    }
    
    console.log('Fazendo chamada para OpenAI API');
    
    // Fazer a chamada para a API da OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    // Obter a resposta como JSON
    const data = await openaiResponse.json();
    
    console.log('Resposta recebida da OpenAI API');
    
    // Retornar a resposta com o mesmo status
    res.status(openaiResponse.status).json(data);
    
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
} 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Permitir requisições de qualquer origem
app.use(cors({
  origin: '*', // Permite todas as origens
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Rota para o serviço OpenAI
app.post('/api/openai', async (req, res) => {
  try {
    console.log('Recebido pedido para OpenAI API');
    
    // Verifica se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error('Chave da API OpenAI não está configurada');
      return res.status(500).json({ error: 'Chave da API não está configurada no servidor' });
    }
    
    console.log('Fazendo chamada para OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('Resposta recebida da OpenAI API:', data.choices ? 'Sucesso' : 'Erro');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando corretamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Chave da OpenAI configurada: ${process.env.OPENAI_API_KEY ? 'Sim' : 'Não'}`);
}); 
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import emailRoutes from './src/server/routes/emailRoutes.js';

// Configuração de ambiente
dotenv.config();

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Supabase
const supabaseUrl = 'SUA_URL_DO_SUPABASE'; // Substitua pela sua URL
const supabaseKey = 'SUA_CHAVE_DO_SUPABASE'; // Substitua pela sua chave
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da OpenAI
const configuration = new Configuration({
  apiKey: 'SUA_CHAVE_DA_OPENAI', // Substitua pela sua chave
});
const openai = new OpenAIApi(configuration);

// Middlewares
app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rotas de email
app.use('/api/email', emailRoutes);

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { formId, action } = req.body;
    console.log('Gerando', action, 'para o formulário:', formId);
    
    // Buscar dados do formulário
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    if (formError) {
      console.error('Erro ao buscar formulário:', formError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar formulário' });
    }
    
    // Buscar respostas do formulário
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId);
    
    if (responsesError) {
      console.error('Erro ao buscar respostas:', responsesError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar respostas' });
    }
    
    console.log(`Encontradas ${responses.length} respostas para o formulário ${formId}`);
    
    // Preparar dados para o prompt do ChatGPT
    const formFields = formData.fields || [];
    
    // Estruturar as respostas para facilitar a análise
    const structuredResponses = responses.map(response => {
      const answers = {};
      // Associar cada resposta com o campo correspondente
      if (response.answers && formFields.length > 0) {
        formFields.forEach(field => {
          const fieldId = field.id;
          answers[field.label || field.name] = response.answers[fieldId] || 'Não respondido';
        });
      }
      return {
        respondent: response.respondent_name || response.respondent_email || 'Anônimo',
        date: new Date(response.created_at).toLocaleDateString('pt-BR'),
        answers
      };
    });
    
    // Criar prompt baseado no tipo de documento
    let systemPrompt = '';
    let userPrompt = '';
    
    if (action === 'briefing') {
      systemPrompt = 'Você é um especialista em marketing e estratégia. Analise os dados do formulário e crie um briefing detalhado com insights relevantes.';
      userPrompt = `Crie um briefing completo baseado nas seguintes respostas do formulário "${formData.name}":\n\n`;
    } else if (action === 'proposta') {
      systemPrompt = 'Você é um consultor de negócios experiente. Elabore uma proposta comercial personalizada baseada nas respostas do formulário.';
      userPrompt = `Crie uma proposta comercial detalhada baseada nas seguintes respostas do formulário "${formData.name}":\n\n`;
    } else if (action === 'relatorio') {
      systemPrompt = 'Você é um analista de dados. Crie um relatório detalhado analisando padrões e insights das respostas do formulário.';
      userPrompt = `Crie um relatório de análise detalhado baseado nas seguintes respostas do formulário "${formData.name}":\n\n`;
    }
    
    // Adicionar as perguntas e respostas ao prompt
    userPrompt += `## Detalhes do Formulário\n`;
    userPrompt += `Nome: ${formData.name}\n`;
    userPrompt += `Número de campos: ${formFields.length}\n`;
    userPrompt += `Total de respostas: ${responses.length}\n\n`;
    
    userPrompt += `## Campos do Formulário\n`;
    formFields.forEach((field, index) => {
      userPrompt += `${index + 1}. ${field.label || field.name} (${field.type})\n`;
    });
    
    userPrompt += `\n## Resumo das Respostas\n`;
    structuredResponses.forEach((response, respondentIndex) => {
      userPrompt += `\n### Respondente ${respondentIndex + 1}: ${response.respondent}\n`;
      userPrompt += `Data: ${response.date}\n`;
      
      Object.entries(response.answers).forEach(([question, answer]) => {
        userPrompt += `- **${question}**: ${answer}\n`;
      });
    });
    
    userPrompt += `\n## Instruções\n`;
    if (action === 'briefing') {
      userPrompt += `- Faça uma análise do público-alvo com base nas respostas\n`;
      userPrompt += `- Identifique objetivos e desafios principais\n`;
      userPrompt += `- Sugira estratégias baseadas nos dados coletados\n`;
      userPrompt += `- Inclua um cronograma sugerido\n`;
    } else if (action === 'proposta') {
      userPrompt += `- Crie uma proposta comercial personalizada de acordo com as necessidades identificadas\n`;
      userPrompt += `- Inclua seções de escopo de trabalho, investimento e cronograma\n`;
      userPrompt += `- Destaque os principais benefícios e diferenciais\n`;
    } else if (action === 'relatorio') {
      userPrompt += `- Analise padrões e tendências nas respostas\n`;
      userPrompt += `- Identifique insights relevantes\n`;
      userPrompt += `- Apresente recomendações baseadas nos dados\n`;
    }
    
    userPrompt += `\nO documento deve ser formatado em Markdown e ser profissional, detalhado e específico para este conjunto de dados. Evite conteúdo genérico.`;
    
    console.log('Enviando prompt para OpenAI:', userPrompt.substring(0, 200) + '...');
    
    try {
      // Chamar a API do ChatGPT
      const chatCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      });
      
      const generatedText = chatCompletion.data.choices[0].message.content;
      
      // Enviar o texto gerado de volta para o frontend
      res.json({
        success: true,
        generatedText
      });
    } catch (openaiError) {
      console.error('Erro na chamada à OpenAI:', openaiError);
      
      // Em caso de erro, enviar uma resposta de fallback
      const fallbackText = `# ${action.charAt(0).toUpperCase() + action.slice(1)} - ${formData.name}\n\n` +
        `**Nota: Ocorreu um erro ao gerar o documento com IA. Abaixo está um resumo dos dados:**\n\n` +
        `- Formulário: ${formData.name}\n` +
        `- Número de respostas: ${responses.length}\n` +
        `- Campos do formulário: ${formFields.map(f => f.label || f.name).join(', ')}\n\n` +
        `Por favor, tente novamente mais tarde.`;
      
      res.json({
        success: true,
        generatedText: fallbackText
      });
    }
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar a solicitação'
    });
  }
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📧 Rotas de email disponíveis em http://localhost:${PORT}/api/email/`);
  console.log(`🔍 Teste a conexão em http://localhost:${PORT}/api/health`);
}); 
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

// Configuração da API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

// Função para criar um prompt baseado no tipo de documento e dados do formulário
function createPrompt(formData, action) {
  const formName = formData.name || "Formulário";
  const formFields = formData.fields || [];
  const responses = formData.responses || {};
  
  let prompt = `Com base nos seguintes dados do formulário "${formName}", `;
  
  // Adiciona as respostas ao prompt
  prompt += "com as seguintes informações:\n\n";
  
  Object.entries(responses).forEach(([field, value]) => {
    prompt += `- ${field}: ${value}\n`;
  });
  
  // Personaliza o prompt de acordo com o tipo de documento
  switch (action) {
    case "briefing":
      prompt += "\n\nCrie um briefing detalhado e bem formatado que contenha:\n";
      prompt += "1. Resumo executivo\n";
      prompt += "2. Contexto e objetivos\n";
      prompt += "3. Público-alvo\n";
      prompt += "4. Estratégia recomendada\n";
      prompt += "5. Próximos passos\n\n";
      prompt += "Use uma linguagem profissional e formate o documento de maneira organizada.";
      break;
      
    case "proposta":
      prompt += "\n\nCrie uma proposta comercial formal e persuasiva que contenha:\n";
      prompt += "1. Introdução e apresentação\n";
      prompt += "2. Compreensão das necessidades do cliente\n";
      prompt += "3. Solução proposta\n";
      prompt += "4. Investimento e condições comerciais\n";
      prompt += "5. Cronograma de implementação\n";
      prompt += "6. Benefícios esperados\n";
      prompt += "7. Conclusão e chamada para ação\n\n";
      prompt += "Use uma linguagem comercial profissional e formate o documento de maneira atrativa.";
      break;
      
    case "relatorio":
      prompt += "\n\nCrie um relatório analítico estruturado que contenha:\n";
      prompt += "1. Sumário executivo\n";
      prompt += "2. Metodologia de análise\n";
      prompt += "3. Descobertas principais\n";
      prompt += "4. Análise detalhada\n";
      prompt += "5. Conclusões\n";
      prompt += "6. Recomendações\n\n";
      prompt += "Use uma linguagem técnica e analítica, e formate o documento com seções claramente definidas.";
      break;
      
    default:
      prompt += "\n\nCrie um documento estruturado que apresente estas informações de forma organizada e profissional.";
  }
  
  return prompt;
}

// Função principal para gerar o documento
export async function generateDocument(formData, action) {
  try {
    console.log(`Gerando ${action} para o formulário: ${formData.name}`);
    
    const prompt = createPrompt(formData, action);
    console.log("Prompt criado:", prompt.substring(0, 100) + "...");
    
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini", // ou outro modelo disponível
      messages: [
        { role: "system", content: "Você é um assistente especializado em criar documentos profissionais a partir de dados de formulários." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    console.log("Resposta recebida da API OpenAI");
    
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("Resposta vazia da API OpenAI");
    }
  } catch (error) {
    console.error("Erro ao gerar documento com OpenAI:", error);
    throw error;
  }
} 
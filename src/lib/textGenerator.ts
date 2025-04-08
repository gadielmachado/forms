/**
 * Gerador de propostas comerciais
 * Esta implementação transforma um texto simples em uma proposta mais elaborada
 */

// Função auxiliar para capitalizar primeira letra
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Função para melhorar a formatação de um parágrafo
const enhanceParagraph = (paragraph: string): string => {
  // Remove espaços extras
  let enhanced = paragraph.trim().replace(/\s+/g, ' ');
  
  // Capitaliza a primeira letra
  enhanced = capitalizeFirstLetter(enhanced);
  
  // Certifica-se que o parágrafo termina com ponto
  if (!enhanced.endsWith('.') && !enhanced.endsWith('!') && !enhanced.endsWith('?')) {
    enhanced += '.';
  }
  
  return enhanced;
};

// Exemplos de frases para cada seção da proposta
const INTRODUCTION_PHRASES = [
  "Agradecemos a oportunidade de apresentar nossa proposta para atender suas necessidades.",
  "É com grande satisfação que apresentamos nossa proposta comercial customizada.",
  "Com base nas informações fornecidas, desenvolvemos uma solução personalizada para sua empresa.",
  "Nossa equipe desenvolveu esta proposta após cuidadosa análise das suas necessidades específicas."
];

const METHODOLOGY_PHRASES = [
  "Nossa metodologia de trabalho é baseada em práticas ágeis e entregas incrementais.",
  "Aplicamos uma abordagem estruturada em fases para garantir resultados consistentes.",
  "Utilizamos uma metodologia própria desenvolvida ao longo de anos de experiência no mercado.",
  "Nossa abordagem combina as melhores práticas do mercado adaptadas à sua realidade."
];

const BENEFITS_PHRASES = [
  "Entre os principais benefícios desta proposta, destacamos:",
  "Nossa solução oferece vantagens competitivas significativas:",
  "Ao implementar nossa proposta, sua empresa poderá obter os seguintes resultados:",
  "Os diferenciais da nossa solução incluem:"
];

const CONCLUSION_PHRASES = [
  "Estamos à disposição para esclarecer quaisquer dúvidas e ajustar nossa proposta conforme necessário.",
  "Aguardamos seu retorno e estamos entusiasmados com a possibilidade de trabalharmos juntos.",
  "Confiamos que nossa proposta atende às suas expectativas e estamos prontos para iniciar o projeto.",
  "Agradecemos a oportunidade e esperamos estabelecer uma parceria de longo prazo."
];

// Seleciona uma frase aleatória de um array
const getRandomPhrase = (phrases: string[]): string => {
  return phrases[Math.floor(Math.random() * phrases.length)];
};

// Transforma um texto simples em uma proposta estruturada
export async function generateProposalFromText(currentText: string): Promise<string> {
  try {
    console.log("Processando proposta...");
    
    // Verifica se há texto para processar
    if (!currentText || currentText.trim().length < 10) {
      return `# Proposta Comercial

## Introdução
${getRandomPhrase(INTRODUCTION_PHRASES)}

## Objetivos
Desenvolver uma solução personalizada que atenda às necessidades específicas do cliente, garantindo qualidade, eficiência e resultados tangíveis.

## Escopo do Projeto
- Análise detalhada das necessidades
- Desenvolvimento da solução
- Implementação e testes
- Acompanhamento e suporte

## Metodologia
${getRandomPhrase(METHODOLOGY_PHRASES)}

## Investimento
O investimento para este projeto foi calculado com base no escopo definido:

| Item | Valor |
|------|-------|
| Fase 1 | R$ 5.000,00 |
| Fase 2 | R$ 7.500,00 |
| Fase 3 | R$ 3.500,00 |
| **Total** | **R$ 16.000,00** |

## Cronograma
- Fase 1: Planejamento e Análise - 2 semanas
- Fase 2: Desenvolvimento - 4 semanas
- Fase 3: Implementação e Testes - 2 semanas
- Fase 4: Entrega e Treinamento - 1 semana

## Benefícios
${getRandomPhrase(BENEFITS_PHRASES)}
- Aumento de produtividade
- Redução de custos operacionais
- Melhoria na qualidade dos processos
- Maior satisfação dos clientes

## Considerações Finais
${getRandomPhrase(CONCLUSION_PHRASES)}`;
    }

    // Analisa o texto existente para determinar o que melhorar
    const hasIntroduction = currentText.toLowerCase().includes("introdução") || currentText.toLowerCase().includes("apresentação");
    const hasMethodology = currentText.toLowerCase().includes("metodologia");
    const hasBenefits = currentText.toLowerCase().includes("benefícios") || currentText.toLowerCase().includes("vantagens");
    const hasConclusion = currentText.toLowerCase().includes("conclusão") || currentText.toLowerCase().includes("considerações");
    
    // Separa o texto em seções baseadas em títulos markdown (##)
    const sections = currentText.split(/#{2,3}\s+[^\n]+/g);
    const titles = currentText.match(/#{2,3}\s+[^\n]+/g) || [];
    
    // Constrói uma nova proposta melhorada
    let improvedProposal = "# Proposta Comercial Aprimorada\n\n";
    
    // Adiciona introdução se não existir
    if (!hasIntroduction) {
      improvedProposal += `## Introdução\n${getRandomPhrase(INTRODUCTION_PHRASES)}\n\n`;
    }
    
    // Adiciona as seções existentes com melhorias
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const content = sections[i + 1] || "";
      
      improvedProposal += `${title}\n`;
      
      // Melhora o conteúdo baseado no tipo de seção
      if (title.toLowerCase().includes("objetivos") || title.toLowerCase().includes("escopo")) {
        improvedProposal += content.trim() + "\n\n";
        improvedProposal += "* Análise detalhada das necessidades do cliente\n";
        improvedProposal += "* Desenvolvimento de soluções personalizadas\n";
        improvedProposal += "* Implementação com acompanhamento contínuo\n";
        improvedProposal += "* Avaliação de resultados e ajustes necessários\n\n";
      } 
      else if (title.toLowerCase().includes("investi") || title.toLowerCase().includes("valor")) {
        improvedProposal += "O investimento para este projeto foi calculado considerando todos os recursos necessários e o valor agregado da solução:\n\n";
        improvedProposal += "| Item | Descrição | Valor |\n";
        improvedProposal += "|------|-----------|-------|\n";
        improvedProposal += "| Fase 1 | Planejamento e Análise | R$ 5.000,00 |\n";
        improvedProposal += "| Fase 2 | Desenvolvimento | R$ 7.500,00 |\n";
        improvedProposal += "| Fase 3 | Implementação e Testes | R$ 3.500,00 |\n";
        improvedProposal += "| **Total** | | **R$ 16.000,00** |\n\n";
        improvedProposal += "Condições de pagamento:\n";
        improvedProposal += "* 40% na aprovação da proposta\n";
        improvedProposal += "* 30% na entrega da fase 2\n";
        improvedProposal += "* 30% na conclusão do projeto\n\n";
      } 
      else {
        improvedProposal += content + "\n\n";
      }
    }
    
    // Adiciona metodologia se não existir
    if (!hasMethodology) {
      improvedProposal += `## Metodologia de Trabalho\n${getRandomPhrase(METHODOLOGY_PHRASES)}\n\n`;
      improvedProposal += "### Fases do Projeto\n";
      improvedProposal += "1. **Descoberta e Planejamento**: Levantamento detalhado de requisitos e definição de estratégias\n";
      improvedProposal += "2. **Desenvolvimento**: Criação iterativa com feedbacks constantes\n";
      improvedProposal += "3. **Implementação**: Entrega gradual com validações em cada etapa\n";
      improvedProposal += "4. **Acompanhamento**: Suporte contínuo e ajustes necessários\n\n";
    }
    
    // Adiciona benefícios se não existir
    if (!hasBenefits) {
      improvedProposal += `## Benefícios da Solução\n${getRandomPhrase(BENEFITS_PHRASES)}\n\n`;
      improvedProposal += "* **Aumento de Produtividade**: Otimização de processos e redução de retrabalho\n";
      improvedProposal += "* **Redução de Custos**: Melhor utilização de recursos e automação de tarefas repetitivas\n";
      improvedProposal += "* **Melhoria da Qualidade**: Processos padronizados e controles eficientes\n";
      improvedProposal += "* **Vantagem Competitiva**: Posicionamento diferenciado no mercado\n\n";
    }
    
    // Adiciona conclusão se não existir
    if (!hasConclusion) {
      improvedProposal += `## Considerações Finais\n${getRandomPhrase(CONCLUSION_PHRASES)}\n\n`;
      improvedProposal += "Nossa equipe está pronta para iniciar o projeto imediatamente após a aprovação desta proposta. Todos os profissionais envolvidos possuem vasta experiência e estão comprometidos com a excelência na entrega dos resultados.\n\n";
    }
    
    console.log("Proposta gerada com sucesso!");
    return improvedProposal;
  } catch (error: any) {
    console.error("Erro ao processar proposta:", error);
    throw new Error(`Falha ao gerar proposta: ${error.message}`);
  }
} 
// Definição de templates de formulários por segmento
// Cada template contém campos predefinidos relevantes para o segmento específico

export interface FormFieldTemplate {
  id: string;
  type: string;
  label: string;
  checkboxOptions?: { id: string; label: string }[];
  isStepDivider?: boolean;
  required?: boolean;
}

export interface FormTemplate {
  name: string;
  fields: FormFieldTemplate[];
  description?: string;
}

// Template para Marketing
export const marketingTemplate: FormTemplate = {
  name: "Formulário de Marketing",
  description: "Formulário para campanhas de marketing e pesquisas",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Pesquisa de Marketing",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
    },
    {
      id: "5",
      type: "checkbox",
      label: "Como você conheceu nossa empresa?",
      checkboxOptions: [
        { id: "opt1", label: "Busca na Internet" },
        { id: "opt2", label: "Redes Sociais" },
        { id: "opt3", label: "Indicação" },
        { id: "opt4", label: "Outros" }
      ]
    },
    {
      id: "6",
      type: "textarea",
      label: "Quais produtos ou serviços você tem interesse?",
    },
  ]
};

// Template para Captação de Leads
export const captacaoLeadsTemplate: FormTemplate = {
  name: "Formulário de Captação de Leads",
  description: "Formulário para captar novos leads e potenciais clientes",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Fale com um Especialista",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email Corporativo",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "text",
      label: "Empresa",
      required: true,
    },
    {
      id: "6",
      type: "text",
      label: "Cargo",
    },
    {
      id: "7",
      type: "checkbox",
      label: "Área de interesse",
      checkboxOptions: [
        { id: "opt1", label: "Produtos" },
        { id: "opt2", label: "Serviços" },
        { id: "opt3", label: "Consultoria" },
        { id: "opt4", label: "Parcerias" }
      ]
    },
    {
      id: "8",
      type: "textarea",
      label: "Descreva sua necessidade",
    },
  ]
};

// Template para Pesquisa de Satisfação
export const pesquisaSatisfacaoTemplate: FormTemplate = {
  name: "Pesquisa de Satisfação",
  description: "Formulário para avaliar a satisfação de clientes",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Pesquisa de Satisfação do Cliente",
    },
    {
      id: "2",
      type: "text",
      label: "Nome",
    },
    {
      id: "3",
      type: "email",
      label: "Email",
    },
    {
      id: "4",
      type: "checkbox",
      label: "Como você avalia nosso atendimento?",
      checkboxOptions: [
        { id: "opt1", label: "Excelente" },
        { id: "opt2", label: "Bom" },
        { id: "opt3", label: "Regular" },
        { id: "opt4", label: "Ruim" }
      ]
    },
    {
      id: "5",
      type: "checkbox",
      label: "Como você avalia nossos produtos/serviços?",
      checkboxOptions: [
        { id: "opt1", label: "Excelente" },
        { id: "opt2", label: "Bom" },
        { id: "opt3", label: "Regular" },
        { id: "opt4", label: "Ruim" }
      ]
    },
    {
      id: "6",
      type: "textarea",
      label: "O que podemos melhorar?",
    },
    {
      id: "7",
      type: "checkbox",
      label: "Você recomendaria nossa empresa?",
      checkboxOptions: [
        { id: "opt1", label: "Com certeza" },
        { id: "opt2", label: "Provavelmente" },
        { id: "opt3", label: "Talvez não" },
        { id: "opt4", label: "Definitivamente não" }
      ]
    },
  ]
};

// Template para Call/Reunião
export const callReuniaoTemplate: FormTemplate = {
  name: "Agendamento de Call/Reunião",
  description: "Formulário para agendamento de calls e reuniões",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Agende uma Reunião",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "text",
      label: "Empresa",
    },
    {
      id: "6",
      type: "date",
      label: "Data Preferencial",
      required: true,
    },
    {
      id: "7",
      type: "time",
      label: "Horário Preferencial",
    },
    {
      id: "8",
      type: "checkbox",
      label: "Tipo de Reunião",
      checkboxOptions: [
        { id: "opt1", label: "Videoconferência" },
        { id: "opt2", label: "Ligação Telefônica" },
        { id: "opt3", label: "Presencial" }
      ]
    },
    {
      id: "9",
      type: "textarea",
      label: "Assunto a ser discutido",
    },
  ]
};

// Template para E-commerce
export const ecommerceTemplate: FormTemplate = {
  name: "Formulário de E-commerce",
  description: "Formulário para lojas online e vendas",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Finalizar Compra",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "text",
      label: "Endereço de Entrega",
      required: true,
    },
    {
      id: "6",
      type: "text",
      label: "CEP",
      required: true,
    },
    {
      id: "7",
      type: "text",
      label: "Cidade",
      required: true,
    },
    {
      id: "8",
      type: "text",
      label: "Estado",
      required: true,
    },
    {
      id: "9",
      type: "checkbox",
      label: "Forma de Pagamento",
      checkboxOptions: [
        { id: "opt1", label: "Cartão de Crédito" },
        { id: "opt2", label: "Boleto Bancário" },
        { id: "opt3", label: "Pix" },
        { id: "opt4", label: "Transferência Bancária" }
      ]
    },
    {
      id: "10",
      type: "textarea",
      label: "Observações sobre o pedido",
    },
  ]
};

// Template para Educação
export const educacaoTemplate: FormTemplate = {
  name: "Formulário Educacional",
  description: "Formulário para instituições educacionais",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Inscrição para Curso",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "date",
      label: "Data de Nascimento",
    },
    {
      id: "6",
      type: "text",
      label: "Formação Acadêmica",
    },
    {
      id: "7",
      type: "checkbox",
      label: "Cursos de Interesse",
      checkboxOptions: [
        { id: "opt1", label: "Graduação" },
        { id: "opt2", label: "Pós-Graduação" },
        { id: "opt3", label: "Extensão" },
        { id: "opt4", label: "Workshop" }
      ]
    },
    {
      id: "8",
      type: "textarea",
      label: "Por que você tem interesse no curso?",
    },
  ]
};

// Template para Saúde
export const saudeTemplate: FormTemplate = {
  name: "Formulário de Saúde",
  description: "Formulário para clínicas e serviços de saúde",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Agendamento de Consulta",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "date",
      label: "Data de Nascimento",
      required: true,
    },
    {
      id: "6",
      type: "checkbox",
      label: "Especialidade Desejada",
      checkboxOptions: [
        { id: "opt1", label: "Clínico Geral" },
        { id: "opt2", label: "Cardiologia" },
        { id: "opt3", label: "Ortopedia" },
        { id: "opt4", label: "Dermatologia" },
        { id: "opt5", label: "Outra" }
      ]
    },
    {
      id: "7",
      type: "date",
      label: "Data Preferencial para Consulta",
      required: true,
    },
    {
      id: "8",
      type: "time",
      label: "Horário Preferencial",
    },
    {
      id: "9",
      type: "checkbox",
      label: "É a primeira consulta?",
      checkboxOptions: [
        { id: "opt1", label: "Sim" },
        { id: "opt2", label: "Não" }
      ]
    },
    {
      id: "10",
      type: "textarea",
      label: "Descrição do caso/sintomas",
    },
  ]
};

// Template para Eventos
export const eventosTemplate: FormTemplate = {
  name: "Formulário de Eventos",
  description: "Formulário para inscrição e organização de eventos",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Inscrição para Evento",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "text",
      label: "Empresa/Instituição",
    },
    {
      id: "6",
      type: "text",
      label: "Cargo",
    },
    {
      id: "7",
      type: "checkbox",
      label: "Tipo de Ingresso",
      checkboxOptions: [
        { id: "opt1", label: "VIP" },
        { id: "opt2", label: "Standard" },
        { id: "opt3", label: "Estudante" }
      ]
    },
    {
      id: "8",
      type: "checkbox",
      label: "Como soube do evento?",
      checkboxOptions: [
        { id: "opt1", label: "Redes Sociais" },
        { id: "opt2", label: "Email Marketing" },
        { id: "opt3", label: "Indicação" },
        { id: "opt4", label: "Site" }
      ]
    },
    {
      id: "9",
      type: "textarea",
      label: "Alguma necessidade especial?",
    },
  ]
};

// Template para Serviços
export const servicosTemplate: FormTemplate = {
  name: "Formulário de Serviços",
  description: "Formulário para prestação de serviços diversos",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Solicitação de Serviços",
    },
    {
      id: "2",
      type: "text",
      label: "Nome Completo",
      required: true,
    },
    {
      id: "3",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      id: "4",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "5",
      type: "text",
      label: "Endereço",
      required: true,
    },
    {
      id: "6",
      type: "checkbox",
      label: "Tipo de Serviço",
      checkboxOptions: [
        { id: "opt1", label: "Consultoria" },
        { id: "opt2", label: "Manutenção" },
        { id: "opt3", label: "Instalação" },
        { id: "opt4", label: "Suporte Técnico" }
      ]
    },
    {
      id: "7",
      type: "date",
      label: "Data Preferencial",
    },
    {
      id: "8",
      type: "time",
      label: "Horário Preferencial",
    },
    {
      id: "9",
      type: "textarea",
      label: "Descreva sua necessidade detalhadamente",
      required: true,
    },
    {
      id: "10",
      type: "checkbox",
      label: "É cliente recorrente?",
      checkboxOptions: [
        { id: "opt1", label: "Sim" },
        { id: "opt2", label: "Não, primeira vez" }
      ]
    },
  ]
};

// Template para Briefing
export const briefingTemplate: FormTemplate = {
  name: "Formulário de Briefing",
  description: "Formulário para coleta de informações e requisitos de projetos",
  fields: [
    {
      id: "1",
      type: "headline",
      label: "Briefing de Projeto",
    },
    {
      id: "2",
      type: "text",
      label: "Nome da Empresa/Cliente",
      required: true,
    },
    {
      id: "3",
      type: "text",
      label: "Nome do Responsável",
      required: true,
    },
    {
      id: "4",
      type: "email",
      label: "Email de Contato",
      required: true,
    },
    {
      id: "5",
      type: "phone",
      label: "Telefone",
      required: true,
    },
    {
      id: "6",
      type: "textarea",
      label: "Descrição do Projeto",
      required: true,
    },
    {
      id: "7",
      type: "textarea",
      label: "Objetivo do Projeto",
      required: true,
    },
    {
      id: "8",
      type: "checkbox",
      label: "Tipo de Projeto",
      checkboxOptions: [
        { id: "opt1", label: "Site/Landing Page" },
        { id: "opt2", label: "E-commerce" },
        { id: "opt3", label: "Aplicativo" },
        { id: "opt4", label: "Sistema Web" },
        { id: "opt5", label: "Marketing Digital" },
        { id: "opt6", label: "Design Gráfico" },
        { id: "opt7", label: "Outro" }
      ]
    },
    {
      id: "9",
      type: "textarea",
      label: "Público-alvo do Projeto",
    },
    {
      id: "10",
      type: "textarea",
      label: "Referências e Inspirações",
    },
    {
      id: "11",
      type: "checkbox",
      label: "Materiais Disponíveis",
      checkboxOptions: [
        { id: "opt1", label: "Logo" },
        { id: "opt2", label: "Manual de Marca" },
        { id: "opt3", label: "Textos" },
        { id: "opt4", label: "Imagens" },
        { id: "opt5", label: "Vídeos" }
      ]
    },
    {
      id: "12",
      type: "date",
      label: "Prazo Desejado para Entrega",
    },
    {
      id: "13",
      type: "textarea",
      label: "Orçamento Previsto ou Faixa de Investimento",
    },
    {
      id: "14",
      type: "textarea",
      label: "Observações Adicionais",
    }
  ]
};

// Mapeamento de tipos de formulário para templates
export const templateMap: Record<string, FormTemplate> = {
  "marketing": marketingTemplate,
  "captacao-leads": captacaoLeadsTemplate,
  "pesquisa-satisfacao": pesquisaSatisfacaoTemplate,
  "call-reuniao": callReuniaoTemplate,
  "ecommerce": ecommerceTemplate,
  "educacao": educacaoTemplate,
  "saude": saudeTemplate,
  "eventos": eventosTemplate,
  "servicos": servicosTemplate,
  "briefing": briefingTemplate
}; 
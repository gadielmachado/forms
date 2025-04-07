const mandrill = require('mandrill-api/mandrill');

// Configurações
const API_KEY = 'md-VoWPtYsKLUib4f2HqAzQmB'; // Nossa API key de teste
const FROM_EMAIL = 'contato@sorenmarketing.com.br';
const TO_EMAIL = 'gadiel@sorenmarketing.com.br';

// Cliente Mandrill
const client = new mandrill.Mandrill(API_KEY);

// Função de teste com catching detalhado de erros
async function testarEnvioEmail() {
  console.log('Iniciando teste de email...');
  console.log(`De: ${FROM_EMAIL}`);
  console.log(`Para: ${TO_EMAIL}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  
  try {
    const messageObj = {
      html: `
        <p>Teste de diagnóstico direto: ${new Date().toISOString()}</p>
        <p>Este é um email de teste para verificar a conexão com o Mandrill.</p>
      `,
      subject: "Teste Diagnóstico - Ephesus",
      from_email: FROM_EMAIL,
      from_name: "Teste Diagnóstico",
      to: [
        {
          email: TO_EMAIL,
          type: "to"
        }
      ]
    };
    
    console.log('Enviando mensagem...');
    
    client.messages.send(
      { message: messageObj },
      (result) => {
        console.log('✅ SUCESSO:');
        console.log(JSON.stringify(result, null, 2));
        if (result && result.length > 0) {
          console.log(`Status: ${result[0].status}`);
          console.log(`Email: ${result[0].email}`);
          if (result[0].reject_reason) {
            console.log(`Motivo rejeição: ${result[0].reject_reason}`);
          }
        }
      },
      (error) => {
        console.log('❌ ERRO AO ENVIAR:');
        console.log(JSON.stringify(error, null, 2));
        
        // Analisar tipos específicos de erro
        if (error.name === 'Error') {
          console.log('Tipo de erro: API Error');
        }
        
        if (error.message && error.message.includes('Invalid API key')) {
          console.log('Problema: API key inválida');
        } else if (error.message && error.message.includes('domain')) {
          console.log('Problema: Domínio não verificado');
        }
      }
    );
  } catch (e) {
    console.log('❌ ERRO GERAL:');
    console.log(e);
  }
}

// Executar o teste
testarEnvioEmail(); 
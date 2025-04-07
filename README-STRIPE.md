# Integração com Stripe

Este documento explica como configurar a integração com o Stripe para processar pagamentos e gerenciar assinaturas.

## ⚠️ IMPORTANTE: Segurança das Chaves

- **NUNCA** compartilhe suas chaves secretas do Stripe
- **NUNCA** comite as chaves em repositórios Git
- **SEMPRE** use variáveis de ambiente

Se suas chaves foram expostas, revogue-as imediatamente no Dashboard do Stripe.

## Pré-requisitos

1. Conta no Stripe
2. Projeto hospedado na Vercel
3. Banco de dados Supabase configurado

## Passos para Configuração

### 1. Configurar o Produto e Preço no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/products)
2. Clique em "Adicionar produto"
3. Preencha os detalhes do produto
4. Defina os preços (único ou recorrente)
5. Anote o ID do preço (começa com `price_`)

### 2. Obter Chaves de API

1. No Dashboard do Stripe, vá para Desenvolvedores > Chaves de API
2. Copie a Chave Publicável (pk_live_) e a Chave Secreta (sk_live_)

### 3. Configurar o Webhook

1. No Dashboard do Stripe, vá para Desenvolvedores > Webhooks
2. Clique em "Adicionar endpoint"
3. Digite a URL do seu webhook: `https://seu-site.vercel.app/api/webhook/stripe`
4. Selecione os eventos para escutar:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Clique em "Adicionar endpoint"
6. Copie o "Signing Secret" (whsec_)

### 4. Configurar Variáveis de Ambiente na Vercel

1. Acesse o Dashboard da Vercel
2. Selecione seu projeto
3. Vá para "Settings" > "Environment Variables"
4. Adicione as seguintes variáveis:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `WEBSITE_URL`

### 5. Aplicar Migrações no Supabase

1. Execute o script SQL em `supabase/migrations/add_stripe_fields.sql` no seu banco de dados Supabase
2. Isso adicionará as colunas necessárias à tabela de usuários

## Uso no Frontend

### Botão de Checkout

```tsx
import { StripeCheckoutButton } from '@/components/StripeCheckoutButton';

function MinhaPagemDeAssinatura() {
  return (
    <div>
      <h1>Assine nosso plano</h1>
      <StripeCheckoutButton
        priceId="price_XXXXXXXXXXXXXXXXXXXXXXXX"
        userEmail="email@exemplo.com"
        userId="user_id_aqui"
        buttonText="Assinar agora"
      />
    </div>
  );
}
```

### Proteger Rotas

```tsx
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

function MinhaRotaProtegida() {
  return (
    <SubscriptionGuard userId="user_id_aqui">
      {/* Conteúdo protegido aqui */}
      <h1>Conteúdo disponível apenas para assinantes</h1>
    </SubscriptionGuard>
  );
}
```

## Fluxo de Pagamento

1. Usuário clica no botão de checkout
2. É redirecionado para a página de pagamento do Stripe
3. Após pagamento bem-sucedido, é redirecionado para a página de sucesso
4. O webhook do Stripe recebe a notificação e atualiza o status do usuário
5. Usuário recebe acesso aos recursos protegidos

## Fluxo de Cancelamento/Falha

1. Se o pagamento falhar, o webhook do Stripe recebe a notificação
2. O status do usuário é atualizado para "pendente"
3. Se a assinatura for cancelada, o webhook recebe a notificação
4. O status do usuário é atualizado para "cancelado"

## Solução de Problemas

### Testando Webhooks Localmente

Use o CLI do Stripe para encaminhar eventos para seu ambiente local:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

### Visualizando Logs

Verifique os logs na Vercel para depurar problemas com webhooks:

1. Acesse o Dashboard da Vercel
2. Selecione seu projeto
3. Vá para "Deployments" > [último deploy] > "Functions" > "api/webhook/stripe"
4. Clique em "Logs"

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Webhooks do Stripe](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout) 
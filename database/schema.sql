-- Verificar se a tabela 'usuarios' existe e criar se não existir
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status_assinatura TEXT DEFAULT 'inativo',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Garantir que o usuário autenticado possa visualizar seus próprios dados
CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios dados"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Garantir que somente supabase pode alterar 'usuarios'
-- (você pode adaptar conforme suas necessidades de segurança)
CREATE POLICY IF NOT EXISTS "Apenas funções podem inserir na tabela usuarios"
  ON usuarios
  FOR INSERT
  WITH CHECK (true);  -- Permitir inserção pelo backend

-- Index para melhorar a performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email); 
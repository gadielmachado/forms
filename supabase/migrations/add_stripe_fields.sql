-- Adicionar campos para gerenciar assinaturas do Stripe

-- Verifique se as colunas não existem antes de adicioná-las
DO $$
BEGIN
    -- Adicionar coluna stripe_customer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN stripe_customer_id VARCHAR;
    END IF;

    -- Adicionar coluna stripe_subscription_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN stripe_subscription_id VARCHAR;
    END IF;

    -- Adicionar coluna status_assinatura
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'status_assinatura'
    ) THEN
        -- Valores possíveis: 'ativo', 'pendente', 'cancelado', 'inativo'
        ALTER TABLE usuarios ADD COLUMN status_assinatura VARCHAR DEFAULT 'inativo' NOT NULL;
    END IF;

    -- Adicionar coluna data_expiracao
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'data_expiracao'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN data_expiracao TIMESTAMPTZ;
    END IF;

    -- Adicionar coluna data_atualizacao
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'data_atualizacao'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN data_atualizacao TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$; 
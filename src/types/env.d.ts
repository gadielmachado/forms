declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    PORT: string;
    POSTMARK_API_KEY: string;
    SENDER_EMAIL: string;
    EMAIL_HOST: string;
  }
}

// Não coloque valores reais aqui, apenas as definições de tipo
// Este arquivo ajuda a evitar os problemas com dependências nativas no Vercel
export default {
  // Configuração mínima
  output: {
    format: 'es',
    exports: 'auto'
  },
  onwarn(warning, warn) {
    // Ignora avisos específicos que podem causar falhas no build
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    // Ignora avisos sobre dependências nativas não encontradas
    if (warning.code === 'MISSING_EXPORT' && /native/.test(warning.message)) return;
    warn(warning);
  }
}; 
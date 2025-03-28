// Script específico para o Vercel
module.exports = {
  // Força o uso de npm em vez de bun
  install: {
    command: 'npm',
    args: ['install', '--no-optional', '--force']
  },
  build: {
    command: 'npm',
    args: ['run', 'vercel-build']
  }
}; 
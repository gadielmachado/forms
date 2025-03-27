# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/539cd3cb-461b-4cec-b542-6190f370e498

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/539cd3cb-461b-4cec-b542-6190f370e498) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/539cd3cb-461b-4cec-b542-6190f370e498) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# Soren Forms

Plataforma de criação de formulários e geração de documentos com IA.

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env` na raiz do projeto
   - Copie o arquivo `backend/.env.example` para `backend/.env` (ou crie o arquivo)
   - Adicione sua chave da API OpenAI em ambos os arquivos

4. Configure o backend:
```bash
cd backend
npm install
```

## Executando o Projeto

Para executar tanto o frontend quanto o backend:
```bash
npm run start
```

Para executar apenas o frontend:
```bash
npm run dev
```

Para executar apenas o backend:
```bash
npm run backend
```

## Funcionalidades

- Criação de formulários dinâmicos
- Coleta de respostas
- Geração de relatórios e propostas com IA
- Exportação de documentos em vários formatos

# PetGestor

Sistema de gestão para pet shops com atendimento de banho e tosa, agenda, comandas, frente de caixa, estoque, financeiro e relacionamento com clientes.

## Tecnologias

- React 19 e TypeScript
- Vite e Tailwind CSS 4
- Node.js e Express
- Supabase
- Capacitor 8
- Lucide React, Motion, Recharts e XLSX

## Pré-requisitos

- Node.js 22 ou superior
- npm
- Projeto no Supabase

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` com base no `.env.example`.

3. Preencha a URL e a chave publicável do projeto Supabase.

4. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

## Verificações

```bash
npm run lint
npm run build
```

## Aplicativos móveis

```bash
npm run cap:sync
npm run cap:open-android
npm run cap:open-ios
```

As credenciais administrativas do Supabase nunca devem ser adicionadas ao frontend ou ao repositório.

# Product Management System - Backend

Este repositório contém o backend do Sistema de Gerenciamento de Produtos, desenvolvido com NestJS e TypeORM.

## Requisitos

- Node.js (v16 ou superior)
- PostgreSQL (v13 ou superior)
- Docker e Docker Compose (opcional, para ambiente containerizado)

## Configuração do Ambiente

### Configuração do .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=product_management
JWT_SECRET=supersecret
```

### Instalação de Dependências

Execute o seguinte comando para instalar as dependências:

```bash
npm install
```

## Executando o Projeto

### Modo de Desenvolvimento

```bash
npm run start:dev
```

### Modo de Produção

```bash
npm run build
npm run start:prod
```

### Modo Debug

```bash
npm run start:debug
```

## Banco de Dados e Migrações

### Criar uma Nova Migração

```bash
npm run migration:generate -- NomeDaMigracao
```

### Executar Migrações

```bash
npm run migration:run
```

### Reverter Migrações

```bash
npm run migration:revert
```

### Resetar o Banco de Dados

```bash
npm run db:reset
```

## Testes

### Executar Todos os Testes

```bash
npm run test
```

### Executar Testes com Cobertura

```bash
npm run test:cov
```

### Executar Testes End-to-End

```bash
npm run test:e2e
```

### Resetar o Banco de Dados de Teste

```bash
npm run test:db:reset
```

## Docker

### Construir e Iniciar os Contêineres

```bash
docker-compose up -d
```

### Parar os Contêineres

```bash
docker-compose down
```

### Construir e Iniciar Apenas o Banco de Dados

```bash
docker-compose up -d postgres
```

### Visualizar Logs dos Contêineres

```bash
docker-compose logs -f
```

## Estrutura do Projeto

```
src/
├── controllers/      # Controladores da API
├── dto/             # Data Transfer Objects
├── entities/        # Entidades do banco de dados
├── migrations/      # Migrações do TypeORM
├── modules/         # Módulos NestJS
├── repositories/    # Repositórios personalizados
├── services/        # Serviços de negócios
└── main.ts          # Ponto de entrada da aplicação
```

## Formatação e Linting

### Formatar o Código

```bash
npm run format
```

### Executar Lint

```bash
npm run lint
```
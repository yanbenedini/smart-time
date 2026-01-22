# Smart Time

## 📖 Resumo do Projeto

**Smart Time** é uma solução _Full Stack_ desenvolvida para o gerenciamento de escalas, turnos e ausências de equipes (focada em squads de tecnologia ou suporte). O sistema permite que administradores e gestores controlem o cadastro de funcionários, monitorem a cobertura de horários (garantindo que não haja "buracos" no atendimento), gerenciem trocas de turno, plantões (sobreaviso) e visualizem logs de auditoria do sistema.

O projeto foi construído com uma arquitetura moderna utilizando **React** no frontend e **Node.js/Express** no backend, com persistência em **PostgreSQL**, e é totalmente "dockerizado" para facilitar o deploy e a escalabilidade.

---

## 🚀 Tecnologias Utilizadas

### Frontend (Client)

- **React 19**: Biblioteca principal para construção da interface de usuário.
- **Vite**: Ferramenta de build rápida para desenvolvimento e compilação.
- **TypeScript**: Adiciona tipagem estática para maior segurança e manutenibilidade.
- **Lucide React**: Biblioteca de ícones leve e consistente.
- **Recharts**: Biblioteca para criação de gráficos e visualização de dados.
- **React Toastify**: Para notificações visuais no sistema.

### Backend (API)

- **Node.js & Express**: Servidor web robusto para a API REST.
- **TypeScript**: Código backend tipado para integridade dos dados.
- **TypeORM**: ORM (Object-Relational Mapping) para interação eficiente com o banco de dados.
- **PostgreSQL**: Banco de dados relacional robusto.
- **Bcryptjs**: Utilizado para hashing seguro de senhas.

### Infraestrutura & DevOps

- **Docker & Docker Compose**: Orquestração de containers para Frontend, Backend e Banco de Dados.
- **PostgreSQL 15**: Imagem oficial do banco de dados.

---

## ✨ Funcionalidades do Sistema

### 1. Autenticação e Segurança

- **Login Seguro**: Autenticação via e-mail e senha com validação de hash (Bcrypt).
- **Controle de Acesso**: Middleware de autorização que diferencia usuários comuns de administradores.
- **Alteração de Senha**: Funcionalidade segura para redefinição de senhas, exigindo a senha atual.

### 2. Gestão de Pessoas (Employees)

- Cadastro completo de funcionários com informações de **Squad**, **Cargo** e **Horário de Turno**.
- CRUD completo (Criar, Ler, Atualizar, Deletar).

### 3. Gestão de Ausências (Absences)

- Registro de ausências programadas ou imprevistas.
- Visualização clara do impacto na equipe.

### 4. Verificação de Cobertura (Squad Coverage)

- **Algoritmo Inteligente**: O sistema possui uma rota dedicada (`/check-coverage`) que verifica automaticamente se há colegas da mesma squad e cargo disponíveis para cobrir um horário específico, cruzando dados de turno e ausências já registradas.

### 5. Gestão de Turnos e Plantões

- **Trocas de Turno**: Registro de trocas de horário entre colaboradores.
- **Plantões (On-Call)**: Gerenciamento de escalas de sobreaviso.

### 6. Auditoria (Logs)

- **Log do Sistema**: Todas as ações críticas (criação, edição, exclusão de registros) são gravadas em uma tabela de logs, permitindo rastrear quem fez o que e quando.

---

## 📦 Estrutura do Banco de Dados

O sistema utiliza PostgreSQL e inicializa automaticamente as seguintes tabelas:

1.  **`employee`**: Dados dos colaboradores.
2.  **`system_user`**: Usuários de acesso ao sistema (com flags `is_admin`, `is_super_admin`).
3.  **`absence`**: Registros de ausências.
4.  **`shift_change`**: Histórico de trocas de turno.
5.  **`on_call_shift`**: Escalas de plantão.
6.  **`system_log`**: Tabela de auditoria.

---

## 🔧 Como Fazer o Deploy

O projeto utiliza **Docker Compose**, o que elimina a necessidade de configurar o ambiente manualmente.

### Pré-requisitos

- Docker
- Docker Compose

### Passo a Passo

1.  **Clone o repositório** e navegue até a pasta raiz.

2.  **Suba os containers**:
    Execute o comando abaixo para construir as imagens e iniciar os serviços:

    ```bash
    docker-compose up -d --build
    ```

3.  **Acesse a aplicação**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **API**: [http://localhost:5000](http://localhost:5000)
    - **Banco de Dados**: Acessível externamente na porta `5433`.
4.  **Lembretes**:
    - No arquivo dbServices mude a url para o ip da sua api
    - Depois lembre-se de liberar as portas para o front, back e banco de dados

### Credenciais Iniciais

Na primeira execução, o banco de dados cria um usuário administrador padrão:

- **Email**: `adm.smarttime@ccmtecnologia.com.br`
- **Senha**: `admin`

> **Nota:** É altamente recomendável alterar esta senha imediatamente após o primeiro login.

---

## 📂 Estrutura de Pastas

- **`/`**: Raiz do projeto (Frontend React + Configurações Docker).
- **`/server`**: Código fonte da API Backend.
  - **`src/entity`**: Definições das tabelas do banco (TypeORM).
  - **`src/index.ts`**: Ponto de entrada da API e rotas.
  - **`database.sql`**: Script SQL de inicialização.
- **`docker-compose.yml`**: Arquivo de orquestração dos serviços.

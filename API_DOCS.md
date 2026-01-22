# Documentação da API - Smart Time

## Visão Geral

Esta API gerencia funcionários, ausências, trocas de turno, plantões e usuários do sistema Smart Time.

- **Base URL**: `http://localhost:5000` (Padrão configurado no `docker-compose.yml`)
- **Autenticação**: Basic Auth (Header `Authorization`) é obrigatório em todas as rotas.

## Autenticação

O sistema utiliza um middleware global de autenticação `Basic Auth`.
Todas as requisições devem conter o header:
`Authorization: Basic <base64(email:senha)>`

Além disso, para logs de auditoria, recomenda-se enviar o header:
`x-user-name: Nome do Usuário`

---

## Rotas de Autenticação

### Login

Valida as credenciais e retorna os dados do usuário (sem a senha).

- **Método**: `POST`
- **Endpoint**: `/login`
- **Body (JSON)**:
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```

### Alterar Senha

Altera a senha do usuário logado.

- **Método**: `POST`
- **Endpoint**: `/change-password`
- **Body (JSON)**:
  ```json
  {
    "userId": "uuid-do-usuario",
    "currentPassword": "senhaAtual",
    "newPassword": "NovaSenhaForte1!"
  }
  ```

---

## Funcionários (Employees)

### Listar Funcionários

- **Método**: `GET`
- **Endpoint**: `/employees`

### Criar Funcionário

- **Método**: `POST`
- **Endpoint**: `/employees`
- **Body (JSON)**:
  ```json
  {
    "firstName": "João",
    "lastName": "Silva",
    "matricula": "12345",
    "email": "joao@email.com",
    "role": "Desenvolvedor",
    "squad": "Alpha",
    "shiftStart": "09:00",
    "shiftEnd": "18:00"
  }
  ```

### Atualizar Funcionário

- **Método**: `PUT`
- **Endpoint**: `/employees/:id`

### Remover Funcionário

- **Método**: `DELETE`
- **Endpoint**: `/employees/:id`

---

## Ausências (Absences)

### Listar Ausências

- **Método**: `GET`
- **Endpoint**: `/absences`

### Registrar Ausência

- **Método**: `POST`
- **Endpoint**: `/absences`
- **Body (JSON)**:
  ```json
  {
    "employeeId": "uuid-do-funcionario",
    "reason": "Férias",
    "date": "2023-10-01",
    "endDate": "2023-10-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "durationMinutes": 480,
    "observation": "Aprovado pelo gestor"
  }
  ```

### Atualizar Ausência

- **Método**: `PUT`
- **Endpoint**: `/absences/:id`

### Remover Ausência

- **Método**: `DELETE`
- **Endpoint**: `/absences/:id`

---

## Trocas de Turno (Shift Changes)

### Listar Trocas

- **Método**: `GET`
- **Endpoint**: `/shift-changes`

### Criar Troca

- **Método**: `POST`
- **Endpoint**: `/shift-changes`
- **Body (JSON)**:
  ```json
  {
    "employeeId": "uuid-do-funcionario",
    "originalShiftStart": "09:00",
    "originalShiftEnd": "18:00",
    "newShiftStart": "14:00",
    "newShiftEnd": "23:00",
    "startDate": "2023-11-01",
    "endDate": "2023-11-05",
    "reason": "Compromisso pessoal"
  }
  ```

### Remover Troca

- **Método**: `DELETE`
- **Endpoint**: `/shift-changes/:id`

---

## Plantões (On Call)

### Listar Plantões

- **Método**: `GET`
- **Endpoint**: `/on-call`

### Criar Plantão

- **Método**: `POST`
- **Endpoint**: `/on-call`
- **Body (JSON)**:
  ```json
  {
    "employeeId": "uuid-do-funcionario",
    "date": "2023-12-25",
    "startTime": "00:00",
    "endTime": "23:59",
    "observation": "Natal"
  }
  ```

### Remover Plantão

- **Método**: `DELETE`
- **Endpoint**: `/on-call/:id`

---

## Verificação Inteligente

### Checar Cobertura de Squad

Verifica se há colegas da mesma squad disponíveis para cobrir um horário.

- **Método**: `POST`
- **Endpoint**: `/check-coverage`
- **Body (JSON)**:
  ```json
  {
    "employeeId": "uuid-do-funcionario-ausente",
    "role": "Desenvolvedor",
    "squad": "Alpha",
    "date": "2023-10-01",
    "startTime": "09:00",
    "endTime": "12:00"
  }
  ```
- **Resposta**: `{"hasCoverage": true}` ou `false`.

---

## Administração (Requer Permissão Admin)

### Usuários do Sistema

- **GET /users**: Lista usuários.
- **POST /users**: Cria usuário (Body: `name`, `email`, `password`, `isAdmin`).
- **PUT /users/:id**: Atualiza usuário.
- **DELETE /users/:id**: Remove usuário.

### Logs do Sistema

- **GET /logs**: Retorna os últimos 100 logs de auditoria.
- **POST /logs**: Grava um log manual (geralmente uso interno).

-- Habilita a extensão para gerar UUIDs (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Funcionários (baseada em Employee.ts)
CREATE TABLE IF NOT EXISTS employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    squad VARCHAR(50) NOT NULL,
    shift_start VARCHAR(10) NOT NULL, -- Formato HH:mm
    shift_end VARCHAR(10) NOT NULL    -- Formato HH:mm
);

-- 2. Tabela de Usuários do Sistema (baseada em SystemUser.ts)
CREATE TABLE IF NOT EXISTS system_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

-- 3. Tabela de Ausências (baseada em Absence.ts)
CREATE TABLE IF NOT EXISTS absence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL,
    observation TEXT,
    approved BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP,
    CONSTRAINT fk_absence_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- 4. Tabela de Trocas de Turno (baseada em ShiftChange.ts)
CREATE TABLE IF NOT EXISTS shift_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    original_shift_start VARCHAR(10) NOT NULL,
    original_shift_end VARCHAR(10) NOT NULL,
    new_shift_start VARCHAR(10) NOT NULL,
    new_shift_end VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP,
    CONSTRAINT fk_shift_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- 5. Tabela de Plantões (baseada em OnCallShift.ts)
CREATE TABLE IF NOT EXISTS on_call_shift (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    observation TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP,
    CONSTRAINT fk_oncall_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- 6. Criação da tabela de logs
CREATE TABLE IF NOT EXISTS system_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação do usuário Admin inicial (Obrigatório para o primeiro login, conforme lógica do UserManager)
-- A senha 'admin' deve ser criptografada na aplicação, mas aqui inserimos texto plano para inicialização se seu backend suportar,
-- ou você pode ajustar conforme a lógica de hash do seu sistema.
INSERT INTO system_user (name, email, password, is_admin)
VALUES ('Administrador', 'adm.smarttime@ccmtecnologia.com.br', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;
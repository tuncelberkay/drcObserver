-- Universal PostgreSQL Mock Database Initialization Script

-- 1. Create mock users table
CREATE TABLE mock_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed mock_users
INSERT INTO mock_users (username, email, role, department, status, last_login) VALUES
('alice_admin', 'alice@mock-domain.local', 'ADMIN', 'Engineering', 'Active', NOW() - INTERVAL '1 day'),
('bob_ops', 'bob@mock-domain.local', 'VIEWER', 'Operations', 'Active', NOW() - INTERVAL '2 hours'),
('charlie_dev', 'charlie@mock-domain.local', 'USER', 'Engineering', 'Active', NOW() - INTERVAL '15 minutes'),
('diana_sec', 'diana@mock-domain.local', 'ADMIN', 'Security', 'Locked', NOW() - INTERVAL '7 days'),
('eve_analyst', 'eve@mock-domain.local', 'USER', 'Data', 'Active', NOW() - INTERVAL '1 hour');

-- 2. Create mock metrics table
CREATE TABLE mock_metrics (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(150) NOT NULL,
    os_version VARCHAR(100),
    agent_status VARCHAR(50),
    cpu_usage_percent INT,
    memory_usage_percent INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed mock_metrics
INSERT INTO mock_metrics (hostname, os_version, agent_status, cpu_usage_percent, memory_usage_percent) VALUES
('core-worker-01', 'Ubuntu 22.04', 'Running', 45, 60),
('core-worker-02', 'Ubuntu 22.04', 'Running', 85, 75),
('db-replica-east', 'RHEL 9', 'Warning', 92, 95),
('db-primary-east', 'RHEL 9', 'Running', 30, 40),
('cache-node-01', 'Alpine Linux', 'Running', 12, 80),
('cache-node-02', 'Alpine Linux', 'Offline', 0, 0);

-- 3. Create mock transactions table
CREATE TABLE mock_transactions (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    gateway VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed mock_transactions
INSERT INTO mock_transactions (amount, currency, gateway, status, created_at) VALUES
(150.00, 'USD', 'Stripe', 'SUCCESS', NOW() - INTERVAL '10 minutes'),
(2400.50, 'USD', 'Braintree', 'SUCCESS', NOW() - INTERVAL '25 minutes'),
(15.99, 'USD', 'Stripe', 'FAILED', NOW() - INTERVAL '40 minutes'),
(999.00, 'USD', 'Adyen', 'SUCCESS', NOW() - INTERVAL '1 hour'),
(45.00, 'USD', 'Stripe', 'SUCCESS', NOW() - INTERVAL '2 hours');

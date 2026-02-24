-- AI-Blockchain Hybrid System Database Schema
-- Creates tables for explainable AI, federated learning, anomaly detection, and smart contracts

-- AI Predictions with Blockchain Verification
CREATE TABLE IF NOT EXISTS ai_predictions_blockchain (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  prediction JSONB NOT NULL,
  confidence DECIMAL(5, 4),
  explanation JSONB,
  blockchain_hash VARCHAR(66) NOT NULL,
  verifiable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_model ON ai_predictions_blockchain(user_id, model_name);
CREATE INDEX IF NOT EXISTS idx_predictions_hash ON ai_predictions_blockchain(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON ai_predictions_blockchain(created_at);

-- Federated Learning Sessions
CREATE TABLE IF NOT EXISTS federated_learning_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  model_type VARCHAR(100) NOT NULL,
  participants JSONB NOT NULL,
  local_models_submitted JSONB DEFAULT '[]',
  aggregated_model_hash VARCHAR(66),
  consensus_reached BOOLEAN DEFAULT false,
  privacy_preserving BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_federated_model ON federated_learning_sessions(model_type);
CREATE INDEX IF NOT EXISTS idx_federated_status ON federated_learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_federated_created ON federated_learning_sessions(created_at);

-- IoMT Device Anomalies
CREATE TABLE IF NOT EXISTS iomt_anomalies (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  patient_did VARCHAR(255) NOT NULL,
  anomaly_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  sensor_data JSONB NOT NULL,
  ai_confidence DECIMAL(5, 4),
  blockchain_proof VARCHAR(66) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomalies_patient ON iomt_anomalies(patient_did);
CREATE INDEX IF NOT EXISTS idx_anomalies_device ON iomt_anomalies(device_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON iomt_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected ON iomt_anomalies(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON iomt_anomalies(resolved);

-- Smart Health Contracts
CREATE TABLE IF NOT EXISTS smart_health_contracts (
  id VARCHAR(255) PRIMARY KEY,
  contract_type VARCHAR(50) NOT NULL,
  parties JSONB NOT NULL,
  conditions JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  execution_log JSONB DEFAULT '[]',
  blockchain_hash VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_type_status ON smart_health_contracts(contract_type, status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON smart_health_contracts(created_at);

-- AI Decision Audit Logs
CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id VARCHAR(255) PRIMARY KEY,
  decision_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  data JSONB,
  ai_model VARCHAR(100) NOT NULL,
  blockchain_hash VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_type ON ai_decision_logs(user_id, decision_type);
CREATE INDEX IF NOT EXISTS idx_logs_model ON ai_decision_logs(ai_model);
CREATE INDEX IF NOT EXISTS idx_logs_created ON ai_decision_logs(created_at);

-- AI Models Registry
CREATE TABLE IF NOT EXISTS ai_models_registry (
  id VARCHAR(255) PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL UNIQUE,
  model_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  accuracy DECIMAL(5, 4),
  training_data_hash VARCHAR(66),
  model_file_path TEXT,
  blockchain_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_name_version ON ai_models_registry(model_name, version);
CREATE INDEX IF NOT EXISTS idx_models_type ON ai_models_registry(model_type);
CREATE INDEX IF NOT EXISTS idx_models_status ON ai_models_registry(status);

-- Blockchain Transactions Log
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id VARCHAR(255) PRIMARY KEY,
  transaction_hash VARCHAR(66) NOT NULL UNIQUE,
  transaction_type VARCHAR(50) NOT NULL,
  from_address VARCHAR(100),
  to_address VARCHAR(100),
  data JSONB,
  gas_used INTEGER,
  block_number BIGINT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON blockchain_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON blockchain_transactions(created_at);

-- Patient AI Consent
CREATE TABLE IF NOT EXISTS patient_ai_consent (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  consent_given BOOLEAN DEFAULT false,
  consent_scope JSONB DEFAULT '[]',
  blockchain_hash VARCHAR(66),
  given_at TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON patient_ai_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_given ON patient_ai_consent(consent_given);

-- Insert sample AI models
INSERT INTO ai_models_registry (id, model_name, model_type, version, description, input_schema, output_schema, accuracy, status)
VALUES
  (
    'model_diabetes_risk_v1',
    'diabetes_risk_model',
    'classification',
    '1.0.0',
    'Predicts Type 2 diabetes risk based on patient vitals and history',
    '{"age": "number", "bmi": "number", "bloodPressure": "number", "glucose": "number", "familyHistory": "boolean"}'::jsonb,
    '{"risk_score": "number", "category": "string", "recommended_action": "string"}'::jsonb,
    0.92,
    'active'
  ),
  (
    'model_heart_disease_v1',
    'heart_disease_model',
    'classification',
    '1.0.0',
    'Predicts cardiovascular disease risk',
    '{"age": "number", "cholesterol": "number", "bloodPressure": "number", "smoking": "boolean", "exercise": "string"}'::jsonb,
    '{"risk_score": "number", "category": "string", "factors": "array"}'::jsonb,
    0.89,
    'active'
  ),
  (
    'model_mental_health_v1',
    'mental_health_crisis_model',
    'classification',
    '1.0.0',
    'Detects mental health crisis indicators',
    '{"sentiment": "number", "keywords": "array", "frequency": "number", "severity": "string"}'::jsonb,
    '{"crisis_probability": "number", "severity": "string", "recommended_action": "string"}'::jsonb,
    0.94,
    'active'
  )
ON CONFLICT (model_name) DO NOTHING;

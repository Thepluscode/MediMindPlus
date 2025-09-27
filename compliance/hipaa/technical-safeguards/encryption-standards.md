# Encryption Standards - MediMind HIPAA Technical Safeguards

## 1. Overview

This document defines the encryption standards and requirements for protecting Electronic Protected Health Information (ePHI) within the MediMind platform in accordance with HIPAA Security Rule requirements.

## 2. Encryption Requirements

### 2.1 Data at Rest Encryption

#### Database Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256-bit encryption keys
- **Implementation**: Transparent Data Encryption (TDE) at database level
- **Scope**: All databases containing ePHI

```sql
-- Example PostgreSQL encryption configuration
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
ALTER SYSTEM SET ssl_ca_file = '/path/to/ca.crt';
```

#### File System Encryption
- **Algorithm**: AES-256-XTS for full disk encryption
- **Implementation**: LUKS (Linux Unified Key Setup) for Linux systems
- **Key Management**: Hardware Security Module (HSM) integration
- **Scope**: All storage devices containing ePHI

#### Application-Level Encryption
- **Algorithm**: AES-256-GCM for field-level encryption
- **Implementation**: Encrypt sensitive fields before database storage
- **Key Rotation**: Automatic key rotation every 90 days
- **Scope**: PII and sensitive health data fields

```python
# Example field-level encryption implementation
from cryptography.fernet import Fernet
import os

class FieldEncryption:
    def __init__(self):
        self.key = os.environ.get('ENCRYPTION_KEY')
        self.cipher = Fernet(self.key)
    
    def encrypt_field(self, data: str) -> bytes:
        """Encrypt sensitive field data"""
        return self.cipher.encrypt(data.encode())
    
    def decrypt_field(self, encrypted_data: bytes) -> str:
        """Decrypt sensitive field data"""
        return self.cipher.decrypt(encrypted_data).decode()
```

### 2.2 Data in Transit Encryption

#### Network Communication
- **Protocol**: TLS 1.3 minimum for all communications
- **Cipher Suites**: AEAD (Authenticated Encryption with Associated Data)
- **Certificate Management**: Automated certificate lifecycle management
- **Perfect Forward Secrecy**: Required for all connections

#### API Communications
- **Protocol**: HTTPS with TLS 1.3
- **Certificate Pinning**: Implemented for mobile applications
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Transparency**: Monitoring enabled

```nginx
# Example Nginx TLS configuration
ssl_protocols TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### Database Connections
- **Protocol**: SSL/TLS encrypted connections only
- **Certificate Verification**: Mutual TLS authentication
- **Connection Pooling**: Encrypted connection pools
- **Monitoring**: Connection encryption status monitoring

### 2.3 Backup Encryption
- **Algorithm**: AES-256-CBC for backup files
- **Key Management**: Separate encryption keys for backups
- **Storage**: Encrypted backups stored in secure cloud storage
- **Verification**: Regular backup decryption testing

## 3. Key Management

### 3.1 Key Generation
- **Algorithm**: Cryptographically secure random number generation
- **Entropy Source**: Hardware random number generators
- **Key Length**: Minimum 256-bit keys for symmetric encryption
- **Key Derivation**: PBKDF2 with minimum 100,000 iterations

### 3.2 Key Storage
- **Primary Storage**: Hardware Security Module (HSM)
- **Backup Storage**: Encrypted key escrow system
- **Access Control**: Multi-person authorization for key access
- **Audit Logging**: All key operations logged and monitored

```python
# Example HSM integration for key management
import boto3
from botocore.exceptions import ClientError

class HSMKeyManager:
    def __init__(self):
        self.hsm_client = boto3.client('cloudhsm')
        self.kms_client = boto3.client('kms')
    
    def generate_data_key(self, key_id: str) -> dict:
        """Generate new data encryption key"""
        try:
            response = self.kms_client.generate_data_key(
                KeyId=key_id,
                KeySpec='AES_256'
            )
            return response
        except ClientError as e:
            logger.error(f"Key generation failed: {e}")
            raise
    
    def encrypt_data_key(self, plaintext_key: bytes) -> bytes:
        """Encrypt data key using HSM"""
        # Implementation for HSM encryption
        pass
```

### 3.3 Key Rotation
- **Schedule**: Automatic rotation every 90 days
- **Process**: Zero-downtime key rotation
- **Versioning**: Multiple key versions maintained
- **Rollback**: Ability to rollback to previous key versions

### 3.4 Key Destruction
- **Method**: Cryptographic erasure and physical destruction
- **Timeline**: Keys destroyed according to retention policy
- **Verification**: Destruction verification and documentation
- **Compliance**: NIST 800-88 guidelines followed

## 4. Encryption Implementation

### 4.1 Application Layer Encryption

#### Patient Data Encryption
```python
class PatientDataEncryption:
    def __init__(self, key_manager):
        self.key_manager = key_manager
        self.encryption_key = key_manager.get_current_key()
    
    def encrypt_patient_record(self, patient_data: dict) -> dict:
        """Encrypt sensitive patient data fields"""
        sensitive_fields = [
            'ssn', 'medical_record_number', 'phone_number',
            'email', 'address', 'emergency_contact'
        ]
        
        encrypted_data = patient_data.copy()
        for field in sensitive_fields:
            if field in encrypted_data:
                encrypted_data[field] = self.encrypt_field(
                    encrypted_data[field]
                )
        
        return encrypted_data
    
    def decrypt_patient_record(self, encrypted_data: dict) -> dict:
        """Decrypt sensitive patient data fields"""
        # Implementation for decryption
        pass
```

#### ML Model Encryption
```python
class MLModelEncryption:
    def __init__(self):
        self.model_key = self.generate_model_key()
    
    def encrypt_model_weights(self, model_weights: np.ndarray) -> bytes:
        """Encrypt ML model weights"""
        serialized_weights = pickle.dumps(model_weights)
        return self.encrypt_data(serialized_weights)
    
    def encrypt_training_data(self, training_data: pd.DataFrame) -> bytes:
        """Encrypt training datasets"""
        # Remove direct identifiers before encryption
        anonymized_data = self.anonymize_data(training_data)
        return self.encrypt_data(anonymized_data.to_pickle())
```

### 4.2 Database Encryption Configuration

#### PostgreSQL Encryption Setup
```sql
-- Enable SSL connections
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- Configure encryption for specific columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encrypted patient table
CREATE TABLE encrypted_patients (
    id UUID PRIMARY KEY,
    encrypted_ssn BYTEA,
    encrypted_medical_record BYTEA,
    encrypted_contact_info BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

#### MongoDB Encryption Configuration
```javascript
// MongoDB field-level encryption configuration
const clientEncryption = new ClientEncryption(keyVaultClient, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
});

// Encrypt patient data before storage
const encryptedSSN = await clientEncryption.encrypt(
  patientData.ssn,
  {
    keyId: dataEncryptionKey,
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
  }
);
```

## 5. Encryption Monitoring and Compliance

### 5.1 Encryption Status Monitoring
- **Real-time Monitoring**: Continuous encryption status monitoring
- **Alerting**: Immediate alerts for encryption failures
- **Dashboards**: Encryption compliance dashboards
- **Reporting**: Regular encryption status reports

### 5.2 Compliance Verification
- **Automated Testing**: Regular encryption verification tests
- **Penetration Testing**: Annual encryption security testing
- **Audit Trails**: Comprehensive encryption audit logs
- **Documentation**: Encryption implementation documentation

### 5.3 Performance Monitoring
- **Latency Monitoring**: Encryption/decryption performance tracking
- **Throughput Monitoring**: System performance impact assessment
- **Optimization**: Regular performance optimization reviews
- **Capacity Planning**: Encryption resource planning

## 6. Incident Response for Encryption

### 6.1 Encryption Failure Response
1. **Immediate Containment**: Isolate affected systems
2. **Impact Assessment**: Determine scope of encryption failure
3. **Recovery Actions**: Restore encryption functionality
4. **Root Cause Analysis**: Identify and address underlying causes
5. **Documentation**: Document incident and response actions

### 6.2 Key Compromise Response
1. **Key Revocation**: Immediately revoke compromised keys
2. **Re-encryption**: Re-encrypt affected data with new keys
3. **Access Review**: Review and update access controls
4. **Notification**: Notify relevant stakeholders and authorities
5. **Lessons Learned**: Update procedures based on incident

## 7. Training and Awareness

### 7.1 Developer Training
- Secure coding practices for encryption
- Proper key management procedures
- Encryption library usage and best practices
- Common encryption vulnerabilities and mitigation

### 7.2 Operations Training
- Encryption system monitoring and maintenance
- Key rotation procedures
- Incident response for encryption failures
- Compliance verification procedures

## 8. Compliance and Audit

### 8.1 Regular Assessments
- **Monthly**: Encryption status reviews
- **Quarterly**: Key rotation compliance verification
- **Annually**: Comprehensive encryption audit
- **Continuous**: Automated compliance monitoring

### 8.2 Documentation Requirements
- Encryption implementation documentation
- Key management procedures
- Incident response records
- Training completion records

## 9. Effective Date and Approval

- **Effective Date**: January 1, 2024
- **Last Reviewed**: January 15, 2024
- **Next Review**: January 15, 2025
- **Approved By**: Chief Information Security Officer
- **Document Owner**: Security Engineering Team

---

**Classification**: Confidential - Internal Use Only

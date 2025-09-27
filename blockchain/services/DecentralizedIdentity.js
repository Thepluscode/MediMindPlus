const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Service for managing decentralized identities and verifiable credentials
 * Implements a simplified version of W3C Decentralized Identifiers (DIDs)
 * and Verifiable Credentials (VCs) for the MediMind platform
 */
class DecentralizedIdentityService {
    constructor() {
        // In-memory storage for demo purposes
        // In production, use a persistent database
        this.identityRegistry = new Map();
        this.verifiableCredentials = new Map();
        this.didDocumentCache = new Map();
    }
    
    // ========== Identity Management ==========
    
    /**
     * Create a new decentralized identity (DID)
     * @param {Object} userInfo - User information for the identity
     * @param {string} userInfo.type - Type of user (patient, provider, researcher, device)
     * @param {string} [userInfo.verificationLevel] - Verification level (basic, verified, certified)
     * @returns {Promise<Object>} The created identity
     */
    async createDecentralizedIdentity(userInfo) {
        // Generate a new DID (Decentralized Identifier)
        const did = `did:medimind:${crypto.randomBytes(16).toString('hex')}`;
        
        // Generate cryptographic key pair
        const keyPair = this.generateKeyPair();
        
        // Create DID Document
        const didDocument = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/ed25519-2020/v1"
            ],
            id: did,
            created: new Date().toISOString(),
            verificationMethod: [{
                id: `${did}#keys-1`,
                type: 'Ed25519VerificationKey2020',
                controller: did,
                publicKeyMultibase: keyPair.publicKey
            }],
            authentication: [`${did}#keys-1`],
            assertionMethod: [`${did}#keys-1`],
            keyAgreement: [{
                id: `${did}#key-agreement-1`,
                type: 'X25519KeyAgreementKey2020',
                controller: did,
                publicKeyMultibase: crypto.randomBytes(32).toString('hex')
            }],
            service: []
        };
        
        // Store the identity
        const identity = {
            did,
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
            didDocument,
            created: new Date().toISOString(),
            userInfo: {
                type: userInfo.type,
                verificationLevel: userInfo.verificationLevel || 'basic'
            },
            credentials: [],
            reputation: 0
        };
        
        this.identityRegistry.set(did, identity);
        this.didDocumentCache.set(did, didDocument);
        
        return identity;
    }
    
    /**
     * Resolve a DID to its DID Document
     * @param {string} did - The DID to resolve
     * @returns {Promise<Object|null>} The DID Document or null if not found
     */
    async resolveDID(did) {
        // Check cache first
        if (this.didDocumentCache.has(did)) {
            return this.didDocumentCache.get(did);
        }
        
        // In a real implementation, this would query a decentralized resolver
        // For this demo, we'll just check our local registry
        const identity = this.identityRegistry.get(did);
        if (identity) {
            this.didDocumentCache.set(did, identity.didDocument);
            return identity.didDocument;
        }
        
        return null;
    }
    
    /**
     * Update an existing DID Document
     * @param {string} did - The DID to update
     * @param {Object} updates - Updates to apply to the DID Document
     * @param {string} privateKey - Private key for signing the update
     * @returns {Promise<Object>} The updated DID Document
     */
    async updateDIDDocument(did, updates, privateKey) {
        const identity = this.identityRegistry.get(did);
        if (!identity) {
            throw new Error('Identity not found');
        }
        
        // Verify the private key matches the identity
        const signer = new ethers.Wallet(privateKey);
        const address = await signer.getAddress();
        
        // In a real implementation, we would verify the signature matches the DID's public key
        // For this demo, we'll just check if the private key is associated with the DID
        if (signer.privateKey !== identity.privateKey) {
            throw new Error('Invalid private key for this DID');
        }
        
        // Apply updates to the DID Document
        const updatedDoc = { ...identity.didDocument, ...updates };
        updatedDoc.updated = new Date().toISOString();
        
        // Update the stored document
        identity.didDocument = updatedDoc;
        this.didDocumentCache.set(did, updatedDoc);
        
        return updatedDoc;
    }
    
    // ========== Verifiable Credentials ==========
    
    /**
     * Issue a verifiable credential
     * @param {string} issuerDID - DID of the issuer
     * @param {string} subjectDID - DID of the subject
     * @param {string} credentialType - Type of credential (e.g., 'MedicalLicense', 'PatientIdentity')
     * @param {Object} claims - Credential claims
     * @param {Object} [options] - Additional options
     * @param {string} [options.expirationDate] - Expiration date (ISO string)
     * @returns {Promise<Object>} The issued verifiable credential
     */
    async issueVerifiableCredential(issuerDID, subjectDID, credentialType, claims, options = {}) {
        const issuer = this.identityRegistry.get(issuerDID);
        if (!issuer) {
            throw new Error('Issuer identity not found');
        }
        
        // Generate a unique credential ID
        const credentialId = `vc:${crypto.randomBytes(16).toString('hex')}`;
        
        // Create the credential
        const credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            id: credentialId,
            type: ['VerifiableCredential', credentialType],
            issuer: issuerDID,
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: subjectDID,
                ...claims
            },
            proof: null // Will be added after creation
        };
        
        // Add expiration if specified
        if (options.expirationDate) {
            credential.expirationDate = options.expirationDate;
        }
        
        // Sign the credential
        credential.proof = this.generateProof(issuerDID, credential);
        
        // Store the credential
        this.verifiableCredentials.set(credentialId, credential);
        
        // Add to subject's identity
        const subject = this.identityRegistry.get(subjectDID);
        if (subject) {
            subject.credentials.push(credentialId);
        }
        
        return credential;
    }
    
    /**
     * Verify a verifiable credential
     * @param {string} credentialId - ID of the credential to verify
     * @returns {Promise<Object>} Verification result
     */
    async verifyCredential(credentialId) {
        const credential = this.verifiableCredentials.get(credentialId);
        if (!credential) {
            return { 
                valid: false, 
                reason: 'Credential not found' 
            };
        }
        
        // Check expiration
        const isNotExpired = !credential.expirationDate || 
                           new Date(credential.expirationDate) > new Date();
        
        if (!isNotExpired) {
            return {
                valid: false,
                reason: 'Credential has expired',
                credential
            };
        }
        
        // Verify proof
        const issuerDID = credential.issuer;
        const isValidProof = this.verifyProof(credential.proof, credential, issuerDID);
        
        // Check revocation status (in a real implementation, this would check a revocation registry)
        const isNotRevoked = !credential.revoked;
        
        return {
            valid: isValidProof && isNotRevoked,
            credential,
            verificationDetails: {
                proofValid: isValidProof,
                notExpired: isNotExpired,
                notRevoked: isNotRevoked
            }
        };
    }
    
    /**
     * Revoke a verifiable credential
     * @param {string} credentialId - ID of the credential to revoke
     * @param {string} issuerPrivateKey - Private key of the issuer
     * @returns {Promise<boolean>} Success status
     */
    async revokeCredential(credentialId, issuerPrivateKey) {
        const credential = this.verifiableCredentials.get(credentialId);
        if (!credential) {
            throw new Error('Credential not found');
        }
        
        // Verify the issuer's identity
        const issuerDID = credential.issuer;
        const issuer = this.identityRegistry.get(issuerDID);
        
        if (!issuer) {
            throw new Error('Issuer identity not found');
        }
        
        // In a real implementation, we would verify the signature
        // For this demo, we'll just check if the private key matches
        const signer = new ethers.Wallet(issuerPrivateKey);
        if (signer.privateKey !== issuer.privateKey) {
            throw new Error('Invalid private key for this issuer');
        }
        
        // Mark as revoked
        credential.revoked = true;
        credential.revocationDate = new Date().toISOString();
        
        return true;
    }
    
    // ========== Authentication & Authorization ==========
    
    /**
     * Create a verifiable presentation
     * @param {string} holderDID - DID of the presentation holder
     * @param {string[]} credentialIds - IDs of credentials to include
     * @param {Object} [options] - Presentation options
     * @param {string} [options.challenge] - Challenge for replay protection
     * @param {string} [options.domain] - Domain for replay protection
     * @returns {Promise<Object>} The verifiable presentation
     */
    async createVerifiablePresentation(holderDID, credentialIds, options = {}) {
        const holder = this.identityRegistry.get(holderDID);
        if (!holder) {
            throw new Error('Holder identity not found');
        }
        
        // Get the credentials
        const credentials = [];
        for (const credentialId of credentialIds) {
            const credential = this.verifiableCredentials.get(credentialId);
            if (credential) {
                credentials.push(credential);
            }
        }
        
        // Create the presentation
        const presentation = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ['VerifiablePresentation'],
            holder: holderDID,
            verifiableCredential: credentials,
            proof: null
        };
        
        // Add challenge and domain if provided
        if (options.challenge) {
            presentation.challenge = options.challenge;
        }
        if (options.domain) {
            presentation.domain = options.domain;
        }
        
        // Sign the presentation
        presentation.proof = this.generateProof(holderDID, presentation);
        
        return presentation;
    }
    
    /**
     * Verify a verifiable presentation
     * @param {Object} presentation - The verifiable presentation
     * @returns {Promise<Object>} Verification result
     */
    async verifyPresentation(presentation) {
        // Verify the presentation proof
        const holderDID = presentation.holder;
        const isProofValid = this.verifyProof(presentation.proof, presentation, holderDID);
        
        // Verify all included credentials
        const credentialResults = [];
        let allCredentialsValid = true;
        
        if (Array.isArray(presentation.verifiableCredential)) {
            for (const credential of presentation.verifiableCredential) {
                const result = await this.verifyCredential(credential.id);
                credentialResults.push(result);
                if (!result.valid) {
                    allCredentialsValid = false;
                }
            }
        }
        
        return {
            valid: isProofValid && allCredentialsValid,
            proofValid: isProofValid,
            credentials: credentialResults,
            allCredentialsValid
        };
    }
    
    // ========== Cryptographic Utilities ==========
    
    /**
     * Generate a cryptographic key pair
     * @returns {Object} Key pair with public and private keys
     */
    generateKeyPair() {
        // In a real implementation, use a more secure key generation method
        // and consider using a hardware security module (HSM) for private keys
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { 
                type: 'spki', 
                format: 'pem' 
            },
            privateKeyEncoding: { 
                type: 'pkcs8', 
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: '' // In production, use a strong passphrase
            }
        });
        
        return {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    }
    
    /**
     * Generate a proof for a verifiable credential or presentation
     * @param {string} did - DID of the signer
     * @param {Object} document - Document to sign
     * @returns {Object} The proof object
     */
    generateProof(did, document) {
        const identity = this.identityRegistry.get(did);
        if (!identity) {
            throw new Error('Identity not found');
        }
        
        // In a real implementation, this would create a proper cryptographic signature
        // For this demo, we'll create a simple hash-based proof
        const dataToSign = JSON.stringify(document, Object.keys(document).sort());
        const hash = crypto.createHash('sha256').update(dataToSign).digest('hex');
        
        return {
            type: 'RsaSignature2018',
            created: new Date().toISOString(),
            verificationMethod: `${did}#keys-1`,
            proofPurpose: 'assertionMethod',
            jws: `eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..${hash}`
        };
    }
    
    /**
     * Verify a proof for a verifiable credential or presentation
     * @param {Object} proof - The proof to verify
     * @param {Object} document - The document to verify against
     * @param {string} did - Expected DID of the signer
     * @returns {boolean} Whether the proof is valid
     */
    verifyProof(proof, document, did) {
        if (!proof || !document || !did) {
            return false;
        }
        
        // In a real implementation, this would verify the cryptographic signature
        // For this demo, we'll just check if the verification method matches the DID
        if (proof.verificationMethod !== `${did}#keys-1`) {
            return false;
        }
        
        // Verify the proof was created before now
        if (new Date(proof.created) > new Date()) {
            return false;
        }
        
        // In a real implementation, we would verify the JWS signature
        // For this demo, we'll just check if the proof has the expected structure
        return proof.type === 'RsaSignature2018' && 
               proof.proofPurpose === 'assertionMethod';
    }
    
    // ========== Reputation Management ==========
    
    /**
     * Update a user's reputation score
     * @param {string} did - User's DID
     * @param {number} scoreDelta - Amount to add to the current score
     * @returns {Promise<number>} New reputation score
     */
    async updateReputation(did, scoreDelta) {
        const identity = this.identityRegistry.get(did);
        if (!identity) {
            throw new Error('Identity not found');
        }
        
        identity.reputation = Math.max(0, (identity.reputation || 0) + scoreDelta);
        return identity.reputation;
    }
    
    /**
     * Get a user's reputation score
     * @param {string} did - User's DID
     * @returns {Promise<number>} Reputation score
     */
    async getReputation(did) {
        const identity = this.identityRegistry.get(did);
        if (!identity) {
            throw new Error('Identity not found');
        }
        
        return identity.reputation || 0;
    }
    
    // ========== Helper Methods ==========
    
    /**
     * Get all credentials for a DID
     * @param {string} did - The DID to get credentials for
     * @returns {Promise<Array>} Array of verifiable credentials
     */
    async getCredentialsForDID(did) {
        const identity = this.identityRegistry.get(did);
        if (!identity) {
            return [];
        }
        
        return identity.credentials
            .map(credentialId => this.verifiableCredentials.get(credentialId))
            .filter(Boolean);
    }
    
    /**
     * Search for credentials based on criteria
     * @param {Object} query - Search criteria
     * @returns {Promise<Array>} Matching verifiable credentials
     */
    async searchCredentials(query) {
        const results = [];
        
        for (const [id, credential] of this.verifiableCredentials) {
            let match = true;
            
            // Check each query parameter against the credential
            for (const [key, value] of Object.entries(query)) {
                if (key === 'type') {
                    // Special handling for type matching
                    if (Array.isArray(credential.type)) {
                        if (!credential.type.includes(value)) {
                            match = false;
                            break;
                        }
                    } else if (credential.type !== value) {
                        match = false;
                        break;
                    }
                } else if (key.startsWith('credentialSubject.')) {
                    // Handle nested credentialSubject properties
                    const prop = key.split('.')[1];
                    if (credential.credentialSubject[prop] !== value) {
                        match = false;
                        break;
                    }
                } else if (credential[key] !== value) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                results.push(credential);
            }
        }
        
        return results;
    }
}

module.exports = DecentralizedIdentityService;

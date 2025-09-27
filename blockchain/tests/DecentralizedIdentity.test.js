const { expect } = require('chai');
const { ethers } = require('ethers');
const DecentralizedIdentityService = require('../services/DecentralizedIdentity');

describe('DecentralizedIdentityService', () => {
    let identityService;
    
    // Test DIDs
    let patientDID;
    let providerDID;
    let researcherDID;
    
    // Test credentials
    let licenseCredentialId;
    let identityCredentialId;
    
    before(() => {
        identityService = new DecentralizedIdentityService();
    });
    
    describe('Identity Management', () => {
        it('should create a new patient identity', async () => {
            const identity = await identityService.createDecentralizedIdentity({
                type: 'patient',
                verificationLevel: 'verified'
            });
            
            expect(identity).to.have.property('did');
            expect(identity.did).to.match(/^did:medimind:[a-f0-9]+$/);
            expect(identity.userInfo.type).to.equal('patient');
            expect(identity.userInfo.verificationLevel).to.equal('verified');
            
            patientDID = identity.did;
        });
        
        it('should create a new healthcare provider identity', async () => {
            const identity = await identityService.createDecentralizedIdentity({
                type: 'provider',
                verificationLevel: 'certified'
            });
            
            expect(identity).to.have.property('did');
            providerDID = identity.did;
        });
        
        it('should create a new researcher identity', async () => {
            const identity = await identityService.createDecentralizedIdentity({
                type: 'researcher',
                verificationLevel: 'verified'
            });
            
            expect(identity).to.have.property('did');
            researcherDID = identity.did;
        });
        
        it('should resolve a DID to its document', async () => {
            const didDocument = await identityService.resolveDID(patientDID);
            
            expect(didDocument).to.have.property('id', patientDID);
            expect(didDocument.verificationMethod).to.be.an('array').that.is.not.empty;
            expect(didDocument.authentication).to.be.an('array').that.is.not.empty;
        });
        
        it('should update a DID document', async () => {
            const identity = identityService.identityRegistry.get(patientDID);
            const privateKey = identity.privateKey;
            
            const update = {
                service: [{
                    id: `${patientDID}#linked-domain`,
                    type: 'LinkedDomains',
                    serviceEndpoint: 'https://patient.example.com'
                }]
            };
            
            const updatedDoc = await identityService.updateDIDDocument(
                patientDID, 
                update, 
                privateKey
            );
            
            expect(updatedDoc.service).to.be.an('array').with.lengthOf(1);
            expect(updatedDoc.service[0].serviceEndpoint).to.equal('https://patient.example.com');
            
            // Verify the update is reflected in the resolved document
            const resolvedDoc = await identityService.resolveDID(patientDID);
            expect(resolvedDoc.service).to.deep.equal(updatedDoc.service);
        });
        
        it('should reject update with invalid private key', async () => {
            const invalidPrivateKey = ethers.Wallet.createRandom().privateKey;
            
            try {
                await identityService.updateDIDDocument(
                    patientDID,
                    { service: [] },
                    invalidPrivateKey
                );
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Invalid private key');
            }
        });
    });
    
    describe('Verifiable Credentials', () => {
        it('should issue a verifiable credential', async () => {
            // Get the provider's private key for signing
            const providerIdentity = identityService.identityRegistry.get(providerDID);
            const providerPrivateKey = providerIdentity.privateKey;
            
            // Issue a medical license credential to the provider
            const credential = await identityService.issueVerifiableCredential(
                providerDID, // self-issued
                providerDID, // subject is the provider themselves
                'MedicalLicense',
                {
                    licenseType: 'MD',
                    specialty: 'Cardiology',
                    issuingAuthority: 'State Medical Board',
                    licenseNumber: 'MD123456'
                },
                {
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
                }
            );
            
            expect(credential).to.have.property('id');
            expect(credential.issuer).to.equal(providerDID);
            expect(credential.credentialSubject.id).to.equal(providerDID);
            expect(credential.credentialSubject.licenseType).to.equal('MD');
            expect(credential).to.have.property('proof');
            
            licenseCredentialId = credential.id;
        });
        
        it('should issue a patient identity credential', async () => {
            // Issue a patient identity credential
            const credential = await identityService.issueVerifiableCredential(
                providerDID, // issued by healthcare provider
                patientDID,  // issued to patient
                'PatientIdentity',
                {
                    name: 'John Doe',
                    dateOfBirth: '1980-01-01',
                    bloodType: 'O+',
                    allergies: ['penicillin']
                },
                {
                    expirationDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString() // 5 years
                }
            );
            
            expect(credential).to.have.property('id');
            expect(credential.issuer).to.equal(providerDID);
            expect(credential.credentialSubject.id).to.equal(patientDID);
            expect(credential.credentialSubject.name).to.equal('John Doe');
            
            identityCredentialId = credential.id;
        });
        
        it('should verify a valid credential', async () => {
            const result = await identityService.verifyCredential(licenseCredentialId);
            
            expect(result).to.have.property('valid', true);
            expect(result.credential).to.have.property('id', licenseCredentialId);
            expect(result.verificationDetails.proofValid).to.be.true;
            expect(result.verificationDetails.notExpired).to.be.true;
            expect(result.verificationDetails.notRevoked).to.be.true;
        });
        
        it('should detect a revoked credential', async () => {
            // Revoke the credential
            const providerIdentity = identityService.identityRegistry.get(providerDID);
            await identityService.revokeCredential(identityCredentialId, providerIdentity.privateKey);
            
            // Verify it's now revoked
            const result = await identityService.verifyCredential(identityCredentialId);
            expect(result.valid).to.be.false;
            expect(result.verificationDetails.notRevoked).to.be.false;
        });
    });
    
    describe('Verifiable Presentations', () => {
        it('should create a verifiable presentation', async () => {
            // Get the patient's credentials
            const patientIdentity = identityService.identityRegistry.get(patientDID);
            const credentials = await identityService.getCredentialsForDID(patientDID);
            
            // Create a presentation with the patient's credentials
            const presentation = await identityService.createVerifiablePresentation(
                patientDID,
                [credentials[0].id],
                {
                    challenge: 'random-challenge-123',
                    domain: 'example.com'
                }
            );
            
            expect(presentation).to.have.property('holder', patientDID);
            expect(presentation.verifiableCredential).to.be.an('array').with.lengthOf(1);
            expect(presentation).to.have.property('challenge', 'random-challenge-123');
            expect(presentation).to.have.property('domain', 'example.com');
            expect(presentation).to.have.property('proof');
            
            // Verify the presentation
            const verification = await identityService.verifyPresentation(presentation);
            expect(verification.valid).to.be.true;
            expect(verification.proofValid).to.be.true;
            expect(verification.allCredentialsValid).to.be.true;
        });
        
        it('should reject a presentation with invalid proof', async () => {
            // Create a presentation with a tampered proof
            const presentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                type: ['VerifiablePresentation'],
                holder: patientDID,
                verifiableCredential: [],
                proof: {
                    type: 'RsaSignature2018',
                    created: new Date().toISOString(),
                    verificationMethod: `${patientDID}#keys-1`,
                    proofPurpose: 'assertionMethod',
                    jws: 'invalid-signature'
                }
            };
            
            const verification = await identityService.verifyPresentation(presentation);
            expect(verification.valid).to.be.false;
            expect(verification.proofValid).to.be.false;
        });
    });
    
    describe('Credential Search', () => {
        it('should find credentials by type', async () => {
            const credentials = await identityService.searchCredentials({
                type: 'MedicalLicense'
            });
            
            expect(credentials).to.be.an('array').with.lengthOf(1);
            expect(credentials[0].type).to.include('MedicalLicense');
        });
        
        it('should find credentials by subject property', async () => {
            const credentials = await identityService.searchCredentials({
                'credentialSubject.name': 'John Doe'
            });
            
            expect(credentials).to.be.an('array').with.lengthOf(1);
            expect(credentials[0].credentialSubject.name).to.equal('John Doe');
        });
    });
    
    describe('Reputation Management', () => {
        it('should update and get reputation', async () => {
            // Initial reputation should be 0
            let reputation = await identityService.getReputation(patientDID);
            expect(reputation).to.equal(0);
            
            // Increase reputation
            const newReputation = await identityService.updateReputation(patientDID, 10);
            expect(newReputation).to.equal(10);
            
            // Verify the update
            reputation = await identityService.getReputation(patientDID);
            expect(reputation).to.equal(10);
            
            // Decrease reputation (but not below 0)
            await identityService.updateReputation(patientDID, -5);
            reputation = await identityService.getReputation(patientDID);
            expect(reputation).to.equal(5);
            
            await identityService.updateReputation(patientDID, -10); // Should not go below 0
            reputation = await identityService.getReputation(patientDID);
            expect(reputation).to.equal(0);
        });
    });
});

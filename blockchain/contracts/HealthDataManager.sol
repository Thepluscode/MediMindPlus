// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title HealthDataManager
 * @dev A smart contract for managing health data with access control and privacy features
 */
contract HealthDataManager is AccessControl, ReentrancyGuard, ERC721 {
    using ECDSA for bytes32;
    
    // Role definitions
    bytes32 public constant HEALTHCARE_PROVIDER_ROLE = keccak256("HEALTHCARE_PROVIDER_ROLE");
    bytes32 public constant RESEARCHER_ROLE = keccak256("RESEARCHER_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    
    // Data structures
    struct HealthRecord {
        uint256 tokenId;
        address patient;
        string dataHash; // IPFS hash of encrypted data
        string metadataHash; // IPFS hash of metadata
        uint256 timestamp;
        bool isActive;
        mapping(address => bool) authorizedAccess;
        mapping(address => uint256) accessExpiry;
    }
    
    struct ConsentRecord {
        address patient;
        address provider;
        string purpose;
        uint256 expiryDate;
        bool isActive;
        string[] dataTypes;
        uint256 compensationAmount;
        bool autoRenew;
    }
    
    struct ResearchStudy {
        uint256 studyId;
        address sponsor;
        string studyHash; // IPFS hash of study protocol
        uint256 participantCount;
        uint256 maxParticipants;
        uint256 compensationPerParticipant;
        bool isActive;
        mapping(address => bool) participants;
        mapping(address => uint256) participantRewards;
    }
    
    struct PredictionRecord {
        uint256 recordId;
        address patient;
        string modelVersion;
        string predictionHash; // IPFS hash of prediction data
        uint256 confidence;
        uint256 timestamp;
        bool verified;
        address verifyingProvider;
    }
    
    // State variables
    mapping(uint256 => HealthRecord) public healthRecords;
    mapping(address => uint256[]) public patientRecords;
    mapping(bytes32 => ConsentRecord) public consents;
    mapping(uint256 => ResearchStudy) public researchStudies;
    mapping(uint256 => PredictionRecord) public predictions;
    mapping(address => uint256) public patientReputationScores;
    mapping(address => uint256) public providerReputationScores;
    
    uint256 private _recordCounter;
    uint256 private _studyCounter;
    uint256 private _predictionCounter;
    
    // Events
    event HealthRecordCreated(uint256 indexed tokenId, address indexed patient, string dataHash);
    event ConsentGranted(bytes32 indexed consentId, address indexed patient, address indexed provider);
    event ConsentRevoked(bytes32 indexed consentId, address indexed patient);
    event DataAccessed(uint256 indexed tokenId, address indexed accessor, string purpose);
    event ResearchStudyCreated(uint256 indexed studyId, address indexed sponsor);
    event ParticipantJoined(uint256 indexed studyId, address indexed participant);
    event PredictionRecorded(uint256 indexed recordId, address indexed patient, string modelVersion);
    event ReputationUpdated(address indexed user, uint256 newScore);
    
    /**
     * @dev Constructor that sets up the default admin role
     */
    constructor() ERC721("HealthDataNFT", "HDN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // Modifiers
    modifier onlyPatientOrAuthorized(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || 
            healthRecords[tokenId].authorizedAccess[msg.sender] ||
            hasRole(HEALTHCARE_PROVIDER_ROLE, msg.sender),
            "Unauthorized access"
        );
        _;
    }
    
    modifier validConsent(address patient, address provider, string memory purpose) {
        bytes32 consentId = keccak256(abi.encodePacked(patient, provider, purpose));
        require(
            consents[consentId].isActive && 
            consents[consentId].expiryDate > block.timestamp,
            "Valid consent required"
        );
        _;
    }
    
    // Core functions
    
    /**
     * @dev Creates a new health record
     * @param dataHash IPFS hash of the encrypted health data
     * @param metadataHash IPFS hash of the metadata
     * @return The ID of the created health record
     */
    function createHealthRecord(
        string memory dataHash,
        string memory metadataHash
    ) external returns (uint256) {
        _recordCounter++;
        uint256 tokenId = _recordCounter;
        
        _mint(msg.sender, tokenId);
        
        HealthRecord storage record = healthRecords[tokenId];
        record.tokenId = tokenId;
        record.patient = msg.sender;
        record.dataHash = dataHash;
        record.metadataHash = metadataHash;
        record.timestamp = block.timestamp;
        record.isActive = true;
        
        patientRecords[msg.sender].push(tokenId);
        
        // Increase patient reputation for contributing data
        patientReputationScores[msg.sender] += 10;
        
        emit HealthRecordCreated(tokenId, msg.sender, dataHash);
        emit ReputationUpdated(msg.sender, patientReputationScores[msg.sender]);
        
        return tokenId;
    }
    
    /**
     * @dev Grants consent for data access
     * @param provider Address of the healthcare provider
     * @param purpose Purpose of the data access
     * @param duration Duration of consent in seconds
     * @param dataTypes Array of data types being accessed
     * @param compensationAmount Compensation amount in wei
     * @param autoRenew Whether to auto-renew the consent
     */
    function grantConsent(
        address provider,
        string memory purpose,
        uint256 duration,
        string[] memory dataTypes,
        uint256 compensationAmount,
        bool autoRenew
    ) external {
        require(hasRole(HEALTHCARE_PROVIDER_ROLE, provider), "Invalid provider");
        
        bytes32 consentId = keccak256(abi.encodePacked(msg.sender, provider, purpose));
        
        ConsentRecord storage consent = consents[consentId];
        consent.patient = msg.sender;
        consent.provider = provider;
        consent.purpose = purpose;
        consent.expiryDate = block.timestamp + duration;
        consent.isActive = true;
        consent.dataTypes = dataTypes;
        consent.compensationAmount = compensationAmount;
        consent.autoRenew = autoRenew;
        
        emit ConsentGranted(consentId, msg.sender, provider);
    }
    
    /**
     * @dev Revokes previously granted consent
     * @param provider Address of the healthcare provider
     * @param purpose Purpose of the consent to revoke
     */
    function revokeConsent(address provider, string memory purpose) external {
        bytes32 consentId = keccak256(abi.encodePacked(msg.sender, provider, purpose));
        require(consents[consentId].patient == msg.sender, "Unauthorized");
        
        consents[consentId].isActive = false;
        
        emit ConsentRevoked(consentId, msg.sender);
    }
    
    /**
     * @dev Accesses health data with proper authorization
     * @param tokenId ID of the health record to access
     * @param purpose Purpose of the access
     * @return IPFS hash of the health data
     */
    function accessHealthData(
        uint256 tokenId,
        string memory purpose
    ) external 
        onlyRole(HEALTHCARE_PROVIDER_ROLE)
        validConsent(healthRecords[tokenId].patient, msg.sender, purpose)
        returns (string memory) 
    {
        require(healthRecords[tokenId].isActive, "Record not active");
        
        // Update provider reputation for legitimate access
        providerReputationScores[msg.sender] += 5;
        
        emit DataAccessed(tokenId, msg.sender, purpose);
        emit ReputationUpdated(msg.sender, providerReputationScores[msg.sender]);
        
        return healthRecords[tokenId].dataHash;
    }
    
    /**
     * @dev Creates a new research study
     * @param studyHash IPFS hash of the study protocol
     * @param maxParticipants Maximum number of participants
     * @param compensationPerParticipant Compensation per participant in wei
     * @return The ID of the created study
     */
    function createResearchStudy(
        string memory studyHash,
        uint256 maxParticipants,
        uint256 compensationPerParticipant
    ) external payable returns (uint256) {
        require(msg.value >= maxParticipants * compensationPerParticipant, "Insufficient funding");
        
        _studyCounter++;
        uint256 studyId = _studyCounter;
        
        ResearchStudy storage study = researchStudies[studyId];
        study.studyId = studyId;
        study.sponsor = msg.sender;
        study.studyHash = studyHash;
        study.maxParticipants = maxParticipants;
        study.compensationPerParticipant = compensationPerParticipant;
        study.isActive = true;
        
        emit ResearchStudyCreated(studyId, msg.sender);
        
        return studyId;
    }
    
    /**
     * @dev Joins a research study
     * @param studyId ID of the study to join
     */
    function joinResearchStudy(uint256 studyId) external {
        ResearchStudy storage study = researchStudies[studyId];
        require(study.isActive, "Study not active");
        require(study.participantCount < study.maxParticipants, "Study full");
        require(!study.participants[msg.sender], "Already participating");
        
        study.participants[msg.sender] = true;
        study.participantCount++;
        study.participantRewards[msg.sender] = study.compensationPerParticipant;
        
        // Transfer compensation
        payable(msg.sender).transfer(study.compensationPerParticipant);
        
        // Increase reputation for research participation
        patientReputationScores[msg.sender] += 25;
        
        emit ParticipantJoined(studyId, msg.sender);
        emit ReputationUpdated(msg.sender, patientReputationScores[msg.sender]);
    }
    
    /**
     * @dev Records an AI prediction
     * @param patient Address of the patient
     * @param modelVersion Version of the AI model used
     * @param predictionHash IPFS hash of the prediction data
     * @param confidence Confidence score (0-100)
     * @return The ID of the recorded prediction
     */
    function recordPrediction(
        address patient,
        string memory modelVersion,
        string memory predictionHash,
        uint256 confidence
    ) external onlyRole(AI_ORACLE_ROLE) returns (uint256) {
        _predictionCounter++;
        uint256 recordId = _predictionCounter;
        
        PredictionRecord storage prediction = predictions[recordId];
        prediction.recordId = recordId;
        prediction.patient = patient;
        prediction.modelVersion = modelVersion;
        prediction.predictionHash = predictionHash;
        prediction.confidence = confidence;
        prediction.timestamp = block.timestamp;
        
        emit PredictionRecorded(recordId, patient, modelVersion);
        
        return recordId;
    }
    
    /**
     * @dev Verifies an AI prediction
     * @param recordId ID of the prediction to verify
     */
    function verifyPrediction(
        uint256 recordId
    ) external onlyRole(HEALTHCARE_PROVIDER_ROLE) {
        require(predictions[recordId].recordId != 0, "Prediction not found");
        require(!predictions[recordId].verified, "Already verified");
        
        predictions[recordId].verified = true;
        predictions[recordId].verifyingProvider = msg.sender;
        
        // Reward provider for verification
        providerReputationScores[msg.sender] += 15;
        emit ReputationUpdated(msg.sender, providerReputationScores[msg.sender]);
    }
    
    // View functions
    
    /**
     * @dev Gets all record IDs for a patient
     * @param patient Address of the patient
     * @return Array of record IDs
     */
    function getPatientRecords(address patient) external view returns (uint256[] memory) {
        return patientRecords[patient];
    }
    
    /**
     * @dev Gets the reputation score of a user
     * @param user Address of the user
     * @return The user's reputation score
     */
    function getReputationScore(address user) external view returns (uint256) {
        if (hasRole(HEALTHCARE_PROVIDER_ROLE, user)) {
            return providerReputationScores[user];
        } else {
            return patientReputationScores[user];
        }
    }
    
    /**
     * @dev Gets the status of a consent
     * @param patient Address of the patient
     * @param provider Address of the provider
     * @param purpose Purpose of the consent
     * @return Whether the consent is active and its expiry date
     */
    function getConsentStatus(
        address patient,
        address provider,
        string memory purpose
    ) external view returns (bool, uint256) {
        bytes32 consentId = keccak256(abi.encodePacked(patient, provider, purpose));
        ConsentRecord memory consent = consents[consentId];
        return (
            consent.isActive && consent.expiryDate > block.timestamp,
            consent.expiryDate
        );
    }
    
    // Emergency functions
    
    /**
     * @dev Emergency access to health data (restricted to providers)
     * @param tokenId ID of the health record
     * @param justification Reason for emergency access
     * @return IPFS hash of the health data
     */
    function emergencyAccess(
        uint256 tokenId,
        string memory justification
    ) external onlyRole(HEALTHCARE_PROVIDER_ROLE) returns (string memory) {
        require(healthRecords[tokenId].isActive, "Record not active");
        
        // Log emergency access
        emit DataAccessed(tokenId, msg.sender, string(abi.encodePacked("EMERGENCY: ", justification)));
        
        return healthRecords[tokenId].dataHash;
    }
    
    // Admin functions
    
    /**
     * @dev Adds a healthcare provider (admin only)
     * @param provider Address of the provider to add
     */
    function addHealthcareProvider(address provider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(HEALTHCARE_PROVIDER_ROLE, provider);
    }
    
    /**
     * @dev Adds a researcher (admin only)
     * @param researcher Address of the researcher to add
     */
    function addResearcher(address researcher) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RESEARCHER_ROLE, researcher);
    }
    
    /**
     * @dev Adds an AI oracle (admin only)
     * @param oracle Address of the AI oracle to add
     */
    function addAIOracle(address oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(AI_ORACLE_ROLE, oracle);
    }
}

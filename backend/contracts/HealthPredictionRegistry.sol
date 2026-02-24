// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title HealthPredictionRegistry
 * @dev Smart contract for storing AI health predictions on blockchain
 * Provides immutable audit trail and verification capabilities
 */
contract HealthPredictionRegistry {

    struct Prediction {
        string predictionId;
        address patientAddress;
        string modelName;
        bytes32 predictionHash;
        uint256 confidence;
        uint256 timestamp;
        bool verified;
    }

    struct Consent {
        address patientAddress;
        bool consentGiven;
        string[] consentScope;
        uint256 givenAt;
        uint256 revokedAt;
    }

    struct Anomaly {
        string anomalyId;
        address patientAddress;
        string deviceId;
        string anomalyType;
        uint8 severity; // 0=low, 1=medium, 2=high, 3=critical
        bytes32 sensorDataHash;
        uint256 aiConfidence;
        uint256 detectedAt;
        bool resolved;
    }

    // Storage
    mapping(string => Prediction) public predictions;
    mapping(address => Consent) public consents;
    mapping(string => Anomaly) public anomalies;
    mapping(address => string[]) public patientPredictions;
    mapping(address => string[]) public patientAnomalies;

    // Events
    event PredictionStored(
        string indexed predictionId,
        address indexed patientAddress,
        string modelName,
        uint256 confidence,
        uint256 timestamp
    );

    event PredictionVerified(
        string indexed predictionId,
        address indexed verifier,
        uint256 timestamp
    );

    event ConsentUpdated(
        address indexed patientAddress,
        bool consentGiven,
        uint256 timestamp
    );

    event AnomalyDetected(
        string indexed anomalyId,
        address indexed patientAddress,
        string anomalyType,
        uint8 severity,
        uint256 timestamp
    );

    event AnomalyResolved(
        string indexed anomalyId,
        address indexed resolver,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyPatient(address _patientAddress) {
        require(msg.sender == _patientAddress, "Only patient can access");
        _;
    }

    modifier hasConsent(address _patientAddress) {
        require(consents[_patientAddress].consentGiven, "Patient consent required");
        _;
    }

    /**
     * @dev Store AI prediction on blockchain
     * @param _predictionId Unique prediction identifier
     * @param _patientAddress Patient's blockchain address
     * @param _modelName Name of AI model used
     * @param _predictionHash Hash of prediction data
     * @param _confidence Confidence score (0-10000 representing 0-100%)
     */
    function storePrediction(
        string memory _predictionId,
        address _patientAddress,
        string memory _modelName,
        bytes32 _predictionHash,
        uint256 _confidence
    ) public hasConsent(_patientAddress) {
        require(bytes(predictions[_predictionId].predictionId).length == 0, "Prediction already exists");

        Prediction memory newPrediction = Prediction({
            predictionId: _predictionId,
            patientAddress: _patientAddress,
            modelName: _modelName,
            predictionHash: _predictionHash,
            confidence: _confidence,
            timestamp: block.timestamp,
            verified: false
        });

        predictions[_predictionId] = newPrediction;
        patientPredictions[_patientAddress].push(_predictionId);

        emit PredictionStored(_predictionId, _patientAddress, _modelName, _confidence, block.timestamp);
    }

    /**
     * @dev Verify a prediction on blockchain
     * @param _predictionId Prediction to verify
     */
    function verifyPrediction(string memory _predictionId) public {
        require(bytes(predictions[_predictionId].predictionId).length > 0, "Prediction does not exist");

        predictions[_predictionId].verified = true;

        emit PredictionVerified(_predictionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update patient consent
     * @param _consentGiven Boolean indicating consent status
     * @param _consentScope Array of consent scopes
     */
    function updateConsent(
        bool _consentGiven,
        string[] memory _consentScope
    ) public {
        Consent storage consent = consents[msg.sender];

        consent.patientAddress = msg.sender;
        consent.consentGiven = _consentGiven;
        consent.consentScope = _consentScope;

        if (_consentGiven) {
            consent.givenAt = block.timestamp;
            consent.revokedAt = 0;
        } else {
            consent.revokedAt = block.timestamp;
        }

        emit ConsentUpdated(msg.sender, _consentGiven, block.timestamp);
    }

    /**
     * @dev Record IoMT anomaly detection
     * @param _anomalyId Unique anomaly identifier
     * @param _patientAddress Patient's blockchain address
     * @param _deviceId IoMT device identifier
     * @param _anomalyType Type of anomaly detected
     * @param _severity Severity level (0-3)
     * @param _sensorDataHash Hash of sensor data
     * @param _aiConfidence AI confidence score
     */
    function recordAnomaly(
        string memory _anomalyId,
        address _patientAddress,
        string memory _deviceId,
        string memory _anomalyType,
        uint8 _severity,
        bytes32 _sensorDataHash,
        uint256 _aiConfidence
    ) public hasConsent(_patientAddress) {
        require(bytes(anomalies[_anomalyId].anomalyId).length == 0, "Anomaly already exists");
        require(_severity <= 3, "Invalid severity level");

        Anomaly memory newAnomaly = Anomaly({
            anomalyId: _anomalyId,
            patientAddress: _patientAddress,
            deviceId: _deviceId,
            anomalyType: _anomalyType,
            severity: _severity,
            sensorDataHash: _sensorDataHash,
            aiConfidence: _aiConfidence,
            detectedAt: block.timestamp,
            resolved: false
        });

        anomalies[_anomalyId] = newAnomaly;
        patientAnomalies[_patientAddress].push(_anomalyId);

        emit AnomalyDetected(_anomalyId, _patientAddress, _anomalyType, _severity, block.timestamp);
    }

    /**
     * @dev Mark anomaly as resolved
     * @param _anomalyId Anomaly to resolve
     */
    function resolveAnomaly(string memory _anomalyId) public {
        require(bytes(anomalies[_anomalyId].anomalyId).length > 0, "Anomaly does not exist");

        anomalies[_anomalyId].resolved = true;

        emit AnomalyResolved(_anomalyId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get prediction details
     * @param _predictionId Prediction identifier
     * @return Prediction struct
     */
    function getPrediction(string memory _predictionId) public view returns (Prediction memory) {
        return predictions[_predictionId];
    }

    /**
     * @dev Get patient's predictions
     * @param _patientAddress Patient's address
     * @return Array of prediction IDs
     */
    function getPatientPredictions(address _patientAddress) public view returns (string[] memory) {
        return patientPredictions[_patientAddress];
    }

    /**
     * @dev Get consent details
     * @param _patientAddress Patient's address
     * @return Consent struct
     */
    function getConsent(address _patientAddress) public view returns (Consent memory) {
        return consents[_patientAddress];
    }

    /**
     * @dev Get anomaly details
     * @param _anomalyId Anomaly identifier
     * @return Anomaly struct
     */
    function getAnomaly(string memory _anomalyId) public view returns (Anomaly memory) {
        return anomalies[_anomalyId];
    }

    /**
     * @dev Get patient's anomalies
     * @param _patientAddress Patient's address
     * @return Array of anomaly IDs
     */
    function getPatientAnomalies(address _patientAddress) public view returns (string[] memory) {
        return patientAnomalies[_patientAddress];
    }
}

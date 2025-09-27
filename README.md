# MediMind - AI-Powered Health Monitoring Platform

A comprehensive health monitoring platform that leverages AI to provide personalized health insights and predictions.

## Project Structure

```
medimind/
├── backend/                  # Node.js/TypeScript API server
│   ├── src/                  # Source code
│   ├── tests/                # Backend test suites
│   │   ├── api/              # API endpoint tests
│   │   ├── models/           # Database model tests
│   │   ├── services/         # Service layer tests
│   │   ├── performance/      # Load and performance tests
│   │   └── security/         # Security tests
│   └── Dockerfile            # Production Dockerfile
│
├── blockchain/               # Blockchain integration
│   ├── contracts/            # Solidity smart contracts
│   │   └── HealthDataManager.sol  # Main health data management contract
│   ├── services/             # Blockchain services
│   │   ├── BlockchainHealthService.js  # Service for blockchain interactions
│   │   └── DecentralizedIdentity.js    # Decentralized identity management
│   └── tests/                # Blockchain service tests
│       └── DecentralizedIdentity.test.js  # Identity service tests
│
├── frontend/                 # React Native mobile application
│   └── src/                  # Frontend source code
│
├── ml-pipeline/              # Machine learning pipeline
│   ├── src/                  # ML source code
│   │   └── advanced_ai/      # Advanced AI components
│   │       └── federated_learning.py  # Federated learning implementation
│   ├── tests/                # ML pipeline tests
│   │   ├── test_model_training.py
│   │   └── test_prediction_pipeline.py
│   └── Dockerfile            # ML service Dockerfile
│
├── infrastructure/           # Infrastructure as Code
│   ├── terraform/            # Terraform configurations
│   └── kubernetes/           # Kubernetes manifests
│
├── .github/workflows/        # GitHub Actions workflows
├── docs/                     # Project documentation
└── docker-compose.yml        # Local development setup
```

## 🔗 Blockchain Integration

MediMind leverages blockchain technology to provide secure, transparent, and decentralized health data management. The blockchain integration consists of:

### Smart Contracts
- **HealthDataManager.sol**: Manages health records, consent, and access control on the blockchain
  - Implements ERC-721 NFTs for health records
  - Role-based access control for patients, providers, and researchers
  - Consent management and revocation
  - Research study participation tracking
  - AI prediction logging and verification
  - Reputation system for participants

### Decentralized Identity Service
- **DecentralizedIdentity.js**: Implements W3C Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs)
  - Creates and manages decentralized identities for all participants
  - Issues and verifies verifiable credentials (e.g., medical licenses, patient identities)
  - Manages authentication and authorization using cryptographic proofs
  - Implements a reputation system for participants

### Key Features
1. **Self-Sovereign Identity**: Users own and control their digital identities
2. **Data Privacy**: Health data is encrypted and stored off-chain with integrity hashes on-chain
3. **Consent Management**: Fine-grained control over data sharing and usage
4. **Audit Trail**: Immutable record of all data access and modifications
5. **Interoperability**: Standards-based approach using W3C DIDs and VCs

### Getting Started with Blockchain

1. **Install Dependencies**:
   ```bash
   cd blockchain
   npm install ethers ipfs-http-client
   ```

2. **Deploy Smart Contracts**:
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network <network>
   ```

3. **Run Tests**:
   ```bash
   npx hardhat test
   ```

4. **Environment Variables**:
   ```env
   ETHEREUM_RPC_URL=your_ethereum_node_url
   CONTRACT_ADDRESS=deployed_contract_address
   IPFS_API_URL=/ip4/127.0.0.1/tcp/5001
   PRIVATE_KEY=your_private_key
   ```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Backend & Frontend)
- npm 9+ or Yarn
- Python 3.9+ (ML pipeline)
- Docker 20.10+ and Docker Compose
- PostgreSQL 14+
- Redis 7.0+
- Terraform 1.0+ (for infrastructure deployment)
- kubectl (for Kubernetes deployments)
- AWS CLI (for cloud deployments)

## 🛠 Development Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/medimind.git
   cd medimind
   ```

### Backend Setup

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:19006`

### ML Pipeline Setup

1. Navigate to the ML pipeline directory and create a virtual environment:
   ```bash
   cd ml-pipeline
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Development dependencies
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🧪 Testing

### Backend Tests

Run all backend tests:
```bash
cd backend
npm test
```

Run specific test suites:
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Security tests
npm run test:security
```

### ML Pipeline Tests

Run all ML pipeline tests:
```bash
cd ml-pipeline
pytest tests/
```

Run with coverage report:
```bash
pytest --cov=src tests/
```

## 🐳 Docker Setup

### Development

Start all services:
```bash
docker-compose up -d
```

### Production

Build and run production containers:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## ☁️ Deployment

### Infrastructure (AWS)

1. Set up AWS credentials:
   ```bash
   aws configure
   ```

2. Initialize Terraform:
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

3. Plan and apply:
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

### Kubernetes

Deploy to Kubernetes:
```bash
kubectl apply -f infrastructure/kubernetes/
```

## 🔄 CI/CD

The project includes GitHub Actions workflows for:
- PR validation (linting, testing)
- Docker image building and pushing
- Staging deployment
- Production deployment

Workflow files are located in `.github/workflows/`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## 📋 Development Workflow

### Backend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck

# Database migrations
npm run migrate:latest
npm run migrate:rollback
```

### Frontend Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### ML Pipeline Commands

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=src

# Lint code
flake8 src/

# Format code
black src/
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For any questions or feedback, please reach out to the development team.

## 🔗 Useful Links

- [API Documentation](/docs/API.md)
- [Deployment Guide](/docs/DEPLOYMENT.md)
- [Testing Guide](/docs/TESTING.md)
- [Architecture Decision Records](/docs/adr/)

## 🔍 Monitoring

- **Backend**: Available at `/health` endpoint
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Centralized logging with ELK stack
- **Tracing**: Distributed tracing with Jaeger

## 🔒 Security

- All data is encrypted at rest and in transit
- Regular security audits and dependency updates
- Vulnerability scanning in CI/CD pipeline
- Follows OWASP security best practices
# MediMindPlus

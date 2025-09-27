# 🏥 MediMind Quick Start Guide

## 🎉 Current Status: READY TO GO!

Your MediMind healthcare AI platform is set up and ready! Here's what's currently running:

### ✅ **Currently Running Services:**
- **ML Service**: ✅ Running on port 8001
- **Backend Service**: ✅ Running on port 3000

### 🚀 **Quick Actions**

#### 1. 🧪 Test Your APIs
```bash
./test_apis.sh
```

#### 2. 🗄️ Start Database Services
```bash
./start_databases.sh
```

#### 3. 🎨 Set Up Frontend
```bash
./setup_frontend.sh
```

#### 4. 📊 Complete System Setup
```bash
./master_setup.sh
```

## 🌐 **Access Your Services**

| Service | URL | Description |
|---------|-----|-------------|
| ML Service Health | http://localhost:8001/health | AI service status |
| ML Service Docs | http://localhost:8001/docs | Interactive API documentation |
| Backend Health | http://localhost:3000/health | Backend service status |
| Backend API | http://localhost:3000/api | API information |

## 📱 **Frontend Setup**

Your frontend is a React Native/Expo app. To set it up:

```bash
cd frontend
npm install
npm start
```

This will open the Expo development server. You can then:
- Scan the QR code with Expo Go app on your phone
- Press 'w' to open in web browser
- Press 'a' for Android emulator
- Press 'i' for iOS simulator

## 🗄️ **Database Services**

To start PostgreSQL and Redis:

```bash
./start_databases.sh
```

**Connection Details:**
- **PostgreSQL**: localhost:5432
  - Database: medimind
  - User: medimind_user
  - Password: medimind_password
- **Redis**: localhost:6379

## 🔧 **Advanced Features**

Your MediMind platform includes:

### 🤖 **AI Capabilities**
- Health risk prediction for 10+ conditions
- Real-time biomarker analysis
- Voice and sensor data processing
- Machine learning model training

### 📊 **Health Conditions Supported**
- Cardiovascular disease
- Type 2 diabetes
- Hypertension
- Obesity
- Depression
- Anxiety
- Sleep disorders
- Respiratory disease
- Metabolic syndrome
- Chronic kidney disease

### 📱 **Mobile Features**
- Health data collection
- Real-time monitoring
- Push notifications
- Secure data storage
- Integration with health sensors

## 🛠️ **Development Commands**

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm test            # Run tests
npm run build       # Build for production
```

### ML Service Development
```bash
cd ml-pipeline
python main.py      # Start ML service
pytest             # Run tests
```

### Frontend Development
```bash
cd frontend
npm start           # Start Expo dev server
npm test           # Run tests
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
```

## 🔍 **Troubleshooting**

### Services Not Starting?
1. Check if ports are available: `lsof -i :3000,8001,5432,6379`
2. Restart services: Kill processes and restart
3. Check logs for errors

### Database Connection Issues?
1. Ensure Docker is running
2. Run: `./start_databases.sh`
3. Wait for services to fully initialize

### Frontend Issues?
1. Ensure Node.js is installed
2. Install Expo CLI: `npm install -g @expo/cli`
3. Clear cache: `expo start -c`

## 📚 **API Documentation**

### ML Service Endpoints
- `GET /health` - Service health check
- `POST /predict` - Health risk prediction
- `POST /analyze` - Biomarker analysis
- `GET /docs` - Interactive API documentation

### Backend Endpoints
- `GET /health` - Service health check
- `GET /api` - API information
- `POST /auth/login` - User authentication
- `GET /user/profile` - User profile

## 🎯 **Next Steps**

1. **Test the APIs** with the provided test script
2. **Start the databases** for full functionality
3. **Set up the frontend** for mobile access
4. **Explore the API documentation** at http://localhost:8001/docs
5. **Customize the health models** for your specific use case

## 🆘 **Need Help?**

- Check the logs in each service directory
- Use the test scripts to verify functionality
- Refer to the detailed setup guides in each component
- All services include health check endpoints

---

**🎉 Congratulations! Your MediMind healthcare AI platform is ready for development and testing!**

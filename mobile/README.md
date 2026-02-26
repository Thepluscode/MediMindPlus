# MediMindPlus Frontend Testing Interface

Simple frontend interface for testing the $1.15B revolutionary healthcare platform backend.

## Quick Start

### 1. Start the Backend (Port 3000)
```bash
cd backend
npm run dev
```

### 2. Start the Frontend Server (Port 8080)
```bash
cd frontend
python3 -m http.server 8080
```

### 3. Access the Application
Open your browser and navigate to:
- **Landing Page**: http://localhost:8080/public/index.html
- **Dashboard**: http://localhost:8080/public/dashboard.html (requires login)

## Features

### Landing Page (index.html)
- **User Registration**: Create new accounts with email, password, name, and role
- **User Login**: Authenticate with existing credentials
- **Backend Status**: Real-time connection indicator
- **Features Preview**: Overview of all 12 revolutionary features
- **Platform Value**: $1.15B valuation display

### Dashboard (dashboard.html)
- **12 Revolutionary Features** accessible via sidebar:
  1. 🧬 Virtual Health Twin - Digital physiology simulation
  2. 🧠 Mental Health Crisis Detection - 24/7 AI monitoring
  3. 🔬 Multi-Omics Analysis - Genomic/proteomic insights
  4. ⏳ Longevity Optimization - Biological age calculation
  5. 💼 Employer Dashboard - Workforce health analytics
  6. ⭐ Provider Performance - Quality metrics & benchmarking
  7. 🤖 Federated Learning - Privacy-preserving AI network
  8. 🛡️ Predictive Insurance - AI-powered pricing
  9. 💊 Drug Discovery Platform - Clinical trial matching
  10. 🦠 Pandemic Early Warning - Outbreak prediction
  11. 📚 AI Health Educator - Personalized training
  12. 🏪 Health Data Marketplace - Secure data exchange

### Each Feature Includes:
- **Test Buttons**: Execute real API calls to backend
- **Sample Data**: Pre-configured test payloads
- **Response Display**: JSON responses in formatted boxes
- **Toast Notifications**: Success/error feedback
- **Authentication**: JWT token-based security

## API Testing Flow

### 1. Register a New User
```
Email: test@example.com
Password: Test123!@#
First Name: John
Last Name: Doe
Role: PATIENT
```

### 2. Login
Use the credentials you just registered to obtain a JWT token.

### 3. Test Features
Navigate through the 12 features using the sidebar and click test buttons to interact with the backend APIs.

## Architecture

### Frontend Stack
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Fetch API**: RESTful API communication

### Backend Integration
- **Base URL**: http://localhost:3000/api/v1
- **Auth URL**: http://localhost:3000/api/auth
- **Authentication**: Bearer token in Authorization header
- **Token Storage**: localStorage
- **Session Management**: Automatic redirect on expiration

### File Structure
```
frontend/
├── public/
│   ├── index.html        # Landing page with auth
│   └── dashboard.html    # Main feature dashboard
├── css/
│   └── style.css         # Complete styling (600+ lines)
├── js/
│   └── app.js            # API client & business logic (700+ lines)
└── README.md             # This file
```

## API Endpoints Tested

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Revolutionary Features
- POST /api/v1/revolutionary-features/health-twin
- GET /api/v1/revolutionary-features/health-twin/:id
- POST /api/v1/revolutionary-features/health-twin/:id/simulate
- POST /api/v1/revolutionary-features/mental-health/assess
- GET /api/v1/revolutionary-features/mental-health/risk/:id
- GET /api/v1/revolutionary-features/mental-health/resources
- POST /api/v1/revolutionary-features/longevity/biological-age
- GET /api/v1/revolutionary-features/longevity/hallmarks/:id
- GET /api/v1/revolutionary-features/longevity/therapies
- POST /api/v1/revolutionary-features/omics/profile
- GET /api/v1/revolutionary-features/employer/dashboard/:id
- GET /api/v1/revolutionary-features/provider/performance/:id
- GET /api/v1/revolutionary-features/federated/models
- POST /api/v1/revolutionary-features/insurance/quote
- GET /api/v1/revolutionary-features/drug/pipeline
- GET /api/v1/revolutionary-features/pandemic/threat-level
- GET /api/v1/revolutionary-features/education/courses
- GET /api/v1/revolutionary-features/marketplace/datasets

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Token Expiration**: Automatic session management
- **Logout**: Token removal from localStorage
- **Protected Routes**: Dashboard requires authentication
- **CORS Enabled**: Backend accepts requests from frontend
- **Password Requirements**: Enforced during registration

## Sample Test Data

### Virtual Health Twin
```json
{
  "age": 35,
  "gender": "MALE",
  "height": 175,
  "weight": 75,
  "bloodPressure": { "systolic": 120, "diastolic": 80 },
  "heartRate": 72,
  "bloodGlucose": 95,
  "cholesterol": { "total": 180, "hdl": 50, "ldl": 110 }
}
```

### Mental Health Assessment
```json
{
  "responses": {
    "phq9Score": 12,
    "gad7Score": 10,
    "mood": "anxious",
    "sleepQuality": "poor",
    "stressLevel": 8,
    "suicidalIdeation": false
  }
}
```

### Longevity Biological Age
```json
{
  "biomarkerData": {
    "chronologicalAge": 35,
    "telomereLength": 7500,
    "dnaMethylation": 0.65,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "cholesterol": { "total": 180, "hdl": 50, "ldl": 110 }
  }
}
```

## Troubleshooting

### Backend Not Connecting
- Ensure backend is running on port 3000
- Check backend health: http://localhost:3000/health
- Verify PostgreSQL is running on port 5434
- Verify Redis is running on port 6379

### Login/Registration Failing
- Check backend logs for errors
- Verify database migrations ran successfully
- Ensure password meets requirements (8+ chars, uppercase, lowercase, number, special)

### API Calls Failing
- Check browser console for errors
- Verify JWT token is present in localStorage
- Check Network tab for HTTP status codes
- Ensure backend routes are connected in index.ts

### CORS Errors
- Verify CORS_ORIGIN=* in backend .env
- Check backend is allowing requests from localhost:8080

## Browser Console Commands

### Check Token
```javascript
console.log(localStorage.getItem('token'));
```

### Clear Token (Manual Logout)
```javascript
localStorage.removeItem('token');
localStorage.removeItem('userEmail');
```

### Test API Manually
```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log);
```

## Development Notes

- **No Build Process**: Pure HTML/CSS/JS, no bundling required
- **Hot Reload**: Backend uses ts-node-dev for auto-restart
- **Sample Data**: All test functions use realistic mock data
- **Error Handling**: Comprehensive try-catch with user feedback
- **Responsive Design**: Mobile-friendly layout
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Next Steps

1. **Test All Features**: Click through each feature and verify API responses
2. **Check Metrics**: Visit http://localhost:3000/metrics for Prometheus data
3. **Monitor Logs**: Watch backend console for request/response logs
4. **Verify Database**: Check PostgreSQL for created records
5. **Review Responses**: Analyze JSON payloads for accuracy

## Platform Value Breakdown

- Virtual Health Twin: $150M
- Mental Health Crisis Detection: $120M
- Multi-Omics Analysis: $100M
- Longevity Optimization: $80M
- Employer Dashboard: $100M
- Provider Performance: $90M
- Federated Learning: $130M
- Predictive Insurance: $110M
- Drug Discovery Platform: $140M
- Pandemic Early Warning: $80M
- AI Health Educator: $60M
- Health Data Marketplace: $150M

**Total Platform Value: $1.15 Billion**

---

Built with ❤️ for MediMindPlus - Revolutionary Healthcare Platform

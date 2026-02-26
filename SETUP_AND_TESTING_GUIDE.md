# MediMindPlus - Setup & Testing Guide
Complete guide to set up video consultations and payment integration

## 📋 Current Status

✅ **Completed:**
- Twilio SDK installed (`twilio` package)
- Stripe SDK installed (`stripe` package)
- Environment variables configured in `.env`
- Consultation database tables created (6 tables)
- Video consultation backend services implemented
- Payment infrastructure ready

⏳ **Next Steps:**
1. Get Twilio credentials
2. Get Stripe credentials
3. Implement Stripe payment service
4. Test end-to-end flow

---

## 🔧 Part 1: Twilio Video Setup (10 minutes)

### Step 1: Create Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials
1. Log in to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** on the dashboard home page
3. Click **"Get API Keys"** or go to **API Keys** section
4. Click **"Create new API Key"**
   - Friendly Name: `MediMindPlus Video`
   - Key Type: `Standard`
5. **IMPORTANT:** Copy the **SID** (API Key) and **Secret** immediately - you won't see the secret again!

### Step 3: Enable Twilio Video
1. In Twilio Console, navigate to **Programmable Video**
2. If not enabled, click **"Get Started"** or **"Enable Video"**
3. No additional configuration needed for development

### Step 4: Update Environment Variables
Open `backend/.env` and replace the placeholder values:

```env
# Replace these with your actual Twilio credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_API_KEY=your_twilio_api_key_here
TWILIO_API_SECRET=your_actual_secret_here
API_BASE_URL=http://localhost:3000
```

---

## 💳 Part 2: Stripe Payment Setup (10 minutes)

### Step 1: Create Stripe Account
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Complete business information (you can use test mode for development)

### Step 2: Get Stripe API Keys
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **"Developers"** in the left sidebar
3. Click **"API keys"**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click **"Reveal test key"**

### Step 3: Get Stripe Webhook Secret (for later)
1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter: `http://localhost:3000/api/payments/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

### Step 4: Get Stripe Connect Client ID (for provider payouts)
1. Go to **Settings → Connect**
2. Enable Stripe Connect
3. Copy your **Client ID** (starts with `ca_...`)

### Step 5: Update Environment Variables
Open `backend/.env` and replace:

```env
# Replace with your actual Stripe credentials
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=your_stripe_connect_client_id_here
```

---

## 🏗️ Part 3: Database Verification

The consultation tables are already created! Verify with:

```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d medimind -c "\dt"
```

You should see these tables:
- ✅ `providers`
- ✅ `consultations`
- ✅ `prescriptions`
- ✅ `provider_availability`
- ✅ `consultation_reviews`
- ✅ `consultation_messages`

---

## 🚀 Part 4: Start the Application

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
Server is running on port 3000 in development mode
Database connections initialized
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm start
```

Access at: `http://localhost:19006`

---

## 🧪 Part 5: Testing Video Consultations (Manual Test Plan)

### Prerequisites
1. Create 2 test accounts:
   - **Patient Account**: `patient@test.com` / `password123`
   - **Provider Account**: `provider@test.com` / `password123`

### Test Step 1: Create a Provider
```bash
# API Request to create provider profile
curl -X POST http://localhost:3000/api/provider/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROVIDER_TOKEN" \
  -d '{
    "licenseNumber": "MD12345",
    "licenseState": "CA",
    "licenseExpiry": "2026-12-31",
    "specialty": "PRIMARY_CARE",
    "yearsExperience": 10,
    "consultationFee": 5000,
    "bio": "Experienced primary care physician"
  }'
```

### Test Step 2: Search for Providers (as Patient)
```bash
curl -X GET "http://localhost:3000/api/consultations/providers/search?specialty=PRIMARY_CARE" \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "...",
        "first_name": "...",
        "last_name": "...",
        "specialty": "PRIMARY_CARE",
        "rating": 0,
        "consultation_fee": 5000
      }
    ]
  }
}
```

### Test Step 3: Book a Consultation
```bash
curl -X POST http://localhost:3000/api/consultations/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
  -d '{
    "providerId": "PROVIDER_UUID_HERE",
    "scheduledStart": "2025-11-12T10:00:00Z",
    "scheduledEnd": "2025-11-12T10:30:00Z",
    "consultationType": "ROUTINE_CHECKUP",
    "reasonForVisit": "Annual checkup"
  }'
```

### Test Step 4: Join Video Call
1. **As Provider:**
   - Navigate to Provider Dashboard
   - Click **"Join Call"** for the scheduled consultation

2. **As Patient:**
   - Navigate to My Consultations
   - Click **"Join Video Call"**

3. **Expected Behavior:**
   - Both users see local + remote video
   - Patient can click **"Share Vitals"**
   - Provider sees vitals overlay (heart rate, BP, O2 sat, glucose)
   - Call controls work (mute, camera toggle, end call)

---

## 🧪 Part 6: Testing Stripe Payments

### Test Payment Flow (uses Stripe test mode)

1. **Book consultation** (creates `payment_status: PENDING`)
2. **Create payment intent:**
```bash
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
  -d '{
    "consultationId": "CONSULTATION_UUID",
    "amount": 5000,
    "currency": "usd"
  }'
```

3. **Use Stripe Test Cards:**
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

4. **Confirm payment:**
```bash
curl -X POST http://localhost:3000/api/payments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
  -d '{
    "consultationId": "CONSULTATION_UUID",
    "paymentIntentId": "pi_xxxxx"
  }'
```

---

## 📊 Part 7: Database Queries for Debugging

### Check Consultations
```sql
SELECT
  c.id, c.status, c.scheduled_start,
  u.email as patient_email,
  p.specialty
FROM consultations c
JOIN users u ON c.patient_id = u.id
JOIN providers p ON c.provider_id = p.id
ORDER BY c.scheduled_start DESC;
```

### Check Providers
```sql
SELECT
  p.id, u.email, p.specialty, p.rating,
  p.verification_status, p.accepting_patients
FROM providers p
JOIN users u ON p.user_id = u.id;
```

### Check Payments
```sql
SELECT
  id, amount_charged, payment_status, payment_intent_id, updated_at
FROM consultations
WHERE payment_status IS NOT NULL
ORDER BY updated_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: "Twilio credentials not configured"
**Solution:** Ensure `.env` has valid `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`

### Issue: "Failed to connect to Twilio room"
**Solutions:**
1. Check browser console for errors
2. Verify Twilio Video is enabled in console
3. Ensure Twilio JS SDK is loaded (check Network tab)
4. Test with: `console.log(window.Twilio.Video)` in browser console

### Issue: "Provider not found" when searching
**Solution:**
1. Check provider exists: `SELECT * FROM providers;`
2. Verify `verification_status = 'VERIFIED'`
3. Verify `status = 'ACTIVE'`

### Issue: Stripe payment fails
**Solutions:**
1. Use test card: `4242 4242 4242 4242`
2. Check Stripe Dashboard → Payments for error messages
3. Verify `STRIPE_SECRET_KEY` starts with `sk_test_`

---

## 📱 Part 8: Mobile Testing (React Native)

### For iOS/Android:
1. Install `@twilio/video-react-native`:
```bash
cd frontend
npm install @twilio/video-react-native react-native-webrtc
```

2. iOS specific:
```bash
cd ios && pod install && cd ..
```

3. Update permissions in `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access for video consultations</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access for video consultations</string>
```

---

## ✅ Success Criteria

Your setup is complete when you can:

- [ ] Start backend without errors
- [ ] See consultation tables in database
- [ ] Create a provider profile
- [ ] Search for providers
- [ ] Book a consultation
- [ ] Join video call from both patient and provider sides
- [ ] See local and remote video streams
- [ ] Share patient vitals during call
- [ ] See vitals overlay on provider side
- [ ] End call successfully
- [ ] Create Stripe payment intent
- [ ] Process test payment
- [ ] See payment status update in database

---

## 🎯 Next Features to Test

Once basic flow works, test these advanced features:

1. **Prescription Workflow** - Provider issues prescription during consultation
2. **Follow-up Scheduling** - Book follow-up consultation after completing one
3. **Reviews & Ratings** - Patient submits review after consultation
4. **Provider Availability** - Set weekly schedule and view available slots
5. **Consultation Messages** - Pre/post consultation chat
6. **No-Show Handling** - Mark patient as no-show
7. **Cancellations & Refunds** - Cancel consultation and process refund

---

## 📞 Support & Resources

- **Twilio Video Docs**: https://www.twilio.com/docs/video
- **Stripe Payments Docs**: https://stripe.com/docs/payments
- **Twilio Video Quickstart**: https://www.twilio.com/docs/video/javascript-getting-started
- **Stripe Test Cards**: https://stripe.com/docs/testing

---

## 🚨 Important Notes

1. **Do NOT use test credentials in production**
2. **Twilio free tier**: 10 GB bandwidth/month (~150 hours of video)
3. **Stripe test mode**: No real charges, use test cards only
4. **HIPAA Compliance**: Enable Twilio HIPAA BAA before production launch
5. **Webhooks**: Use ngrok for local webhook testing: `ngrok http 3000`

---

**Ready to test? Start with Part 1 (Twilio Setup) and work your way down!** 🚀

#!/bin/bash

echo "=== Testing MediMindPlus Backend API ==="
echo ""

# 1. Health check
echo "1. Health Check:"
curl -s http://localhost:3000/health | json_pp
echo -e "\n"

# 2. Register user
echo "2. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@medimind.ai","password":"Demo123","first_name":"Demo","last_name":"User"}')
echo $REGISTER_RESPONSE | json_pp
echo -e "\n"

# 3. Login
echo "3. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@medimind.ai","password":"Demo123"}')
echo $LOGIN_RESPONSE | json_pp

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
echo -e "\nToken extracted: ${TOKEN:0:50}...\n"

# 4. Test advanced features health
echo "4. Testing Advanced Features API:"
curl -s http://localhost:3000/api/advanced/health \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo "=== API Tests Complete ==="

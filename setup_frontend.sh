#!/bin/bash

# MediMind Frontend Setup Script
echo "🎨 Setting up MediMind Frontend (React Native/Expo)"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📱 Node.js version: $(node --version)"

# Check if Expo CLI is available (using npx)
echo "📦 Checking Expo CLI availability..."
if npx @expo/cli --version &> /dev/null; then
    echo "✅ Expo CLI is available via npx"
else
    echo "⚠️  Expo CLI not found, but we'll use npx to run it"
fi

# Navigate to frontend directory
cd frontend

# Install dependencies with legacy peer deps to handle conflicts
echo "📥 Installing frontend dependencies (with legacy peer deps)..."
npm install --legacy-peer-deps

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "🎉 Frontend setup complete!"
echo ""
echo "Available commands:"
echo "  npx expo start        - Start Expo development server"
echo "  npx expo start --android  - Run on Android device/emulator"
echo "  npx expo start --ios      - Run on iOS device/simulator"
echo "  npx expo start --web      - Run in web browser"
echo "  npm test              - Run tests"
echo ""
echo "To start the frontend:"
echo "  cd frontend"
echo "  npx expo start"
echo ""
echo "📱 Make sure you have the Expo Go app installed on your mobile device"
echo "   or have an Android/iOS emulator running."

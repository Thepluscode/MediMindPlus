#!/bin/bash

# Fix React Native Frontend Script
echo "🔧 Fixing MediMind React Native Frontend"
echo "========================================"

cd frontend

# Step 1: Clean up existing installation
echo "🧹 Cleaning up existing installation..."
rm -rf node_modules
rm -f package-lock.json

# Step 2: Restore original package.json with fixes
echo "📦 Restoring original package.json with fixes..."
cp package-original.json package.json

# Step 3: Install with specific npm version and flags
echo "📥 Installing dependencies with compatibility flags..."
npm install --legacy-peer-deps --force

# Step 4: Install missing Metro dependencies with compatible versions
echo "🚇 Installing compatible Metro dependencies..."
npm install --legacy-peer-deps \
  metro@0.76.8 \
  metro-core@0.76.8 \
  @expo/metro-config@0.10.7

# Step 5: Fix any remaining peer dependency issues
echo "🔧 Fixing peer dependencies..."
npm install --legacy-peer-deps \
  react-native-reanimated@3.3.0 \
  react-native-gesture-handler@2.12.1 \
  react-native-screens@3.22.1

# Step 6: Check if Expo CLI is available
echo "📱 Checking Expo CLI..."
if ! npx expo --version &> /dev/null; then
    echo "Installing Expo CLI locally..."
    npm install --save-dev @expo/cli
fi

# Step 7: Verify installation
echo "✅ Verifying installation..."
if [ -d "node_modules" ] && [ -f "package.json" ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🚀 Ready to start! Run these commands:"
    echo "   cd frontend"
    echo "   npx expo start"
    echo ""
    echo "📱 Options when Expo starts:"
    echo "   - Press 'w' to open in web browser"
    echo "   - Press 'a' for Android emulator"
    echo "   - Press 'i' for iOS simulator"
    echo "   - Scan QR code with Expo Go app"
else
    echo "❌ Installation failed. Check the errors above."
    exit 1
fi

echo ""
echo "🎉 React Native frontend is ready!"

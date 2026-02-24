#!/bin/bash

echo "🏥 Setting up MediMindPlus Environment..."

# Generate random secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
ENC_KEY=$(openssl rand -hex 32)

echo "🔐 Generating secure keys..."

# Function to update .env from example and inject secrets
setup_env() {
    local target_dir=$1
    local target_env="$target_dir/.env"
    
    echo "➡️ Configuring $target_dir..."
    
    if [ ! -f ".env.example" ]; then
        echo "❌ Root .env.example not found!"
        return
    fi

    cp .env.example "$target_env"
    
    # Replace placeholders with generated secrets on Mac (sed -i '')
    sed -i '' "s/replace_with_secure_random_string_min_32_chars/$JWT_SECRET/" "$target_env"
    sed -i '' "s/replace_with_another_secure_random_string/$JWT_REFRESH/" "$target_env"
    sed -i '' "s/replace_with_32_byte_hex_string/$ENC_KEY/" "$target_env"
    
    echo "✅ $target_env created."
}

# Setup Root (if needed) and Subdirectories
setup_env "."
setup_env "mobile"
setup_env "web"
setup_env "backend"

echo ""
echo "🎉 Environment setup complete!"
echo "⚠️  ACTION REQUIRED: Please open .env files and add your real Stripe/Twilio keys."

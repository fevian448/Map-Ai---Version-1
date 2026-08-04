#!/bin/bash
# Setup GitHub Secrets for MapAi Deployment
# Run this locally to help set up GitHub Actions secrets

set -e

PROJECT_ROOT="/home/tukuk/AndroidStudioProjects/MapAi"
REPO="fevian448/Map-Ai"

echo "=========================================="
echo "  MapAi — GitHub Secrets Setup"
echo "=========================================="
echo ""
echo "📝 Account: fevianbenjo48@gmail.com"
echo "📍 Repository: github.com/$REPO"
echo ""
echo "This script will help you create the necessary GitHub Secrets."
echo "You need to run these commands manually in GitHub or use GitHub CLI."
echo ""
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "ℹ️  GitHub CLI not installed. Manual steps:"
    echo ""
    echo "1. Go to: https://github.com/$REPO/settings/secrets/actions"
    echo "2. Click 'New repository secret' for each:"
    echo ""
    echo "REQUIRED SECRETS:"
    echo "- KEYSTORE_BASE64"
    echo "- KEYSTORE_PASSWORD"
    echo "- KEY_PASSWORD"
    echo "- KEY_ALIAS"
    echo ""
    echo "OPTIONAL SECRETS:"
    echo "- GOOGLE_PLAY_JSON (for Play Store deployment)"
    echo "- GOOGLE_MAPS_API_KEY (for Maps functionality)"
    echo ""
    echo "💡 See DEVELOPER_ACCOUNT.md for details on generating these."
    exit 0
fi

echo "✅ GitHub CLI detected. Using 'gh' for setup..."
echo ""

# Verify we're in the right repo
echo "Verifying repository..."
CURRENT_REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo "")
if [ "$CURRENT_REPO" != "$REPO" ]; then
    echo "⚠️  Current repo: $CURRENT_REPO"
    echo "📍 Target repo: $REPO"
    echo ""
    echo "Set repo with: gh repo set-default $REPO"
    exit 1
fi

echo "✅ Repository verified: $REPO"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local prompt=$2
    
    echo "Setting: $secret_name"
    echo "$prompt"
    echo ""
    read -sp "Enter value (hidden): " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "❌ Empty value, skipping..."
        return 1
    fi
    
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
    echo "✅ $secret_name set successfully"
    echo ""
}

echo "=========================================="
echo "  STEP 1: Android Keystore Secrets"
echo "=========================================="
echo ""

# Option to generate keystore or upload existing
echo "1. Generate new keystore? (y/n)"
read -r generate
if [ "$generate" = "y" ]; then
    echo "Running: ./config.sh generate-keystore"
    cd "$PROJECT_ROOT"
    ./config.sh generate-keystore 2>/dev/null || true
    echo ""
fi

# Check for keystore
if [ ! -f "$PROJECT_ROOT/mapai-release.keystore" ]; then
    echo "❌ Keystore not found at: $PROJECT_ROOT/mapai-release.keystore"
    echo "Run './config.sh generate-keystore' first"
    exit 1
fi

echo "✅ Keystore found"
echo ""

# Convert to Base64
echo "Converting keystore to Base64..."
KEYSTORE_B64=$(base64 -w 0 "$PROJECT_ROOT/mapai-release.keystore")

echo "$KEYSTORE_B64" | gh secret set KEYSTORE_BASE64 --repo "$REPO"
echo "✅ KEYSTORE_BASE64 uploaded"
echo ""

# Passwords
echo "Keystore password:"
read -sp "Enter keystore password: " keystore_pwd
echo ""
echo "$keystore_pwd" | gh secret set KEYSTORE_PASSWORD --repo "$REPO"
echo "✅ KEYSTORE_PASSWORD set"
echo ""

echo "Key password:"
read -sp "Enter key password: " key_pwd
echo ""
echo "$key_pwd" | gh secret set KEY_PASSWORD --repo "$REPO"
echo "✅ KEY_PASSWORD set"
echo ""

echo "Key alias (usually 'mapai'):"
read -r key_alias
echo "$key_alias" | gh secret set KEY_ALIAS --repo "$REPO"
echo "✅ KEY_ALIAS set"
echo ""

echo "=========================================="
echo "  STEP 2: Google Services (Optional)"
echo "=========================================="
echo ""

echo "Setup Google Maps API? (y/n)"
read -r setup_maps
if [ "$setup_maps" = "y" ]; then
    echo "Get API Key from: https://console.cloud.google.com"
    echo "See DEVELOPER_ACCOUNT.md for detailed instructions"
    echo ""
    read -p "Enter Google Maps API Key: " maps_key
    if [ -n "$maps_key" ]; then
        echo "$maps_key" | gh secret set GOOGLE_MAPS_API_KEY --repo "$REPO"
        echo "✅ GOOGLE_MAPS_API_KEY set"
    fi
fi
echo ""

echo "Setup Google Play Service Account? (y/n)"
read -r setup_play
if [ "$setup_play" = "y" ]; then
    echo "JSON file location:"
    read -p "Path to service-account-key.json: " json_path
    if [ -f "$json_path" ]; then
        JSON_B64=$(base64 -w 0 "$json_path")
        echo "$JSON_B64" | gh secret set GOOGLE_PLAY_JSON --repo "$REPO"
        echo "✅ GOOGLE_PLAY_JSON set"
    else
        echo "❌ File not found: $json_path"
    fi
fi
echo ""

echo "=========================================="
echo "  ✅ GitHub Secrets Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Secrets created:"
gh secret list --repo "$REPO" || echo "Could not list secrets"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push -u origin master"
echo "2. Watch Actions tab: https://github.com/$REPO/actions"
echo "3. First build will trigger automatically"
echo ""

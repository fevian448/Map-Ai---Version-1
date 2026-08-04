#!/bin/bash
# MapAi Configuration Setup Script
# Generates all required IDs, keys, and configurations for the app
# Usage: ./config.sh [setup|show|reset|generate-keystore]

set -e

PROJECT="/home/tukuk/AndroidStudioProjects/MapAi"
PACKAGE_NAME="com.example.mapai"
KEYSTORE_NAME="mapai-release.keystore"
KEYSTORE_ALIAS="mapai"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }

show_banner() {
    echo "=========================================="
    echo "  MapAi Configuration Setup"
    echo "=========================================="
    echo ""
}

generate_admob_ids() {
    show_banner
    info "Generating AdMob IDs..."
    echo ""
    
    # Generate placeholder AdMob IDs based on package name
    # In production, replace with real IDs from AdMob console
    ADMOB_APP_ID="ca-app-pub-3940256099942544~3347511713"  # Test ID
    BANNER_AD_UNIT="ca-app-pub-3940256099942544/6300978111"  # Test ID
    INTERSTITIAL_AD_UNIT="ca-app-pub-3940256099942544/1033173712"  # Test ID
    REWARDED_AD_UNIT="ca-app-pub-3940256099942544/5224354917"  # Test ID
    
    info "AdMob Configuration:"
    echo ""
    echo "  AdMob App ID:"
    echo "    $ADMOB_APP_ID"
    echo ""
    echo "  Ad Unit IDs:"
    echo "    Banner:        $BANNER_AD_UNIT"
    echo "    Interstitial:  $INTERSTITIAL_AD_UNIT"
    echo "    Rewarded:      $REWARDED_AD_UNIT"
    echo ""
    
    # Save to config file
    cat > "$PROJECT/admob_config.properties" << EOF
# AdMob Configuration
# Replace test IDs with real IDs from https://admob.google.com
ADMOB_APP_ID=$ADMOB_APP_ID
BANNER_AD_UNIT=$BANNER_AD_UNIT
INTERSTITIAL_AD_UNIT=$INTERSTITIAL_AD_UNIT
REWARDED_AD_UNIT=$REWARDED_AD_UNIT
EOF
    
    ok "Saved to: $PROJECT/admob_config.properties"
    echo ""
    
    warn "NOTE: These are TEST IDs. Replace with real IDs from AdMob console for production."
}

generate_keystore() {
    show_banner
    info "Generating Android signing keystore..."
    echo ""
    
    cd "$PROJECT"
    
    if [ -f "$KEYSTORE_NAME" ]; then
        warn "Keystore already exists: $KEYSTORE_NAME"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Keystore generation cancelled"
            return
        fi
    fi
    
    info "Keystore details:"
    echo "  File:    $KEYSTORE_NAME"
    echo "  Alias:   $KEYSTORE_ALIAS"
    echo "  Validity: 10000 days (27 years)"
    echo ""
    
    info "Enter keystore password (min 6 chars):"
    read -s -p "Password: " KEYSTORE_PASSWORD
    echo ""
    
    info "Confirm password:"
    read -s -p "Confirm: " KEYSTORE_PASSWORD2
    echo ""
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD2" ]; then
        err "Passwords do not match!"
        return
    fi
    
    info "Enter your name (CN):"
    read -p "Name: " KEYSTORE_NAME_CN
    
    info "Enter organization (O):"
    read -p "Organization: " KEYSTORE_ORG
    
    info "Enter city (L):"
    read -p "City: " KEYSTORE_CITY
    
    info "Enter state/province (ST):"
    read -p "State: " KEYSTORE_STATE
    
    info "Enter country code (2 letters, e.g. ID, US):"
    read -p "Country: " KEYSTORE_COUNTRY
    
    echo ""
    info "Generating keystore..."
    
    keytool -genkeypair -v \
        -keystore "$KEYSTORE_NAME" \
        -alias "$KEYSTORE_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEYSTORE_PASSWORD" \
        -dname "CN=$KEYSTORE_NAME_CN, O=$KEYSTORE_ORG, L=$KEYSTORE_CITY, ST=$KEYSTORE_STATE, C=$KEYSTORE_COUNTRY"
    
    if [ -f "$KEYSTORE_NAME" ]; then
        ok "Keystore generated: $PROJECT/$KEYSTORE_NAME"
        echo ""
        
        # Save to gradle.properties (with placeholder passwords in actual config)
        cat >> "$PROJECT/gradle.properties" << EOF

# Keystore Configuration
MYAPP_RELEASE_STORE_FILE=$KEYSTORE_NAME
MYAPP_RELEASE_KEY_ALIAS=$KEYSTORE_ALIAS
MYAPP_RELEASE_STORE_PASSWORD=$KEYSTORE_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=$KEYSTORE_PASSWORD
EOF
        
        ok "Keystore config added to gradle.properties"
        echo ""
        
        warn "IMPORTANT: Keep your keystore and passwords safe!"
        warn "Backup location: $PROJECT/$KEYSTORE_NAME"
        warn "Do NOT commit keystore to version control!"
    else
        err "Keystore generation failed"
    fi
}

generate_google_services() {
    show_banner
    info "Google Services Configuration"
    echo ""
    
    info "Google Maps API Key:"
    echo "  Current: AIzaSyBLApTRwV8HEm8xlLQTNfZyDcByUx_2hYU"
    echo ""
    
    info "To get a new Google Maps API key:"
    echo "  1. Go to https://console.cloud.google.com/apis/credentials"
    echo "  2. Create new API key"
    echo "  3. Enable APIs: Maps SDK for Android, Directions API, Geocoding API"
    echo "  4. Restrict key to Android apps (package: $PACKAGE_NAME)"
    echo ""
    
    info "Google Services JSON (for Firebase/Play Services):"
    echo "  Optional: Add google-services.json for:"
    echo "    - Firebase Analytics"
    echo "    - Firebase Cloud Messaging"
    echo "    - Google Play Services"
    echo ""
    
    if [ ! -f "$PROJECT/google-services.json" ]; then
        info "Create google-services.json from Firebase Console:"
        echo "  1. Go to https://console.firebase.google.com"
        echo "  2. Create new project or select existing"
        echo "  3. Add Android app with package: $PACKAGE_NAME"
        echo "  4. Download google-services.json"
        echo "  5. Place in: $PROJECT/google-services.json"
        echo ""
    else
        ok "google-services.json found"
    fi
}

generate_local_properties() {
    show_banner
    info "Generating local.properties template..."
    echo ""
    
    cat > "$PROJECT/local.properties.template" << EOF
# This file is automatically generated by Android Studio.
# Do NOT commit this file to version control!

# Android SDK location
sdk.dir=/home/tukuk/Android/Sdk

# AdMob Configuration (optional)
#admob.app.id=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
#admob.banner.id=ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz
#admob.interstitial.id=ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww

# Backend URL
#backend.url=http://10.0.2.2:3000

# Map Provider (osm|google)
#map.provider=osm

# Google Maps API Key (if using Google Maps)
#google.maps.api.key=AIzaSy...
EOF
    
    ok "Created: $PROJECT/local.properties.template"
    echo ""
    info "Copy to local.properties and fill in your values:"
    echo "  cp $PROJECT/local.properties.template $PROJECT/local.properties"
    echo ""
}

generate_secrets_template() {
    show_banner
    info "Generating GitHub Actions secrets template..."
    echo ""
    
    cat > "$PROJECT/.github/secrets.example" << EOF
# GitHub Actions Secrets
# Add these in: https://github.com/fevian448/Map-Ai/settings/secrets/actions

# Android Signing
# SIGNING_KEY_STORE_PATH=app/mapai-release.keystore
# SIGNING_KEY_STORE_PASSWORD=your_keystore_password
# SIGNING_KEY_ALIAS=mapai
# SIGNING_KEY_PASSWORD=your_key_password

# AdMob (optional)
# ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
# ADMOB_BANNER_ID=ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz

# Backend
# BACKEND_URL=https://your-backend.onrender.com

# Maps
# GOOGLE_MAPS_API_KEY=AIzaSy...
EOF
    
    ok "Created: $PROJECT/.github/secrets.example"
    echo ""
    info "Add secrets at: https://github.com/fevian448/Map-Ai/settings/secrets/actions"
    echo ""
}

show_all_ids() {
    show_banner
    info "All Configuration IDs for MapAi"
    echo ""
    
    echo "=========================================="
    echo "  ANDROID APP"
    echo "=========================================="
    echo "  Package Name:      $PACKAGE_NAME"
    echo "  Application ID:    $PACKAGE_NAME"
    echo ""
    
    echo "=========================================="
    echo "  ADMOB (Test IDs)"
    echo "=========================================="
    echo "  App ID:            ca-app-pub-3940256099942544~3347511713"
    echo "  Banner:            ca-app-pub-3940256099942544/6300978111"
    echo "  Interstitial:      ca-app-pub-3940256099942544/1033173712"
    echo "  Rewarded:          ca-app-pub-3940256099942544/5224354917"
    echo ""
    
    echo "=========================================="
    echo "  GOOGLE MAPS"
    echo "=========================================="
    echo "  API Key:           AIzaSyBLApTRwV8HEm8xlLQTNfZyDcByUx_2hYU"
    echo "  Console:           https://console.cloud.google.com/apis/credentials"
    echo ""
    
    echo "=========================================="
    echo "  BACKEND"
    echo "=========================================="
    echo "  Default URL:       http://10.0.2.2:3000 (emulator)"
    echo "  Production:        http://<your-server>:3000"
    echo "  API Base:          http://localhost:3000/api"
    echo ""
    
    echo "=========================================="
    echo "  SIGNING KEYSTORE"
    echo "=========================================="
    if [ -f "$PROJECT/$KEYSTORE_NAME" ]; then
        echo "  Keystore:          $PROJECT/$KEYSTORE_NAME"
        echo "  Alias:             $KEYSTORE_ALIAS"
        echo "  Status:            Generated"
    else
        echo "  Keystore:          NOT GENERATED"
        echo "  Run: ./config.sh generate-keystore"
    fi
    echo ""
    
    echo "=========================================="
    echo "  GITHUB"
    echo "=========================================="
    echo "  Repository:        https://github.com/fevian448/Map-Ai"
    echo "  Pages:             https://fevian448.github.io/Map-Ai/"
    echo "  Actions:           https://github.com/fevian448/Map-Ai/actions"
    echo "  Wiki:              https://github.com/fevian448/Map-Ai/wiki"
    echo ""
    
    echo "=========================================="
    echo "  RUNTIME URLS"
    echo "=========================================="
    echo "  Local Backend:     http://localhost:3000"
    echo "  Live View:         http://localhost:3000/"
    echo "  Health Check:      http://localhost:3000/api/health"
    echo ""
}

setup_all() {
    show_banner
    info "Running complete setup..."
    echo ""
    
    generate_admob_ids
    generate_google_services
    generate_local_properties
    generate_secrets_template
    
    echo ""
    ok "Setup complete!"
    echo ""
    info "Next steps:"
    echo "  1. Replace AdMob test IDs with real IDs from https://admob.google.com"
    echo "  2. Generate keystore: ./config.sh generate-keystore"
    echo "  3. Enable GitHub Pages: https://github.com/fevian448/Map-Ai/settings/pages"
    echo "  4. Enable Wiki: https://github.com/fevian448/Map-Ai/wiki"
    echo "  5. Deploy backend: ./deploy.sh"
    echo ""
}

show_help() {
    show_banner
    echo "Commands:"
    echo "  setup            Run complete setup (all IDs and configs)"
    echo "  show             Display all current configuration IDs"
    echo "  generate-keystore Generate Android signing keystore"
    echo "  admob            Generate AdMob IDs template"
    echo "  google           Show Google services configuration"
    echo "  secrets          Generate GitHub Actions secrets template"
    echo "  reset            Reset local configuration (keystore, local.properties)"
    echo "  help             Show this help"
    echo ""
    echo "Usage:"
    echo "  ./config.sh setup"
    echo "  ./config.sh show"
    echo "  ./config.sh generate-keystore"
    echo ""
}

reset_config() {
    show_banner
    warn "This will remove local configuration files!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Reset cancelled"
        return
    fi
    
    cd "$PROJECT"
    
    info "Removing local configs..."
    rm -f local.properties
    rm -f admob_config.properties
    rm -f "$KEYSTORE_NAME"
    rm -f "$KEYSTORE_NAME.asc"  # GPG backup if exists
    
    # Remove from gradle.properties
    sed -i '/# Keystore Configuration/d' gradle.properties
    sed -i '/MYAPP_RELEASE_STORE_FILE/d' gradle.properties
    sed -i '/MYAPP_RELEASE_KEY_ALIAS/d' gradle.properties
    sed -i '/MYAPP_RELEASE_STORE_PASSWORD/d' gradle.properties
    sed -i '/MYAPP_RELEASE_KEY_PASSWORD/d' gradle.properties
    
    ok "Local configuration reset"
    echo ""
    warn "Note: Git-tracked files like gradle.properties may need manual cleanup"
}

# Main
case "${1:-help}" in
    setup)
        setup_all
        ;;
    show)
        show_all_ids
        ;;
    generate-keystore)
        generate_keystore
        ;;
    admob)
        generate_admob_ids
        ;;
    google)
        generate_google_services
        ;;
    secrets)
        generate_secrets_template
        ;;
    reset)
        reset_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        err "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

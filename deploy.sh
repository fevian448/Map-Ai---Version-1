#!/bin/bash
# Deploy MapAi Backend to cloud platforms
# Supported: Render, Railway, Fly.io, Vercel (serverless)

set -e

echo "=========================================="
echo "  MapAi Backend Deployment Helper"
echo "=========================================="
echo ""

# Check for required files
if [ ! -f "backend/server.js" ]; then
    echo "Error: Run this script from the MapAi root directory"
    exit 1
fi

# Function to deploy to Render
deploy_render() {
    echo "Deploying to Render..."
    echo "1. Go to https://dashboard.render.com/select-repo?repo=YOUR_USERNAME/Map-Ai"
    echo "2. Select 'Web Service'"
    echo "3. Configure:"
    echo "   - Runtime: Node.js"
    echo "   - Build Command: cd backend && npm install"
    echo "   - Start Command: cd backend && npm start"
    echo "   - Plan: Free"
    echo "4. Add environment variables:"
    echo "   - GOOGLE_MAPS_API_KEY (optional)"
    echo "   - LLM_ENDPOINT (optional)"
    echo "   - LLM_KEY (optional)"
    echo ""
}

# Function to deploy to Railway
deploy_railway() {
    echo "Deploying to Railway..."
    echo "1. Install Railway CLI: npm i -g @railway/cli"
    echo "2. Run: railway login"
    echo "3. Run: railway init"
    echo "4. Run: railway up"
    echo ""
}

# Function to deploy with Docker
deploy_docker() {
    echo "Building Docker image..."
    docker build -t mapai-backend ./backend
    echo "Running Docker container..."
    docker run -d -p 3000:3000 -v mapai-data:/app/data --name mapai-backend mapai-backend
    echo "Backend running at http://localhost:3000"
    echo ""
}

# Main menu
echo "Choose deployment method:"
echo "1) Docker (local/self-hosted)"
echo "2) Render (free tier available)"
echo "3) Railway (free tier available)"
echo "4) Fly.io (free tier available)"
echo "5) Just build Docker image"
echo ""

read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        deploy_docker
        ;;
    2)
        deploy_render
        ;;
    3)
        deploy_railway
        ;;
    4)
        echo "Deploying to Fly.io..."
        echo "1. Install flyctl: curl -L https://fly.io/install.sh | sh"
        echo "2. Run: fly auth login"
        echo "3. Run: fly launch (in backend/ directory)"
        echo ""
        ;;
    5)
        echo "Building Docker image..."
        docker build -t mapai-backend ./backend
        echo "Image built: mapai-backend"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  Backend deployment info"
echo "=========================================="
echo "API Base URL: http://localhost:3000"
echo "Live View: http://localhost:3000/"
echo ""
echo "Don't forget to update Android app Settings:"
echo "  Settings → URL Server Backend → http://your-server:3000"
echo ""

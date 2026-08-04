#!/bin/bash
# MapAi — Android Studio + GitHub Integration Workflow
# Usage: ./mapai.sh [command]
# Commands: status, build, push, deploy, live, wiki, all

set -e

PROJECT_ROOT="/home/tukuk/AndroidStudioProjects/MapAi"
WIKI_DIR="/home/tukuk/AndroidStudioProjects/MapAi-wiki"
BACKEND_DIR="$PROJECT_ROOT/backend"
GITHUB_REPO="fevian448/Map-Ai"
GITHUB_PAGES_URL="https://fevian448.github.io/Map-Ai/"
GITHUB_ACTIONS_URL="https://github.com/fevian448/Map-Ai/actions"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_banner() {
    echo "=========================================="
    echo "  MapAi — Android Studio + GitHub"
    echo "=========================================="
    echo "  Repo: $GITHUB_REPO"
    echo "  Root: $PROJECT_ROOT"
    echo "  Wiki:  $WIKI_DIR"
    echo "=========================================="
    echo ""
}

check_project() {
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "Project not found at $PROJECT_ROOT"
        exit 1
    fi
    cd "$PROJECT_ROOT"
}

cmd_status() {
    show_banner
    check_project
    log_info "Git Status:"
    git status --short
    echo ""
    log_info "Git Branch:"
    git branch -v
    echo ""
    log_info "Last 3 Commits:"
    git log --oneline -3
    echo ""
    log_info "GitHub Pages URL:"
    echo "  $GITHUB_PAGES_URL"
    echo ""
    log_info "GitHub Actions:"
    echo "  $GITHUB_ACTIONS_URL"
    echo ""
    log_info "Backend Directory:"
    echo "  $BACKEND_DIR"
    echo ""
}

cmd_build() {
    show_banner
    check_project
    log_info "Building Android app (debug + release)..."
    ./gradlew clean assembleDebug assembleRelease
    log_success "Build complete!"
    echo ""
    log_info "APK Locations:"
    echo "  Debug:   $PROJECT_ROOT/app/build/outputs/apk/debug/app-debug.apk"
    echo "  Release: $PROJECT_ROOT/app/build/outputs/apk/release/app-release.apk"
    echo ""
}

cmd_push() {
    show_banner
    check_project
    log_info "Staging all changes..."
    git add -A
    log_info "Committing..."
    git commit -m "Update MapAi app and backend" || log_warning "Nothing to commit"
    log_info "Pushing to GitHub..."
    git push origin master
    log_success "Push complete!"
    echo ""
    log_info "View commits:"
    echo "  $GITHUB_ACTIONS_URL"
}

cmd_deploy() {
    show_banner
    log_info "Deploying backend..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing backend dependencies..."
        npm install
    fi
    
    log_info "Starting backend server..."
    log_success "Backend will be available at http://localhost:3000"
    echo ""
    log_info "Live View Web:"
    echo "  http://localhost:3000/"
    echo ""
    log_info "To deploy to cloud (Render/Railway/Fly.io), see DEPLOY.md"
    
    npm start
}

cmd_live() {
    show_banner
    log_info "Starting live view server..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing backend dependencies..."
        npm install
    fi
    
    log_success "Live view starting at http://localhost:3000"
    echo ""
    log_info "Press Ctrl+C to stop"
    echo ""
    
    npm start
}

cmd_wiki() {
    show_banner
    log_info "Managing GitHub Wiki..."
    
    if [ ! -d "$WIKI_DIR/.git" ]; then
        log_error "Wiki directory not initialized at $WIKI_DIR"
        log_info "Please create wiki first at: https://github.com/$GITHUB_REPO/wiki"
        exit 1
    fi
    
    cd "$WIKI_DIR"
    
    log_info "Wiki Status:"
    git status --short
    echo ""
    
    log_info "Pushing wiki to GitHub..."
    git push origin master
    
    log_success "Wiki updated!"
    echo ""
    log_info "View wiki at:"
    echo "  https://github.com/$GITHUB_REPO/wiki"
}

cmd_all() {
    show_banner
    check_project
    
    log_info "Step 1/4: Building Android app..."
    ./gradlew clean assembleDebug assembleRelease
    log_success "Build complete!"
    echo ""
    
    log_info "Step 2/4: Pushing to GitHub..."
    git add -A
    git commit -m "Update MapAi — $(date '+%Y-%m-%d %H:%M')" || log_warning "Nothing to commit"
    git push origin master
    log_success "Push complete!"
    echo ""
    
    log_info "Step 3/4: GitHub Actions will now:"
    echo "  - Build APK artifacts"
    echo "  - Deploy live view to GitHub Pages"
    echo "  - Build and push backend Docker image"
    echo ""
    log_info "Monitor at: $GITHUB_ACTIONS_URL"
    echo ""
    
    log_info "Step 4/4: Live view will be available at:"
    echo "  $GITHUB_PAGES_URL"
    echo ""
    
    log_info "Starting backend locally..."
    cd "$BACKEND_DIR"
    npm start
}

cmd_help() {
    show_banner
    echo "Commands:"
    echo "  status   — Show git status, branches, and URLs"
    echo "  build    — Build Android APK (debug + release)"
    echo "  push     — Git add, commit, and push to GitHub"
    echo "  deploy   — Deploy backend to localhost:3000"
    echo "  live     — Start live view server (backend + web)"
    echo "  wiki     — Push wiki content to GitHub"
    echo "  all      — Build + Push + Deploy (full workflow)"
    echo "  help     — Show this help"
    echo ""
    echo "Examples:"
    echo "  ./mapai.sh status"
    echo "  ./mapai.sh build"
    echo "  ./mapai.sh push"
    echo "  ./mapai.sh all"
    echo ""
}

# Main
case "${1:-help}" in
    status)
        cmd_status
        ;;
    build)
        cmd_build
        ;;
    push)
        cmd_push
        ;;
    deploy)
        cmd_deploy
        ;;
    live)
        cmd_live
        ;;
    wiki)
        cmd_wiki
        ;;
    all)
        cmd_all
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        log_error "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac

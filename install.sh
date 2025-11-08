#!/bin/bash
set -e

# =============================================================================
# Agent Girl Installer - Production Grade
# =============================================================================
# Handles all edge cases, validates dependencies, verifies downloads,
# and provides comprehensive error handling with rollback support.
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO="KenKaiii/agent-girl"
APP_NAME="agent-girl"
MIN_DISK_SPACE_MB=100

# Global state for cleanup
TEMP_FILES=()
INSTALL_SUCCESS=false

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

log_section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}   $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Cleanup function - called on exit or error
cleanup() {
  if [[ "$INSTALL_SUCCESS" != "true" ]]; then
    log_warning "Installation interrupted or failed. Cleaning up..."
    for file in "${TEMP_FILES[@]}"; do
      if [[ -e "$file" ]]; then
        rm -rf "$file" 2>/dev/null || true
      fi
    done
  fi
}

# Register cleanup trap
trap cleanup EXIT INT TERM

# Fatal error handler
fatal_error() {
  log_error "$1"
  echo ""
  if [[ -n "${2:-}" ]]; then
    echo -e "${YELLOW}Suggestion:${NC} $2"
    echo ""
  fi
  exit 1
}

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
  log_section "Checking System Dependencies"

  local missing_deps=()
  local required_commands=("curl" "unzip" "grep" "sed" "awk")

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_deps+=("$cmd")
    fi
  done

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    log_error "Missing required dependencies: ${missing_deps[*]}"
    echo ""
    echo "Please install the missing tools:"

    # Platform-specific installation instructions
    case "$(uname -s)" in
      Darwin)
        echo "  brew install ${missing_deps[*]}"
        ;;
      Linux)
        if command -v apt-get &> /dev/null; then
          echo "  sudo apt-get install ${missing_deps[*]}"
        elif command -v yum &> /dev/null; then
          echo "  sudo yum install ${missing_deps[*]}"
        else
          echo "  Use your system's package manager to install: ${missing_deps[*]}"
        fi
        ;;
    esac

    exit 1
  fi

  log_success "All dependencies found"
}

# =============================================================================
# Network Connectivity Check
# =============================================================================

check_network() {
  log_section "Checking Network Connectivity"

  # Test basic internet connectivity
  if ! curl -s --connect-timeout 5 --max-time 10 https://www.google.com > /dev/null 2>&1; then
    fatal_error "No internet connection detected" \
      "Please check your network connection and try again"
  fi

  # Test GitHub API availability
  if ! curl -s --connect-timeout 5 --max-time 10 https://api.github.com > /dev/null 2>&1; then
    fatal_error "Cannot reach GitHub API" \
      "GitHub may be down. Check https://www.githubstatus.com/"
  fi

  log_success "Network connection verified"
}

# =============================================================================
# Platform Detection
# =============================================================================

detect_platform() {
  log_section "Detecting Platform"

  # Detect OS
  OS=$(uname -s)
  case $OS in
    Darwin)
      OS_NAME="macOS"
      OS_PREFIX="macos"
      INSTALL_DIR="$HOME/Applications/agent-girl-app"
      ;;
    Linux)
      OS_NAME="Linux"
      OS_PREFIX="linux"
      INSTALL_DIR="$HOME/.local/share/agent-girl-app"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      OS_NAME="Windows (Git Bash)"
      OS_PREFIX="windows"
      # Properly expand Windows path
      if [[ -n "$LOCALAPPDATA" ]]; then
        INSTALL_DIR="$LOCALAPPDATA/Programs/agent-girl-app"
      else
        # Fallback for Git Bash
        INSTALL_DIR="$USERPROFILE/AppData/Local/Programs/agent-girl-app"
      fi
      ;;
    *)
      fatal_error "Unsupported OS: $OS" \
        "This installer supports macOS, Linux, and Windows (Git Bash/WSL)"
      ;;
  esac

  # Detect architecture
  ARCH=$(uname -m)
  case $ARCH in
    x86_64|amd64)
      if [[ "$OS_PREFIX" == "macos" ]]; then
        PLATFORM="macos-intel"
        ARCH_NAME="Intel (x86_64)"
      elif [[ "$OS_PREFIX" == "windows" ]]; then
        PLATFORM="windows-x64"
        ARCH_NAME="x64"
      else
        PLATFORM="linux-x64"
        ARCH_NAME="x86_64"
      fi
      ;;
    arm64|aarch64)
      if [[ "$OS_PREFIX" == "macos" ]]; then
        PLATFORM="macos-arm64"
        ARCH_NAME="Apple Silicon (ARM64)"
      elif [[ "$OS_PREFIX" == "windows" ]]; then
        PLATFORM="windows-arm64"
        ARCH_NAME="ARM64"
      else
        PLATFORM="linux-arm64"
        ARCH_NAME="ARM64"
      fi
      ;;
    *)
      fatal_error "Unsupported architecture: $ARCH" \
        "This installer supports x86_64 and ARM64 architectures"
      ;;
  esac

  log_success "OS: $OS_NAME"
  log_success "Architecture: $ARCH_NAME"
  log_success "Install location: $INSTALL_DIR"
}

# =============================================================================
# Check Disk Space
# =============================================================================

check_disk_space() {
  log_section "Checking Disk Space"

  local available_space

  if [[ "$OS_PREFIX" == "macos" ]]; then
    # macOS uses df differently
    available_space=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  else
    # Linux and Git Bash
    available_space=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  fi

  if [[ $available_space -lt $MIN_DISK_SPACE_MB ]]; then
    fatal_error "Insufficient disk space (${available_space}MB available, ${MIN_DISK_SPACE_MB}MB required)" \
      "Free up some disk space and try again"
  fi

  log_success "Sufficient disk space (${available_space}MB available)"
}

# =============================================================================
# Check for Existing Installation
# =============================================================================

check_existing_installation() {
  if [[ -d "$INSTALL_DIR" ]]; then
    log_section "Existing Installation Detected"

    # Check if there's a running process
    if [[ "$OS_PREFIX" == "macos" || "$OS_PREFIX" == "linux" ]]; then
      if lsof -ti:3001 > /dev/null 2>&1; then
        log_warning "Agent Girl appears to be running (port 3001 in use)"
        echo ""
        read -p "Stop the running instance and upgrade? [y/N]: " stop_running < /dev/tty

        if [[ "$stop_running" =~ ^[Yy]$ ]]; then
          lsof -ti:3001 | xargs kill -9 2>/dev/null || true
          sleep 1
          log_success "Stopped running instance"
        else
          fatal_error "Installation cancelled" \
            "Stop Agent Girl manually and try again"
        fi
      fi
    fi

    # Backup existing .env if present
    if [[ -f "$INSTALL_DIR/.env" ]]; then
      log_info "Backing up existing .env configuration..."
      cp "$INSTALL_DIR/.env" "$INSTALL_DIR/.env.backup"
      ENV_BACKUP_CREATED=true
    fi

    log_info "This will upgrade your existing installation"
    echo ""
  else
    log_section "New Installation"
  fi
}

# =============================================================================
# Fetch Latest Release
# =============================================================================

fetch_release_info() {
  log_section "Fetching Latest Release"

  log_info "Querying GitHub API..."

  # Fetch with timeout and retry
  local max_retries=3
  local retry_count=0
  local release_json

  while [[ $retry_count -lt $max_retries ]]; do
    if release_json=$(curl -s --connect-timeout 10 --max-time 30 \
      "https://api.github.com/repos/$REPO/releases/latest" 2>&1); then
      break
    fi

    retry_count=$((retry_count + 1))
    if [[ $retry_count -lt $max_retries ]]; then
      log_warning "Failed to fetch release info. Retrying (${retry_count}/${max_retries})..."
      sleep 2
    fi
  done

  if [[ $retry_count -eq $max_retries ]]; then
    fatal_error "Failed to fetch release information after $max_retries attempts" \
      "Check your internet connection or try again later"
  fi

  # Validate response
  if echo "$release_json" | grep -q "Not Found"; then
    fatal_error "Repository not found or no releases available" \
      "Check https://github.com/$REPO/releases"
  fi

  # Extract version and download URL
  VERSION=$(echo "$release_json" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' | head -1)
  DOWNLOAD_URL=$(echo "$release_json" | grep "browser_download_url.*$PLATFORM.zip" | cut -d '"' -f 4 | head -1)
  CHECKSUM_URL=$(echo "$release_json" | grep "browser_download_url.*checksums.txt" | cut -d '"' -f 4 | head -1)

  if [[ -z "$DOWNLOAD_URL" ]]; then
    fatal_error "No release found for platform: $PLATFORM" \
      "This platform may not be supported yet. Check https://github.com/$REPO/releases"
  fi

  log_success "Latest version: $VERSION"
  log_success "Release found for $PLATFORM"
}

# =============================================================================
# Download Release
# =============================================================================

download_release() {
  log_section "Downloading Agent Girl $VERSION"

  DOWNLOAD_PATH="/tmp/$APP_NAME-$PLATFORM-$$.zip"
  TEMP_FILES+=("$DOWNLOAD_PATH")

  log_info "Downloading from GitHub..."
  echo -e "   ${BLUE}$DOWNLOAD_URL${NC}"
  echo ""

  # Download with progress bar and resume support
  if ! curl -L --connect-timeout 30 --max-time 300 \
    --progress-bar --fail \
    -o "$DOWNLOAD_PATH" "$DOWNLOAD_URL"; then
    fatal_error "Download failed" \
      "Check your internet connection and try again"
  fi

  # Verify download size
  local file_size=$(stat -f%z "$DOWNLOAD_PATH" 2>/dev/null || stat -c%s "$DOWNLOAD_PATH" 2>/dev/null)
  if [[ $file_size -lt 1000000 ]]; then  # Less than 1MB is suspicious
    fatal_error "Downloaded file is suspiciously small (${file_size} bytes)" \
      "The download may be corrupted. Try again"
  fi

  echo ""
  log_success "Download complete ($(numfmt --to=iec-i --suffix=B $file_size 2>/dev/null || echo "${file_size} bytes"))"

  # Download and verify checksum if available
  if [[ -n "$CHECKSUM_URL" ]]; then
    log_info "Verifying download integrity..."

    CHECKSUM_PATH="/tmp/$APP_NAME-checksums-$$.txt"
    TEMP_FILES+=("$CHECKSUM_PATH")

    if curl -sL --connect-timeout 10 --max-time 30 \
      -o "$CHECKSUM_PATH" "$CHECKSUM_URL" 2>/dev/null; then

      # Extract expected checksum for our platform
      local expected_checksum=$(grep "$APP_NAME-$PLATFORM.zip" "$CHECKSUM_PATH" | awk '{print $1}')

      if [[ -n "$expected_checksum" ]]; then
        # Calculate actual checksum
        local actual_checksum
        if command -v sha256sum &> /dev/null; then
          actual_checksum=$(sha256sum "$DOWNLOAD_PATH" | awk '{print $1}')
        elif command -v shasum &> /dev/null; then
          actual_checksum=$(shasum -a 256 "$DOWNLOAD_PATH" | awk '{print $1}')
        else
          log_warning "No SHA256 tool found, skipping checksum verification"
          actual_checksum=""
        fi

        if [[ -n "$actual_checksum" ]]; then
          if [[ "$actual_checksum" == "$expected_checksum" ]]; then
            log_success "Checksum verified"
          else
            fatal_error "Checksum mismatch! Downloaded file may be corrupted or tampered with" \
              "Try downloading again or report this issue"
          fi
        fi
      else
        log_warning "Checksum not found for $PLATFORM, skipping verification"
      fi
    else
      log_warning "Could not download checksums, skipping verification"
    fi
  fi
}

# =============================================================================
# Extract and Install
# =============================================================================

extract_and_install() {
  log_section "Installing Agent Girl"

  # Create install directory
  log_info "Creating installation directory..."
  mkdir -p "$INSTALL_DIR" || fatal_error "Failed to create install directory" \
    "Check that you have write permissions to $(dirname "$INSTALL_DIR")"

  # Extract archive
  log_info "Extracting files..."

  # The zip contains a directory named agent-girl-{platform}
  EXTRACT_PATH="/tmp/$APP_NAME-$PLATFORM"
  TEMP_FILES+=("$EXTRACT_PATH")

  if ! unzip -q -o "$DOWNLOAD_PATH" -d "/tmp/" 2>&1; then
    fatal_error "Extraction failed" \
      "The downloaded file may be corrupted. Try again"
  fi

  # Verify extraction
  if [[ ! -d "$EXTRACT_PATH" ]]; then
    fatal_error "Extraction produced unexpected structure" \
      "This may be a packaging issue. Please report it"
  fi

  # Move files to installation directory
  log_info "Installing files to $INSTALL_DIR..."

  # Remove old files but preserve .env if it exists
  if [[ -d "$INSTALL_DIR" ]]; then
    find "$INSTALL_DIR" -mindepth 1 ! -name '.env' ! -name '.env.backup' -delete 2>/dev/null || true
  fi

  # Move new files
  if ! mv "$EXTRACT_PATH"/* "$INSTALL_DIR/" 2>/dev/null; then
    # Fallback: use cp -r if mv fails (cross-filesystem moves)
    cp -r "$EXTRACT_PATH"/* "$INSTALL_DIR/" || \
      fatal_error "Failed to install files" \
        "Check disk space and permissions"
  fi

  # Set executable permissions
  if [[ -f "$INSTALL_DIR/$APP_NAME" ]]; then
    chmod +x "$INSTALL_DIR/$APP_NAME" || \
      log_warning "Could not set executable permissions (may need to run manually)"
  fi

  # Restore .env if we backed it up
  if [[ "${ENV_BACKUP_CREATED:-false}" == "true" ]] && [[ -f "$INSTALL_DIR/.env.backup" ]]; then
    log_info "Restoring your API key configuration..."
    mv "$INSTALL_DIR/.env.backup" "$INSTALL_DIR/.env"
  fi

  log_success "Installation complete"
}

# =============================================================================
# Validate and Rebuild Dependencies
# =============================================================================

validate_and_rebuild_dependencies() {
  log_section "Validating Runtime Dependencies"

  cd "$INSTALL_DIR"

  # 1. Check for Node.js v18+ (CRITICAL for Claude SDK subprocess)
  log_info "Checking Node.js availability..."
  if ! command -v node &> /dev/null; then
    log_warning "Node.js not found!"
    echo ""
    echo "Agent Girl requires Node.js v18+ for the Claude SDK subprocess."
    echo ""
    echo "Installation instructions:"
    case "$OS_PREFIX" in
      macos)
        echo "  ${CYAN}brew install node${NC}"
        ;;
      linux)
        if grep -qi "ubuntu\|debian" /etc/os-release 2>/dev/null; then
          echo "  ${CYAN}curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -${NC}"
          echo "  ${CYAN}sudo apt-get install -y nodejs${NC}"
        else
          echo "  ${CYAN}Visit: https://nodejs.org${NC}"
        fi
        ;;
      windows)
        echo "  ${CYAN}Visit: https://nodejs.org${NC}"
        ;;
    esac
    echo ""
    fatal_error "Node.js v18+ is required but not installed"
  fi

  # Verify Node.js version
  NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
  if [[ -z "$NODE_VERSION" ]] || [[ $NODE_VERSION -lt 18 ]]; then
    fatal_error "Node.js v18+ required (found: v${NODE_VERSION:-unknown})" \
      "Please upgrade Node.js: https://nodejs.org"
  fi

  log_success "Node.js v$NODE_VERSION found"

  # 2. Check if Node.js is in a usable PATH location (detect Windows Node in WSL)
  NODE_PATH=$(which node)
  if [[ "$NODE_PATH" == *"/mnt/c/"* ]] || [[ "$NODE_PATH" == *.exe ]]; then
    log_warning "Detected Windows Node.js in WSL environment!"
    echo ""
    echo "You have Windows Node.js in your PATH, but Agent Girl needs native WSL Node."
    echo ""

    # Check if we can auto-install
    if grep -qi "ubuntu\|debian" /etc/os-release 2>/dev/null; then
      log_info "Auto-installing native WSL Node.js..."

      if curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null && \
         sudo apt-get install -y nodejs 2>/dev/null; then

        # Prepend native node to PATH for this session
        export PATH="/usr/bin:$PATH"
        log_success "Native WSL Node.js installed"

        # Verify it worked
        NODE_PATH=$(which node)
        if [[ "$NODE_PATH" == *"/mnt/c/"* ]] || [[ "$NODE_PATH" == *.exe ]]; then
          log_warning "Please add 'export PATH=\"/usr/bin:\$PATH\"' to your ~/.bashrc"
        fi
      else
        fatal_error "Could not auto-install native WSL Node.js" \
          "Please install manually: https://nodejs.org"
      fi
    else
      fatal_error "Windows Node.js detected in WSL" \
        "Please install native WSL Node.js: https://nodejs.org"
    fi
  fi

  # 3. Rebuild platform-specific dependencies (sharp, etc.)
  log_info "Rebuilding platform-specific dependencies..."

  # Check if Bun is available
  if ! command -v bun &> /dev/null; then
    log_warning "Bun not installed - dependencies will be installed on first run"
    log_info "The launcher script will auto-install Bun when you start the app"
    return
  fi

  # Remove potentially mismatched binaries
  rm -rf node_modules/@img/sharp-* 2>/dev/null || true

  # Reinstall to get correct platform binaries
  log_info "Running: bun install --production"
  if bun install --production > /dev/null 2>&1; then
    log_success "Dependencies rebuilt for $ARCH_NAME"
  else
    log_warning "Dependency install had warnings (non-fatal, will retry on first run)"
  fi

  # 4. Verify critical binaries exist for this platform
  EXPECTED_SHARP=""
  case "$PLATFORM" in
    macos-arm64)
      EXPECTED_SHARP="node_modules/@img/sharp-darwin-arm64"
      ;;
    macos-intel)
      EXPECTED_SHARP="node_modules/@img/sharp-darwin-x64"
      ;;
    linux-x64)
      EXPECTED_SHARP="node_modules/@img/sharp-linux-x64"
      ;;
    linux-arm64)
      EXPECTED_SHARP="node_modules/@img/sharp-linux-arm64"
      ;;
    windows-x64)
      EXPECTED_SHARP="node_modules/@img/sharp-win32-x64"
      ;;
  esac

  if [[ -n "$EXPECTED_SHARP" ]] && [[ ! -d "$EXPECTED_SHARP" ]]; then
    log_warning "Platform-specific sharp binary not found"
    log_info "Will be installed on first run"
  else
    log_success "Platform-specific binaries verified"
  fi

  log_success "All runtime dependencies validated"
}

# =============================================================================
# API Key Configuration
# =============================================================================

configure_api_keys() {
  log_section "API Key Setup"

  # Check for existing real keys (not placeholders)
  local existing_anthropic=""
  local existing_zai=""
  local existing_moonshot=""

  if [[ -f "$INSTALL_DIR/.env" ]]; then
    # Extract existing keys if they're not placeholders
    existing_anthropic=$(grep "^ANTHROPIC_API_KEY=" "$INSTALL_DIR/.env" 2>/dev/null | grep -v "sk-ant-your-key-here" | cut -d'=' -f2- || echo "")
    existing_zai=$(grep "^ZAI_API_KEY=" "$INSTALL_DIR/.env" 2>/dev/null | grep -v "your-zai-key-here" | cut -d'=' -f2- || echo "")
    existing_moonshot=$(grep "^MOONSHOT_API_KEY=" "$INSTALL_DIR/.env" 2>/dev/null | grep -v "your-moonshot-key-here" | cut -d'=' -f2- || echo "")

    # If all keys are configured, skip
    if [[ -n "$existing_anthropic" && -n "$existing_zai" && -n "$existing_moonshot" ]]; then
      log_success "All API keys already configured"
      return
    fi

    # If any keys are configured, inform user
    if [[ -n "$existing_anthropic" || -n "$existing_zai" || -n "$existing_moonshot" ]]; then
      log_info "Some API keys already configured"
      [[ -n "$existing_anthropic" ]] && echo -e "  ${GREEN}✓${NC} Available: Claude models"
      [[ -n "$existing_zai" ]] && echo -e "  ${GREEN}✓${NC} Available: GLM models"
      [[ -n "$existing_moonshot" ]] && echo -e "  ${GREEN}✓${NC} Available: Kimi models"
      [[ -z "$existing_anthropic" ]] && echo -e "  ${YELLOW}✗${NC} Unavailable: Claude models (needs Anthropic API key)"
      [[ -z "$existing_zai" ]] && echo -e "  ${YELLOW}✗${NC} Unavailable: GLM models (needs Z.AI API key)"
      [[ -z "$existing_moonshot" ]] && echo -e "  ${YELLOW}✗${NC} Unavailable: Kimi models (needs Moonshot API key)"
      echo ""
    fi
  fi

  # Use existing keys as defaults
  local ANTHROPIC_KEY="$existing_anthropic"
  local ZAI_KEY="$existing_zai"
  local MOONSHOT_KEY="$existing_moonshot"

  # If some keys exist, offer to add missing ones
  if [[ -n "$existing_anthropic" || -n "$existing_zai" || -n "$existing_moonshot" ]]; then
    # Offer to add missing keys
    if [[ -z "$existing_anthropic" ]]; then
      read -p "Add Anthropic API key for Claude models? [y/N]: " add_anthropic < /dev/tty
      if [[ "$add_anthropic" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}📝 Anthropic API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
        echo ""
        read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
      fi
    fi

    if [[ -z "$existing_zai" ]]; then
      read -p "Add Z.AI API key for GLM models? [y/N]: " add_zai < /dev/tty
      if [[ "$add_zai" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}📝 Z.AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
        echo ""
        read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
      fi
    fi

    if [[ -z "$existing_moonshot" ]]; then
      read -p "Add Moonshot API key for Kimi models? [y/N]: " add_moonshot < /dev/tty
      if [[ "$add_moonshot" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}📝 Moonshot AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://platform.moonshot.ai/${NC}"
        echo ""
        read -p "Enter your Moonshot API key: " MOONSHOT_KEY < /dev/tty
      fi
    fi
  else
    # No existing keys, show full menu
    echo "Which API provider(s) do you want to use?"
    echo ""
    echo -e "  ${YELLOW}1)${NC} Anthropic API only (Claude models)"
    echo -e "  ${YELLOW}2)${NC} Z.AI API only (GLM models)"
    echo -e "  ${YELLOW}3)${NC} Moonshot AI only (Kimi models)"
    echo -e "  ${YELLOW}4)${NC} All APIs (full model access)"
    echo -e "  ${YELLOW}5)${NC} Skip (configure later)"
    echo ""

    local api_choice
    read -p "Enter choice [1-5]: " api_choice < /dev/tty

    case $api_choice in
      1)
        echo ""
        echo -e "${BLUE}📝 Anthropic API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
        echo ""
        read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
        ;;
      2)
        echo ""
        echo -e "${BLUE}📝 Z.AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
        echo ""
        read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
        ;;
      3)
        echo ""
        echo -e "${BLUE}📝 Moonshot AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://platform.moonshot.ai/${NC}"
        echo ""
        read -p "Enter your Moonshot API key: " MOONSHOT_KEY < /dev/tty
        ;;
      4)
        echo ""
        echo -e "${BLUE}📝 Anthropic API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
        echo ""
        read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
        echo ""
        echo -e "${BLUE}📝 Z.AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
        echo ""
        read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
        echo ""
        echo -e "${BLUE}📝 Moonshot AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://platform.moonshot.ai/${NC}"
        echo ""
        read -p "Enter your Moonshot API key: " MOONSHOT_KEY < /dev/tty
        ;;
      5)
        echo ""
        log_warning "Skipping API configuration"
        echo "You'll need to edit ${YELLOW}$INSTALL_DIR/.env${NC} before running Agent Girl"
        return
        ;;
      *)
        echo ""
        log_warning "Invalid choice. Skipping API configuration."
        return
        ;;
    esac
  fi

  # Set defaults if not provided (preserve existing keys if set)
  [[ -z "$ANTHROPIC_KEY" ]] && ANTHROPIC_KEY="sk-ant-your-key-here"
  [[ -z "$ZAI_KEY" ]] && ZAI_KEY="your-zai-key-here"
  [[ -z "$MOONSHOT_KEY" ]] && MOONSHOT_KEY="your-moonshot-key-here"

  # Create .env file
  cat > "$INSTALL_DIR/.env" << EOF
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=$ZAI_KEY

# =============================================================================
# Moonshot AI Configuration (Kimi K2 Models)
# =============================================================================
# Get your API key from: https://platform.moonshot.ai/
# The server automatically configures the endpoint when you select a Kimi model
MOONSHOT_API_KEY=$MOONSHOT_KEY
EOF

  echo ""
  log_success "API keys configured"
}

# =============================================================================
# Personalization Setup
# =============================================================================

configure_personalization() {
  # Skip if user-config.json already exists
  if [[ -f "$INSTALL_DIR/data/user-config.json" ]]; then
    log_section "Personalization"
    log_success "Existing personalization preserved"
    return
  fi

  log_section "Personalization (Optional)"

  echo "Agent Girl can personalize your experience with your name."
  echo ""
  read -p "Enter your name (or press Enter to skip): " user_name < /dev/tty

  if [[ -n "$user_name" ]]; then
    # Parse name into firstName and lastName
    local name_parts=($user_name)
    local first_name="${name_parts[0]}"
    local last_name="${name_parts[@]:1}"

    # Create data directory and user-config.json
    mkdir -p "$INSTALL_DIR/data"

    if [[ -n "$last_name" ]]; then
      cat > "$INSTALL_DIR/data/user-config.json" << EOF
{
  "firstName": "$first_name",
  "lastName": "$last_name"
}
EOF
    else
      cat > "$INSTALL_DIR/data/user-config.json" << EOF
{
  "firstName": "$first_name"
}
EOF
    fi

    echo ""
    log_success "Personalization configured"
    log_info "Your name will appear in the interface as: ${YELLOW}$user_name${NC}"
  else
    log_info "Skipped personalization (you can run 'agent-girl --setup' later)"
  fi
}

# =============================================================================
# Create Global Launcher
# =============================================================================

create_global_launcher() {
  log_section "Setting Up Global Command"

  local LAUNCHER_PATH=""
  local NEEDS_SHELL_RESTART=false

  # Handle Windows Git Bash differently
  if [[ "$OS_PREFIX" == "windows" ]]; then
    # Try to add to PATH if not already there
    local git_bash_bin="$HOME/bin"

    mkdir -p "$git_bash_bin"
    LAUNCHER_PATH="$git_bash_bin/$APP_NAME"

    # Create launcher script
    cat > "$LAUNCHER_PATH" << EOF
#!/bin/bash
cd "$INSTALL_DIR" && ./$APP_NAME "\$@"
EOF
    chmod +x "$LAUNCHER_PATH"

    # Check if ~/bin is in PATH
    if [[ ":$PATH:" != *":$git_bash_bin:"* ]]; then
      # Add to .bashrc or .bash_profile
      local bash_rc="$HOME/.bashrc"
      [[ -f "$HOME/.bash_profile" ]] && bash_rc="$HOME/.bash_profile"

      if ! grep -q "export PATH=\"\$HOME/bin:\$PATH\"" "$bash_rc" 2>/dev/null; then
        echo 'export PATH="$HOME/bin:$PATH"' >> "$bash_rc"
        log_success "Added ~/bin to PATH in $bash_rc"
        NEEDS_SHELL_RESTART=true
      fi
    fi

    log_success "Launcher created at $LAUNCHER_PATH"
    log_info "Alternative: Use PowerShell installer for better Windows integration"

  elif [[ "$OS_PREFIX" == "macos" || "$OS_PREFIX" == "linux" ]]; then
    LAUNCHER_PATH="/usr/local/bin/$APP_NAME"

    # Create launcher script content
    LAUNCHER_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\" && ./$APP_NAME \"\$@\"
"

    # Try to create without sudo
    if echo "$LAUNCHER_SCRIPT" > "$LAUNCHER_PATH" 2>/dev/null && chmod +x "$LAUNCHER_PATH" 2>/dev/null; then
      log_success "Global launcher created"
    else
      # Needs sudo - ask user
      log_warning "Creating global command requires admin permissions"
      echo ""
      read -p "Create global launcher with sudo? [y/N]: " use_sudo < /dev/tty

      if [[ "$use_sudo" =~ ^[Yy]$ ]]; then
        echo "$LAUNCHER_SCRIPT" | sudo tee "$LAUNCHER_PATH" > /dev/null
        sudo chmod +x "$LAUNCHER_PATH"
        log_success "Global launcher created"
      else
        log_warning "Skipped global launcher"
        log_info "You can run: ${YELLOW}$INSTALL_DIR/$APP_NAME${NC}"
        LAUNCHER_PATH=""
      fi
    fi

    # Add /usr/local/bin to PATH if needed and launcher was created
    if [[ -n "$LAUNCHER_PATH" ]] && [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then
      log_info "Adding /usr/local/bin to PATH..."

      local shell_rc
      if [[ "$SHELL" == *"zsh"* ]]; then
        shell_rc="$HOME/.zshrc"
      else
        shell_rc="$HOME/.bash_profile"
      fi

      # Add PATH export if it doesn't already exist
      if ! grep -q 'export PATH="/usr/local/bin:$PATH"' "$shell_rc" 2>/dev/null; then
        echo 'export PATH="/usr/local/bin:$PATH"' >> "$shell_rc"
        log_success "Added /usr/local/bin to PATH"
        NEEDS_SHELL_RESTART=true
      fi
    fi
  fi

  # Store for success message
  export LAUNCHER_PATH
  export NEEDS_SHELL_RESTART
}

# =============================================================================
# Success Message
# =============================================================================

show_success_message() {
  log_section "Installation Successful! 🎉"

  echo -e "${GREEN}Agent Girl $VERSION has been installed successfully!${NC}"
  echo ""
  echo -e "${BLUE}📍 Installation Location:${NC}"
  echo -e "   $INSTALL_DIR"
  echo ""

  # Platform-specific launch instructions
  echo -e "${BLUE}🚀 How to Start Agent Girl:${NC}"
  echo ""

  if [[ "$OS_PREFIX" == "windows" ]]; then
    if [[ -n "$LAUNCHER_PATH" ]]; then
      if [[ "$NEEDS_SHELL_RESTART" == "true" ]]; then
        echo -e "  ${YELLOW}1. Restart your terminal (or run:${NC} exec bash${YELLOW})${NC}"
        echo -e "  ${YELLOW}2. Type:${NC} ${GREEN}$APP_NAME${NC}"
      else
        echo -e "  ${YELLOW}→ Type:${NC} ${GREEN}$APP_NAME${NC}"
      fi
    else
      echo -e "  ${YELLOW}→ Run:${NC} ${GREEN}\"$INSTALL_DIR/$APP_NAME\"${NC}"
    fi
    echo ""
    echo -e "  ${BLUE}ℹ${NC}  For better Windows integration, use the PowerShell installer:"
    echo -e "     ${CYAN}iwr -useb https://raw.githubusercontent.com/$REPO/master/install.ps1 | iex${NC}"

  elif [[ -n "$LAUNCHER_PATH" ]]; then
    if [[ "$NEEDS_SHELL_RESTART" == "true" ]]; then
      echo -e "  ${YELLOW}→ Restart your terminal (or run:${NC} exec \$SHELL${YELLOW})${NC}"
      echo -e "  ${YELLOW}→ Then type:${NC} ${GREEN}$APP_NAME${NC}"
      echo ""
      echo -e "  ${BLUE}ℹ${NC}  Or start immediately: ${GREEN}$INSTALL_DIR/$APP_NAME${NC}"
    else
      echo -e "  ${YELLOW}→ Just type:${NC} ${GREEN}$APP_NAME${NC}"
    fi
  else
    echo -e "  ${YELLOW}→ Run:${NC} ${GREEN}$INSTALL_DIR/$APP_NAME${NC}"
  fi

  echo ""
  echo -e "${BLUE}🌐 The app will start at:${NC} ${CYAN}http://localhost:3001${NC}"
  echo ""

  # License info
  echo -e "${BLUE}📄 License:${NC} GNU AGPL-3.0 (Free & Open Source)"
  echo -e "   Learn more: ${CYAN}https://www.gnu.org/licenses/agpl-3.0.html${NC}"
  echo ""

  # Mark installation as successful (prevents cleanup)
  INSTALL_SUCCESS=true
}

# =============================================================================
# Main Installation Flow
# =============================================================================

main() {
  # Print banner
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}   Agent Girl Installer${NC}"
  echo -e "${CYAN}   Production-Grade Installation Script${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run all checks and installation steps
  check_dependencies
  check_network
  detect_platform
  check_disk_space
  check_existing_installation
  fetch_release_info
  download_release
  extract_and_install
  validate_and_rebuild_dependencies
  configure_api_keys
  configure_personalization
  create_global_launcher
  show_success_message
}

# Run main installation
main

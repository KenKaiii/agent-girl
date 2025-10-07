#!/bin/bash
set -e

echo "🚀 Building Agent Girl for All Platforms..."

# Clean previous builds
rm -rf release/
mkdir -p release

# Pre-build CSS (shared across all platforms)
echo "📦 Pre-building CSS..."
bun run build:css

# Build client bundle (shared across all platforms)
echo "📦 Building client bundle..."
bun run build

# Build configurations
# Format: "target|platform|ext"
TARGETS=(
  "bun-darwin-arm64|macos-arm64|"
  "bun-darwin-x64|macos-intel|"
  "bun-windows-x64|windows-x64|.exe"
  "bun-linux-x64|linux-x64|"
)

for target_config in "${TARGETS[@]}"; do
  IFS='|' read -r target platform ext <<< "$target_config"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Building for $platform ($target)..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Create platform directory
  PLATFORM_DIR="release/agent-girl-$platform"
  mkdir -p "$PLATFORM_DIR"

  # Build the binary
  echo "🔨 Compiling binary..."
  # Note: --windows-hide-console can only be used when compiling ON Windows
  # Cross-compilation from macOS/Linux to Windows cannot use this flag
  bun build ./server/server.ts \
    --compile \
    --minify \
    --sourcemap=none \
    --target="$target" \
    --define 'process.env.STANDALONE_BUILD="true"' \
    --external postcss \
    --external @tailwindcss/postcss \
    --external autoprefixer \
    --outfile "$PLATFORM_DIR/agent-girl$ext"

  # Copy client files
  echo "📁 Copying client files..."
  cp -r client/ "$PLATFORM_DIR/client/"

  # Replace raw globals.css with processed version from dist
  echo "📁 Copying processed CSS..."
  cp dist/globals.css "$PLATFORM_DIR/client/globals.css"

  # Copy pre-built client bundle (only the files we need)
  echo "📁 Copying client bundle..."
  mkdir -p "$PLATFORM_DIR/dist"
  cp dist/index.js "$PLATFORM_DIR/dist/"
  cp dist/index.js.map "$PLATFORM_DIR/dist/" 2>/dev/null || true

  # Copy icons
  cp -r client/icons/ "$PLATFORM_DIR/icons/" 2>/dev/null || true

  # Copy audio files
  cp credits.mp3 "$PLATFORM_DIR/" 2>/dev/null || true

  # Copy Claude Code CLI
  echo "📁 Copying Claude Code CLI..."
  cp node_modules/@anthropic-ai/claude-code/cli.js "$PLATFORM_DIR/"
  cp node_modules/@anthropic-ai/claude-code/yoga.wasm "$PLATFORM_DIR/"
  cp -r node_modules/@anthropic-ai/claude-code/vendor "$PLATFORM_DIR/"

  # Copy platform-specific setup files
  if [[ "$platform" == "macos-"* ]]; then
    echo "📁 Copying macOS setup files..."
    cp release-templates/macos/setup.sh "$PLATFORM_DIR/"
    cp release-templates/macos/README.md "$PLATFORM_DIR/"
    chmod +x "$PLATFORM_DIR/setup.sh"
  elif [[ "$platform" == "linux-"* ]]; then
    echo "📁 Copying Linux setup files..."
    cp release-templates/linux/setup.sh "$PLATFORM_DIR/"
    cp release-templates/linux/README.md "$PLATFORM_DIR/"
    chmod +x "$PLATFORM_DIR/setup.sh"
  elif [[ "$platform" == "windows-"* ]]; then
    echo "📁 Copying Windows setup files..."
    cp release-templates/windows/README.md "$PLATFORM_DIR/"
  fi

  # Create .env file with placeholders
  cat > "$PLATFORM_DIR/.env" << 'EOF'
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=your-zai-key-here
EOF

  # Create platform-specific README
  if [[ "$platform" == "windows-"* ]]; then
    cat > "$PLATFORM_DIR/README.txt" << 'EOF'
Agent Girl Application - Windows
=================================

Setup (First Time):
1. Open the .env file in a text editor (Notepad)
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=your-anthropic-api-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key

To Run:
- Double-click 'agent-girl.exe'
- The app will start at http://localhost:3001
- Your browser should open automatically

Data Storage:
- Sessions stored in %USERPROFILE%\Documents\agent-girl-app\
- All your conversations are saved locally

Requirements:
- Windows 10/11 (64-bit)
- Anthropic API key (for Claude models)
- No other dependencies needed!

Troubleshooting:
- If port 3001 is busy, kill the process:
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
- Make sure .env file has your real API key

Enjoy!
EOF
  elif [[ "$platform" == "linux-"* ]]; then
    cat > "$PLATFORM_DIR/README.txt" << 'EOF'
Agent Girl Application - Linux/WSL
===================================

Setup (First Time):
1. Open the .env file in a text editor
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=your-anthropic-api-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key
3. Make the binary executable:
   chmod +x agent-girl

To Run:
- Run: ./agent-girl
- The app will start at http://localhost:3001
- Open http://localhost:3001 in your browser

Data Storage:
- Sessions stored in ~/Documents/agent-girl-app/
- All your conversations are saved locally

Requirements:
- Linux x64 / WSL (Windows Subsystem for Linux)
- Anthropic API key (for Claude models)
- No other dependencies needed!

Troubleshooting:
- If port 3001 is busy, kill the process:
  lsof -ti:3001 | xargs kill -9
- Make sure .env file has your real API key
- For WSL: Access from Windows browser at http://localhost:3001

Enjoy!
EOF
  else
    # macOS
    cat > "$PLATFORM_DIR/README.txt" << 'EOF'
Agent Girl Application - macOS
==============================

Setup (First Time):
1. Open the .env file in a text editor
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=your-anthropic-api-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key

To Run:
- Double-click the 'agent-girl' file
- If you see a security warning:
  • Right-click > Open (first time only)
  • Or go to System Preferences > Security & Privacy > Allow
- The app will start at http://localhost:3001
- Your browser should open automatically

Data Storage:
- Sessions stored in ~/Documents/agent-girl-app/
- All your conversations are saved locally

Requirements:
- macOS 11+ (Big Sur or later)
- Anthropic API key (for Claude models)
- No other dependencies needed!

Troubleshooting:
- If port 3001 is busy, kill the process: lsof -ti:3001 | xargs kill -9
- Make sure .env file has your real API key
- Security warning: Right-click > Open (don't double-click first time)

Enjoy!
EOF
  fi

  echo "✅ $platform build complete!"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All platform builds completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Release packages:"
for target_config in "${TARGETS[@]}"; do
  IFS='|' read -r target platform ext <<< "$target_config"
  echo "  • release/agent-girl-$platform/"
done
echo ""
echo "To create distribution archives, run:"
echo "  cd release"
echo "  zip -r agent-girl-macos-arm64.zip agent-girl-macos-arm64/"
echo "  zip -r agent-girl-macos-intel.zip agent-girl-macos-intel/"
echo "  zip -r agent-girl-windows-x64.zip agent-girl-windows-x64/"
echo "  zip -r agent-girl-linux-x64.zip agent-girl-linux-x64/"
echo ""

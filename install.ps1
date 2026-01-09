# =============================================================================
# Agent Girl Windows Installer - Production Grade
# =============================================================================
# Run with: iwr -useb https://raw.githubusercontent.com/KenKaiii/agent-girl/master/install.ps1 | iex
#
# Handles all edge cases, validates dependencies, verifies downloads,
# and provides comprehensive error handling with rollback support.
# =============================================================================

$ErrorActionPreference = "Stop"

# Configuration
$REPO = "KenKaiii/agent-girl"
$APP_NAME = "agent-girl"
$MIN_DISK_SPACE_GB = 0.1
$INSTALL_DIR = "$env:LOCALAPPDATA\Programs\agent-girl-app"

# Global state for cleanup
$script:TempFiles = @()
$script:InstallSuccess = $false

# =============================================================================
# Utility Functions
# =============================================================================

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Info { Write-ColorMessage "ℹ $args" "Cyan" }
function Write-Success { Write-ColorMessage "✓ $args" "Green" }
function Write-Warning { Write-ColorMessage "⚠ $args" "Yellow" }
function Write-Error { Write-ColorMessage "❌ $args" "Red" }

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
    Write-ColorMessage "   $Title" "Cyan"
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
    Write-Host ""
}

function Invoke-Cleanup {
    if (-not $script:InstallSuccess) {
        Write-Warning "Installation interrupted or failed. Cleaning up..."
        foreach ($file in $script:TempFiles) {
            if (Test-Path $file) {
                Remove-Item $file -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Invoke-FatalError {
    param(
        [string]$Message,
        [string]$Suggestion = ""
    )
    Write-Error $Message
    Write-Host ""
    if ($Suggestion) {
        Write-ColorMessage "Suggestion: " "Yellow" -NoNewline
        Write-Host $Suggestion
        Write-Host ""
    }
    Invoke-Cleanup
    exit 1
}

# Register cleanup on exit
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Invoke-Cleanup }

# =============================================================================
# Dependency Checks
# =============================================================================

function Test-Dependencies {
    Write-Section "Checking System Dependencies"

    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        Invoke-FatalError "PowerShell 5.0 or later is required (found $psVersion)" `
            "Upgrade PowerShell: https://docs.microsoft.com/powershell/"
    }
    Write-Success "PowerShell $psVersion"

    # Check .NET for Invoke-WebRequest
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Success ".NET framework compatible"
    } catch {
        Invoke-FatalError "Failed to enable TLS 1.2" `
            "Your .NET framework may be outdated"
    }

    # Check Expand-Archive cmdlet
    if (-not (Get-Command Expand-Archive -ErrorAction SilentlyContinue)) {
        Invoke-FatalError "Expand-Archive cmdlet not available" `
            "Upgrade PowerShell to version 5.0 or later"
    }
    Write-Success "Archive extraction available"
}

# =============================================================================
# Network Connectivity Check
# =============================================================================

function Test-NetworkConnectivity {
    Write-Section "Checking Network Connectivity"

    # Test basic internet connectivity
    try {
        $null = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Internet connection verified"
    } catch {
        Invoke-FatalError "No internet connection detected" `
            "Please check your network connection and try again"
    }

    # Test GitHub API availability
    try {
        $null = Invoke-WebRequest -Uri "https://api.github.com" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Success "GitHub API accessible"
    } catch {
        Invoke-FatalError "Cannot reach GitHub API" `
            "GitHub may be down. Check https://www.githubstatus.com/"
    }
}

# =============================================================================
# Platform Detection
# =============================================================================

function Get-PlatformInfo {
    Write-Section "Detecting Platform"

    # Detect architecture
    $arch = $env:PROCESSOR_ARCHITECTURE
    switch ($arch) {
        "AMD64" {
            $script:Platform = "windows-x64"
            $script:ArchName = "x64"
        }
        "ARM64" {
            $script:Platform = "windows-arm64"
            $script:ArchName = "ARM64"
        }
        default {
            Invoke-FatalError "Unsupported architecture: $arch" `
                "This installer supports x64 and ARM64 Windows only"
        }
    }

    # Check Windows version
    $osInfo = Get-CimInstance Win32_OperatingSystem
    $osVersion = $osInfo.Version
    Write-Success "Windows $osVersion ($script:ArchName)"
    Write-Success "Install location: $INSTALL_DIR"
}

# =============================================================================
# Check Disk Space
# =============================================================================

function Test-DiskSpace {
    Write-Section "Checking Disk Space"

    try {
        $drive = (Get-Item $env:LOCALAPPDATA).PSDrive.Name + ":"
        $disk = Get-PSDrive -Name $drive.TrimEnd(':')
        $availableGB = [math]::Round($disk.Free / 1GB, 2)

        if ($availableGB -lt $MIN_DISK_SPACE_GB) {
            Invoke-FatalError "Insufficient disk space (${availableGB}GB available, ${MIN_DISK_SPACE_GB}GB required)" `
                "Free up some disk space and try again"
        }

        Write-Success "Sufficient disk space (${availableGB}GB available)"
    } catch {
        Write-Warning "Could not check disk space, proceeding anyway..."
    }
}

# =============================================================================
# Check for Existing Installation
# =============================================================================

function Test-ExistingInstallation {
    if (Test-Path $INSTALL_DIR) {
        Write-Section "Existing Installation Detected"

        # Check if Agent Girl is running on port 3001
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-Warning "Agent Girl appears to be running (port 3001 in use)"
                Write-Host ""
                $stopRunning = Read-Host "Stop the running instance and upgrade? [y/N]"

                if ($stopRunning -match '^[Yy]$') {
                    # Try to kill processes on port 3001
                    try {
                        $processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
                            Select-Object -ExpandProperty OwningProcess -Unique |
                            ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }

                        foreach ($proc in $processes) {
                            Stop-Process -Id $proc.Id -Force
                        }

                        Start-Sleep -Seconds 1
                        Write-Success "Stopped running instance"
                    } catch {
                        Write-Warning "Could not automatically stop the process. Please close Agent Girl manually."
                    }
                } else {
                    Invoke-FatalError "Installation cancelled" `
                        "Stop Agent Girl manually and try again"
                }
            }
        } catch {
            # Port check failed, continue anyway
        }

        # Backup existing .env if present
        if (Test-Path "$INSTALL_DIR\.env") {
            Write-Info "Backing up existing .env configuration..."
            Copy-Item "$INSTALL_DIR\.env" "$INSTALL_DIR\.env.backup" -Force
            $script:EnvBackupCreated = $true
        }

        Write-Info "This will upgrade your existing installation"
        Write-Host ""
    } else {
        Write-Section "New Installation"
    }
}

# =============================================================================
# Fetch Latest Release
# =============================================================================

function Get-LatestRelease {
    Write-Section "Fetching Latest Release"

    Write-Info "Querying GitHub API..."

    # Fetch with retry logic
    $maxRetries = 3
    $retryCount = 0
    $release = $null

    while ($retryCount -lt $maxRetries) {
        try {
            $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" `
                -TimeoutSec 30 -ErrorAction Stop
            break
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Warning "Failed to fetch release info. Retrying ($retryCount/$maxRetries)..."
                Start-Sleep -Seconds 2
            }
        }
    }

    if (-not $release) {
        Invoke-FatalError "Failed to fetch release information after $maxRetries attempts" `
            "Check your internet connection or try again later"
    }

    # Extract version and download URL
    $script:Version = $release.tag_name
    $asset = $release.assets | Where-Object { $_.name -like "*$script:Platform.zip" }
    $script:DownloadUrl = $asset.browser_download_url

    # Get checksum file if available
    $checksumAsset = $release.assets | Where-Object { $_.name -like "*checksums.txt" }
    $script:ChecksumUrl = $checksumAsset.browser_download_url

    if (-not $script:DownloadUrl) {
        Invoke-FatalError "No release found for platform: $script:Platform" `
            "This platform may not be supported yet. Check https://github.com/$REPO/releases"
    }

    Write-Success "Latest version: $script:Version"
    Write-Success "Release found for $script:Platform"
}

# =============================================================================
# Download Release
# =============================================================================

function Get-ReleasePackage {
    Write-Section "Downloading Agent Girl $script:Version"

    $script:DownloadPath = "$env:TEMP\$APP_NAME-$script:Platform-$PID.zip"
    $script:TempFiles += $script:DownloadPath

    Write-Info "Downloading from GitHub..."
    Write-ColorMessage "   $script:DownloadUrl" "Blue"
    Write-Host ""

    try {
        # Download with progress
        $ProgressPreference = 'SilentlyContinue'  # Faster download
        Invoke-WebRequest -Uri $script:DownloadUrl -OutFile $script:DownloadPath -TimeoutSec 300 -ErrorAction Stop
        $ProgressPreference = 'Continue'

        # Verify download size
        $fileInfo = Get-Item $script:DownloadPath
        if ($fileInfo.Length -lt 1000000) {  # Less than 1MB is suspicious
            Invoke-FatalError "Downloaded file is suspiciously small ($($fileInfo.Length) bytes)" `
                "The download may be corrupted. Try again"
        }

        $sizeText = "{0:N2} MB" -f ($fileInfo.Length / 1MB)
        Write-Host ""
        Write-Success "Download complete ($sizeText)"

        # Download and verify checksum if available
        if ($script:ChecksumUrl) {
            Write-Info "Verifying download integrity..."

            $checksumPath = "$env:TEMP\$APP_NAME-checksums-$PID.txt"
            $script:TempFiles += $checksumPath

            try {
                Invoke-WebRequest -Uri $script:ChecksumUrl -OutFile $checksumPath -TimeoutSec 30 -ErrorAction Stop

                # Extract expected checksum for our platform
                $checksumContent = Get-Content $checksumPath
                $expectedChecksum = ($checksumContent | Select-String "$APP_NAME-$script:Platform.zip").Line.Split(' ')[0]

                if ($expectedChecksum) {
                    # Calculate actual checksum
                    $actualChecksum = (Get-FileHash -Path $script:DownloadPath -Algorithm SHA256).Hash.ToLower()

                    if ($actualChecksum -eq $expectedChecksum.ToLower()) {
                        Write-Success "Checksum verified"
                    } else {
                        Invoke-FatalError "Checksum mismatch! Downloaded file may be corrupted or tampered with" `
                            "Try downloading again or report this issue"
                    }
                } else {
                    Write-Warning "Checksum not found for $script:Platform, skipping verification"
                }
            } catch {
                Write-Warning "Could not download checksums, skipping verification"
            }
        }
    } catch {
        Invoke-FatalError "Download failed: $($_.Exception.Message)" `
            "Check your internet connection and try again"
    }
}

# =============================================================================
# Extract and Install
# =============================================================================

function Install-Application {
    Write-Section "Installing Agent Girl"

    # Create install directory
    Write-Info "Creating installation directory..."
    try {
        New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
    } catch {
        Invoke-FatalError "Failed to create install directory" `
            "Check that you have write permissions to $INSTALL_DIR"
    }

    # Extract archive
    Write-Info "Extracting files..."

    # The zip contains a directory named agent-girl-{platform}
    $extractPath = "$env:TEMP\$APP_NAME-$script:Platform"
    $script:TempFiles += $extractPath

    try {
        Expand-Archive -Path $script:DownloadPath -DestinationPath $env:TEMP -Force -ErrorAction Stop
    } catch {
        Invoke-FatalError "Extraction failed: $($_.Exception.Message)" `
            "The downloaded file may be corrupted. Try again"
    }

    # Verify extraction
    if (-not (Test-Path $extractPath)) {
        Invoke-FatalError "Extraction produced unexpected structure" `
            "This may be a packaging issue. Please report it"
    }

    # Move files to installation directory
    Write-Info "Installing files to $INSTALL_DIR..."

    try {
        # Remove old files but preserve .env
        Get-ChildItem -Path $INSTALL_DIR -Exclude '.env', '.env.backup' -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

        # Move new files
        Get-ChildItem -Path $extractPath | Move-Item -Destination $INSTALL_DIR -Force
    } catch {
        Invoke-FatalError "Failed to install files: $($_.Exception.Message)" `
            "Check disk space and permissions"
    }

    # Restore .env if we backed it up
    if ($script:EnvBackupCreated -and (Test-Path "$INSTALL_DIR\.env.backup")) {
        Write-Info "Restoring your API key configuration..."
        Move-Item "$INSTALL_DIR\.env.backup" "$INSTALL_DIR\.env" -Force
    }

    Write-Success "Installation complete"
}

# =============================================================================
# API Key Configuration
# =============================================================================

function Set-ApiConfiguration {
    Write-Section "API Key Setup"

    # Check for existing real keys (not placeholders)
    $existingAnthropic = ""
    $existingZai = ""

    if (Test-Path "$INSTALL_DIR\.env") {
        $envLines = Get-Content "$INSTALL_DIR\.env"
        $anthroLine = $envLines | Where-Object { $_ -match "^ANTHROPIC_API_KEY=" -and $_ -notmatch "sk-ant-your-key-here" }
        $zaiLine = $envLines | Where-Object { $_ -match "^ZAI_API_KEY=" -and $_ -notmatch "your-zai-key-here" }

        if ($anthroLine) { $existingAnthropic = ($anthroLine -split '=', 2)[1] }
        if ($zaiLine) { $existingZai = ($zaiLine -split '=', 2)[1] }

        # If both keys are configured, skip
        if ($existingAnthropic -and $existingZai) {
            Write-Success "Both API keys already configured"
            return
        }

        # If only one is configured, inform user
        if ($existingAnthropic -and -not $existingZai) {
            Write-Info "Anthropic API already configured"
            Write-ColorMessage "  ✓ " "Green" -NoNewline; Write-Host "Available: Claude Sonnet 4.5"
            Write-ColorMessage "  ✗ " "Yellow" -NoNewline; Write-Host "Unavailable: GLM-4.7 (needs Z.AI API key)"
            Write-Host ""
        } elseif (-not $existingAnthropic -and $existingZai) {
            Write-Info "Z.AI API already configured"
            Write-ColorMessage "  ✓ " "Green" -NoNewline; Write-Host "Available: GLM-4.7"
            Write-ColorMessage "  ✗ " "Yellow" -NoNewline; Write-Host "Unavailable: Claude Sonnet 4.5 (needs Anthropic API key)"
            Write-Host ""
        }
    }

    # Use existing keys as defaults
    $anthropicKey = $existingAnthropic
    $zaiKey = $existingZai

    # If one key exists, offer to add the missing one
    if ($existingAnthropic -and -not $existingZai) {
        $addZai = Read-Host "Add Z.AI API key for full model access? [y/N]"
        if ($addZai -match '^[Yy]$') {
            Write-Host ""
            Write-ColorMessage "📝 Z.AI API Setup" "Cyan"
            Write-Host "Get your API key from: https://z.ai"
            Write-Host ""
            $zaiKey = Read-Host "Enter your Z.AI API key"
        }
    } elseif (-not $existingAnthropic -and $existingZai) {
        $addAnthropic = Read-Host "Add Anthropic API key for full model access? [y/N]"
        if ($addAnthropic -match '^[Yy]$') {
            Write-Host ""
            Write-ColorMessage "📝 Anthropic API Setup" "Cyan"
            Write-Host "Get your API key from: https://console.anthropic.com/"
            Write-Host ""
            $anthropicKey = Read-Host "Enter your Anthropic API key"
        }
    } else {
        # No existing keys, show full menu
        Write-Host "Which API provider(s) do you want to use?"
        Write-Host ""
        Write-ColorMessage "  1) " "Yellow" -NoNewline; Write-Host "Anthropic API only (Claude models)"
        Write-ColorMessage "  2) " "Yellow" -NoNewline; Write-Host "Z.AI API only (GLM models)"
        Write-ColorMessage "  3) " "Yellow" -NoNewline; Write-Host "Both APIs (full model access)"
        Write-ColorMessage "  4) " "Yellow" -NoNewline; Write-Host "Skip (configure later)"
        Write-Host ""

        $apiChoice = Read-Host "Enter choice [1-4]"

        switch ($apiChoice) {
            "1" {
                Write-Host ""
                Write-ColorMessage "📝 Anthropic API Setup" "Cyan"
                Write-Host "Get your API key from: https://console.anthropic.com/"
                Write-Host ""
                $anthropicKey = Read-Host "Enter your Anthropic API key"
            }
            "2" {
                Write-Host ""
                Write-ColorMessage "📝 Z.AI API Setup" "Cyan"
                Write-Host "Get your API key from: https://z.ai"
                Write-Host ""
                $zaiKey = Read-Host "Enter your Z.AI API key"
            }
            "3" {
                Write-Host ""
                Write-ColorMessage "📝 Anthropic API Setup" "Cyan"
                Write-Host "Get your API key from: https://console.anthropic.com/"
                Write-Host ""
                $anthropicKey = Read-Host "Enter your Anthropic API key"
                Write-Host ""
                Write-ColorMessage "📝 Z.AI API Setup" "Cyan"
                Write-Host "Get your API key from: https://z.ai"
                Write-Host ""
                $zaiKey = Read-Host "Enter your Z.AI API key"
            }
            "4" {
                Write-Host ""
                Write-Warning "Skipping API configuration"
                Write-Host "You'll need to edit $INSTALL_DIR\.env before running Agent Girl"
                return
            }
            default {
                Write-Host ""
                Write-Warning "Invalid choice. Skipping API configuration."
                return
            }
        }
    }

    # Set defaults if not provided (preserve existing keys if set)
    if (-not $anthropicKey) { $anthropicKey = "sk-ant-your-key-here" }
    if (-not $zaiKey) { $zaiKey = "your-zai-key-here" }

    # Create .env file
    $envContent = @"
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=$anthropicKey

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=$zaiKey
"@

    $envContent | Out-File -FilePath "$INSTALL_DIR\.env" -Encoding UTF8 -Force

    Write-Host ""
    Write-Success "API keys configured"
}

# =============================================================================
# Personalization Setup
# =============================================================================

function Set-Personalization {
    # Skip if user-config.json already exists
    if (Test-Path "$INSTALL_DIR\data\user-config.json") {
        Write-Section "Personalization"
        Write-Success "Existing personalization preserved"
        return
    }

    Write-Section "Personalization (Optional)"

    Write-Host "Agent Girl can personalize your experience with your name."
    Write-Host ""
    $userName = Read-Host "Enter your name (or press Enter to skip)"

    if ($userName) {
        # Parse name into firstName and lastName
        $nameParts = $userName.Trim() -split '\s+' | Where-Object { $_ }
        $firstName = $nameParts[0]
        $lastName = if ($nameParts.Length -gt 1) { $nameParts[1..($nameParts.Length-1)] -join ' ' } else { $null }

        # Create data directory
        New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\data" | Out-Null

        # Create user-config.json
        if ($lastName) {
            $userConfig = @{
                firstName = $firstName
                lastName = $lastName
            } | ConvertTo-Json
        } else {
            $userConfig = @{
                firstName = $firstName
            } | ConvertTo-Json
        }

        $userConfig | Out-File -FilePath "$INSTALL_DIR\data\user-config.json" -Encoding UTF8 -Force

        Write-Host ""
        Write-Success "Personalization configured"
        Write-Info "Your name will appear in the interface as: $userName"
    } else {
        Write-Info "Skipped personalization (you can run 'agent-girl --setup' later)"
    }
}

# =============================================================================
# Add to PATH
# =============================================================================

function Add-ToPath {
    Write-Section "Setting Up Global Command"

    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($currentPath -notlike "*$INSTALL_DIR*") {
        try {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$INSTALL_DIR", "User")
            Write-Success "Added to PATH"
            $script:NeedsRestart = $true
        } catch {
            Write-Warning "Could not add to PATH automatically"
            Write-Info "You can run: $INSTALL_DIR\$APP_NAME.exe"
            $script:NeedsRestart = $false
        }
    } else {
        Write-Success "Already in PATH"
        $script:NeedsRestart = $false
    }
}

# =============================================================================
# Success Message
# =============================================================================

function Show-SuccessMessage {
    Write-Section "Installation Successful! 🎉"

    Write-ColorMessage "Agent Girl $script:Version has been installed successfully!" "Green"
    Write-Host ""
    Write-ColorMessage "📍 Installation Location:" "Cyan"
    Write-Host "   $INSTALL_DIR"
    Write-Host ""

    Write-ColorMessage "🚀 How to Start Agent Girl:" "Cyan"
    Write-Host ""

    if ($script:NeedsRestart) {
        Write-ColorMessage "  1. Restart PowerShell (or open a new window)" "Yellow"
        Write-ColorMessage "  2. Type: " "Yellow" -NoNewline
        Write-ColorMessage "$APP_NAME" "Green"
        Write-Host ""
        Write-ColorMessage "  ℹ  Or start immediately: " "Cyan" -NoNewline
        Write-ColorMessage "$INSTALL_DIR\$APP_NAME.exe" "Green"
    } else {
        Write-ColorMessage "  → Just type: " "Yellow" -NoNewline
        Write-ColorMessage "$APP_NAME" "Green"
        Write-Host ""
        Write-ColorMessage "  → Or double-click: " "Yellow" -NoNewline
        Write-Host "$INSTALL_DIR\$APP_NAME.exe"
    }

    Write-Host ""
    Write-ColorMessage "🌐 The app will start at: " "Cyan" -NoNewline
    Write-ColorMessage "http://localhost:3001" "Blue"
    Write-Host ""

    Write-ColorMessage "📄 License: " "Cyan" -NoNewline
    Write-Host "GNU AGPL-3.0 (Free & Open Source)"
    Write-ColorMessage "   Learn more: " "Cyan" -NoNewline
    Write-ColorMessage "https://www.gnu.org/licenses/agpl-3.0.html" "Blue"
    Write-Host ""

    # Mark installation as successful (prevents cleanup)
    $script:InstallSuccess = $true
}

# =============================================================================
# Main Installation Flow
# =============================================================================

function Start-Installation {
    # Print banner
    Write-Host ""
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
    Write-ColorMessage "   Agent Girl Installer" "Cyan"
    Write-ColorMessage "   Production-Grade Installation Script" "Cyan"
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
    Write-Host ""

    try {
        # Run all checks and installation steps
        Test-Dependencies
        Test-NetworkConnectivity
        Get-PlatformInfo
        Test-DiskSpace
        Test-ExistingInstallation
        Get-LatestRelease
        Get-ReleasePackage
        Install-Application
        Set-ApiConfiguration
        Set-Personalization
        Add-ToPath
        Show-SuccessMessage
    } catch {
        Invoke-FatalError "Unexpected error: $($_.Exception.Message)" `
            "Please report this issue at https://github.com/$REPO/issues"
    }
}

# Run main installation
Start-Installation

#!/bin/bash
# =============================================================================
# Info JSON Importer — Setup Script
# =============================================================================
# © David Smith 2026 · david@maxprovider.net
#
# This script sets your Stash API key in the plugin, then copies the plugin
# files into your Stash plugins directory.
#
# Run this from the folder containing the plugin files:
#   chmod +x setup.sh
#   ./setup.sh
# =============================================================================

set -e

SCRIPT_DIR="$(dirname "$(readlink -f "${0}")")"
PLUGIN_FILE="$SCRIPT_DIR/infoJsonImporter.py"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         Info JSON Importer — Setup                   ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  © David Smith 2026 · david@maxprovider.net          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Check plugin files are present ────────────────────────────────────────────
for f in infoJsonImporter.py infoJsonImporter.yml; do
    if [ ! -f "$SCRIPT_DIR/$f" ]; then
        echo "❌ Required file not found: $f"
        echo "   Make sure all plugin files are in the same folder as setup.sh"
        exit 1
    fi
done
echo "✅ Plugin files found"

# ── Ask for Stash API key ─────────────────────────────────────────────────────
echo ""
echo "Your Stash API key is needed so the plugin can connect to Stash."
echo "To generate one: Stash → Settings → Security → API Key → Generate"
echo ""
read -p "Enter your Stash API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ No API key entered. Exiting."
    exit 1
fi

# ── Write API key into the plugin script ──────────────────────────────────────
python3 - << PYEOF
import re

with open('$PLUGIN_FILE', 'r') as f:
    content = f.read()

# Replace the API_KEY line with the provided key
new_content = re.sub(
    r'^API_KEY = ".*"',
    'API_KEY = "$API_KEY"',
    content,
    flags=re.MULTILINE
)

with open('$PLUGIN_FILE', 'w') as f:
    f.write(new_content)

print("✅ API key written to plugin")
PYEOF

# ── Ask for Stash plugins directory ──────────────────────────────────────────
echo ""
echo "Where is your Stash plugins folder?"
echo "Default is: $HOME/.stash/plugins"
echo "(Press Enter to use the default, or type the full path)"
echo ""
read -p "Stash plugins folder: " PLUGINS_DIR

if [ -z "$PLUGINS_DIR" ]; then
    PLUGINS_DIR="$HOME/.stash/plugins"
fi

# Expand ~ if user typed it literally
PLUGINS_DIR="${PLUGINS_DIR/#\~/$HOME}"

if [ ! -d "$PLUGINS_DIR" ]; then
    echo ""
    echo "Directory not found: $PLUGINS_DIR"
    read -p "Create it? (y/n): " CREATE_DIR
    if [ "$CREATE_DIR" = "y" ] || [ "$CREATE_DIR" = "Y" ]; then
        mkdir -p "$PLUGINS_DIR"
        echo "✅ Created $PLUGINS_DIR"
    else
        echo "❌ Cannot continue without a valid plugins directory."
        exit 1
    fi
fi

# ── Copy plugin files ─────────────────────────────────────────────────────────
DEST="$PLUGINS_DIR/infoJsonImporter"
mkdir -p "$DEST"
cp "$SCRIPT_DIR/infoJsonImporter.py"  "$DEST/"
cp "$SCRIPT_DIR/infoJsonImporter.yml" "$DEST/"
echo "✅ Plugin files copied to $DEST"

# ── Install Python dependency ─────────────────────────────────────────────────
echo ""
echo "Installing required Python library (requests)..."
pip install requests --break-system-packages -q
echo "✅ Dependencies installed"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Open Stash in your browser"
echo "  2. Go to Settings → Plugins"
echo "  3. Click Reload Plugins"
echo "  4. Go to Settings → Tasks"
echo "  5. Find Info JSON Importer"
echo "  6. Run Dry Run first to preview"
echo "  7. Run Import Info JSON to apply"
echo "══════════════════════════════════════════════════════"
echo ""

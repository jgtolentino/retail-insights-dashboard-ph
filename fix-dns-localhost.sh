#!/bin/bash
# Fix DNS localhost resolution issue

echo "🔧 Fixing localhost DNS Resolution"
echo "=================================="
echo ""
echo "This script will add localhost entries to /etc/hosts"
echo "You will be prompted for your sudo password."
echo ""

# Check if localhost already exists in hosts file
if grep -q "^127.0.0.1.*localhost" /etc/hosts; then
    echo "✅ localhost entry already exists in /etc/hosts"
    exit 0
fi

echo "Adding localhost entries to /etc/hosts..."
echo ""

# Add the localhost entries
echo -e "127.0.0.1\tlocalhost\n::1\tlocalhost" | sudo tee -a /etc/hosts

# Verify the fix
echo ""
echo "Verifying fix..."
if ping -c 1 localhost > /dev/null 2>&1; then
    echo "✅ Success! localhost now resolves correctly"
    echo ""
    echo "You can now run: ./run-complete-qa.sh"
else
    echo "❌ Failed to resolve localhost. Please check /etc/hosts manually"
fi
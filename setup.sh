#!/bin/bash

# setup.sh - Install dependencies for Mikeneko bot

echo "📦 Installing/Updating dependencies..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js first."
    exit 1
fi

# Install standard dependencies
echo "⬇️  Running npm install..."
npm install

# Fix better-sqlite3 for newer Node versions
echo "🔧 Rebuilding better-sqlite3 for current Node version..."
npm install better-sqlite3@latest --save

echo "✅ Setup complete! You can now run the bot using ./run.sh"

#!/bin/bash

# run.sh - Run Mikeneko bot locally

LAVALINK_PORT=2333
LAVALINK_JAR="Lavalink.jar"

# Function to check if a port is in use
is_port_in_use() {
    lsof -i :$1 > /dev/null
}

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Error: Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check for Lavalink jar
if [ ! -f "$LAVALINK_JAR" ]; then
    echo "❌ Error: $LAVALINK_JAR not found!"
    echo "Please download it or ensure you are in the correct directory."
    exit 1
fi

echo "🎵 Checking Lavalink status..."

if is_port_in_use $LAVALINK_PORT; then
    echo "✅ Lavalink is already running on port $LAVALINK_PORT."
else
    echo "🚀 Starting Lavalink..."
    # Start Lavalink in the background and redirect output
    java -jar $LAVALINK_JAR > lavalink.log 2>&1 &
    LAVALINK_PID=$!
    echo "⏳ Waiting for Lavalink to be ready..."
    
    # Wait loop
    ATTEMPTS=0
    MAX_ATTEMPTS=30
    while ! is_port_in_use $LAVALINK_PORT; do
        sleep 1
        ATTEMPTS=$((ATTEMPTS+1))
        if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
            echo "❌ Lavalink failed to start in time. Check lavalink.log."
            exit 1
        fi
    done
    echo "✅ Lavalink started (PID: $LAVALINK_PID)"
fi

echo "🤖 Starting Mikeneko Bot..."
npm run dev

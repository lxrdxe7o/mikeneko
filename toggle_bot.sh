#!/bin/bash

# toggle_bot.sh - Toggle Mikeneko Bot Service

SERVICE="mikeneko.service"

if systemctl --user is-active --quiet "$SERVICE"; then
    echo "🛑 Stopping Mikeneko Bot..."
    systemctl --user stop "$SERVICE"
    notify-send "Mikeneko Bot" "🛑 Bot stopped" -u low -i dialogue-information
else
    echo "🚀 Starting Mikeneko Bot..."
    systemctl --user start "$SERVICE"
    notify-send "Mikeneko Bot" "🚀 Bot started" -u normal -i dialogue-information
fi

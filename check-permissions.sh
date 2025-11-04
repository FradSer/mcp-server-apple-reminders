#!/bin/bash

# macOS权限检查和申请脚本
# 用于Apple Reminders MCP Server

echo "🔐 检查 Apple Reminders MCP Server 权限..."

# 检查EventKit权限
echo "📅 检查 EventKit (提醒) 权限..."
EVENTKIT_CHECK=$(./dist/swift/bin/GetReminders --check 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ EventKit 权限已授予"
else
    echo "❌ EventKit 权限被拒绝或需要授权"
    echo "请在系统设置 > 隐私与安全性 > 提醒事项 中授予权限"
    echo "授权后请重新运行此脚本"
    exit 1
fi

# 检查AppleScript权限
echo "🤖 检查 AppleScript 自动化权限..."
APPLESCRIPT_CHECK=$(osascript -e 'tell application "Reminders" to get the name of every list' 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ AppleScript 自动化权限已授予"
    echo "可用的提醒列表: $APPLESCRIPT_CHECK"
else
    echo "❌ AppleScript 自动化权限被拒绝或需要授权"
    echo "请在系统设置 > 隐私与安全性 > 自动化 中授予权限"
    echo "授权后请重新运行此脚本"
    exit 1
fi

echo ""
echo "🎉 所有权限检查通过！"
echo "📱 Apple Reminders MCP Server 现在可以正常运行"
echo ""
echo "启动命令: npx $HOME/.mcp-server/mcp-server-apple-reminders"
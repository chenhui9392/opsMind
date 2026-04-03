#!/bin/bash

# macOS 公证配置脚本
# 首次公证前需要运行此脚本配置密码项

echo "📝 macOS 公证配置"
echo ""
echo "请准备以下信息："
echo "  1. Apple ID (如: your-email@example.com)"
echo "  2. Team ID: CG65HC99F7"
echo "  3. App 专用密码 (在 https://appleid.apple.com 生成)"
echo ""

read -p "请输入 Apple ID: " APPLE_ID
read -p "请输入 App 专用密码: " APP_PASSWORD

echo ""
echo "🔐 配置公证密码项..."

xcrun notarytool store-credentials "AC_PASSWORD" \
  --apple-id "dev.ios@yoniev.com" \
  --team-id "CG65HC99F7" \
  --password "gfqa-yrot-shfg-pjgf"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 公证配置完成！"
    echo ""
    echo "现在可以运行以下命令进行打包和公证："
    echo "  npm run mac:all"
else
    echo ""
    echo "❌ 配置失败，请检查输入信息"
fi

#!/usr/bin/env node

/**
 * macOS 应用打包、签名和公证脚本
 * 适用于独立分发（不上架 Mac App Store）
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置项
const CONFIG = {
  appName: 'AIT Claw',
  appBundleId: 'com.opsmin.app',
  certificateName: 'Suzhou Uni Technology Co.,Ltd. (CG65HC99F7)',
  releaseDir: path.join(__dirname, '..', 'release'),
  keychainProfile: 'AC_PASSWORD', // 公证密码项名称
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`执行: ${command}`, 'cyan');
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`命令执行失败: ${command}`, 'red');
    throw error;
  }
}

function checkCertificate() {
  log('\n🔍 检查签名证书...', 'bright');
  try {
    const result = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
    if (result.includes(CONFIG.certificateName)) {
      log('✅ 证书已找到', 'green');
      return true;
    }
    log('❌ 证书未找到，请确保证书已安装到钥匙串', 'red');
    return false;
  } catch (error) {
    log('❌ 检查证书失败', 'red');
    return false;
  }
}

function checkProvisioningProfile() {
  // 独立分发不需要 provisioning profile
  log('✅ 独立分发模式，无需 Provisioning Profile', 'green');
  return true;
}

function buildApp() {
  log('\n📦 开始打包应用...', 'bright');
  
  // 设置环境变量
  process.env.CSC_NAME = CONFIG.certificateName;
  
  // 执行打包
  exec('npm run build');
  exec('npx electron-builder --mac');
  
  log('✅ 打包完成', 'green');
}

function verifySignature() {
  log('\n🔐 验证代码签名...', 'bright');
  
  const appPath = path.join(CONFIG.releaseDir, 'mac', `${CONFIG.appName}.app`);
  
  if (!fs.existsSync(appPath)) {
    log(`❌ 未找到应用: ${appPath}`, 'red');
    return false;
  }
  
  try {
    // 验证签名
    exec(`codesign --verify --deep --strict --verbose=2 "${appPath}"`);
    
    // 显示签名信息
    const signInfo = execSync(`codesign -dv --verbose=4 "${appPath}"`, { encoding: 'utf8' });
    log('签名信息:', 'cyan');
    console.log(signInfo);
    
    log('✅ 签名验证通过', 'green');
    return true;
  } catch (error) {
    log('❌ 签名验证失败', 'red');
    return false;
  }
}

function notarizeApp() {
  log('\n📋 开始公证流程...', 'bright');
  
  const appPath = path.join(CONFIG.releaseDir, 'mac', `${CONFIG.appName}.app`);
  const zipPath = path.join(CONFIG.releaseDir, `${CONFIG.appName}.zip`);
  
  if (!fs.existsSync(appPath)) {
    log(`❌ 未找到应用: ${appPath}`, 'red');
    return false;
  }
  
  try {
    // 创建压缩包
    log('📦 创建上传压缩包...', 'yellow');
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    exec(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`);
    
    // 提交公证
    log('📤 提交公证...', 'yellow');
    exec(`xcrun notarytool submit "${zipPath}" --keychain-profile "${CONFIG.keychainProfile}" --wait`);
    
    // Staple 公证结果
    log('📌 Staple 公证结果...', 'yellow');
    exec(`xcrun stapler staple "${appPath}"`);
    
    // 验证公证
    log('🔍 验证公证...', 'yellow');
    exec(`xcrun stapler validate "${appPath}"`);
    
    // 清理临时文件
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    log('✅ 公证完成', 'green');
    return true;
  } catch (error) {
    log('❌ 公证失败', 'red');
    log('提示: 如果是首次公证，请先配置密码项:', 'yellow');
    log(`xcrun notarytool store-credentials "${CONFIG.keychainProfile}" --apple-id "your-apple-id@example.com" --team-id "CG65HC99F7" --password "app-specific-password"`, 'cyan');
    return false;
  }
}

function showHelp() {
  console.log(`
${colors.bright}macOS 应用打包脚本${colors.reset}

用法: node build-mac.js [命令]

命令:
  build       仅打包应用（包含签名）
  sign        验证签名
  notarize    公证已打包的应用
  all         完整流程：打包 + 签名验证 + 公证
  help        显示帮助信息

环境变量:
  CSC_KEY_PASSWORD    p12 证书密码（如果需要）

示例:
  node build-mac.js build      # 仅打包
  node build-mac.js all        # 完整流程
`);
}

async function main() {
  const command = process.argv[2] || 'help';
  
  log(`\n🚀 AIT Claw macOS 打包工具\n`, 'bright');
  
  switch (command) {
    case 'build':
      if (!checkCertificate()) process.exit(1);
      checkProvisioningProfile();
      buildApp();
      verifySignature();
      break;
      
    case 'sign':
      verifySignature();
      break;
      
    case 'notarize':
      notarizeApp();
      break;
      
    case 'all':
      if (!checkCertificate()) process.exit(1);
      checkProvisioningProfile();
      buildApp();
      if (!verifySignature()) process.exit(1);
      notarizeApp();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
  
  log('\n✨ 完成！\n', 'green');
}

main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  process.exit(1);
});

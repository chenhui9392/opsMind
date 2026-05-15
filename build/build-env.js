/**
 * Electron 分环境构建脚本
 * 支持: beta (测试版) 和 prod (正式版)
 *
 * 使用方法:
 *   node build/build-env.js beta    # 构建测试版
 *   node build/build-env.js prod    # 构建正式版
 */

const { execSync } = require('child_process');
const { writeFileSync, existsSync, unlinkSync } = require('fs');
const path = require('path');

// 获取命令行参数
const env = process.argv[2] || 'prod';

if (!['dev', 'beta', 'prod'].includes(env)) {
  console.error('错误: 环境参数必须是 dev、beta 或 prod');
  console.log('使用方法:');
  console.log('  node build/build-env.js dev     # 构建开发调试版');
  console.log('  node build/build-env.js beta    # 构建测试版');
  console.log('  node build/build-env.js prod    # 构建正式版');
  process.exit(1);
}

// 环境配置
const envConfig = {
  dev: {
    name: '海豚Dev',
    mode: 'development',
    icon: 'public/app-dev.png',
    config: 'electron-builder.dev.js',
    output: 'release-dev'
  },
  beta: {
    name: '海豚Beta',
    mode: 'beta',
    icon: 'public/app-beta.png',
    config: 'electron-builder.beta.js',
    output: 'release-beta'
  },
  prod: {
    name: '海豚',
    mode: 'production',
    icon: 'public/app.png',
    config: 'electron-builder.prod.js',
    output: 'release'
  }
};

const config = envConfig[env];

console.log(`\n========================================`);
console.log(`开始构建 ${config.name} 版本`);
console.log(`环境模式: ${config.mode}`);
console.log(`========================================\n`);

// 步骤 1: 清理旧的构建产物
console.log('[步骤 1] 清理旧的构建产物...');
try {
  // 清理 dist 目录中的环境标记文件
  const envModePath = path.join(__dirname, '..', 'dist', '.env-mode');
  if (existsSync(envModePath)) {
    unlinkSync(envModePath);
  }
  console.log('清理完成');
} catch (error) {
  console.log('清理警告:', error.message);
}

// 步骤 2: 执行 Vite 构建
console.log(`\n[步骤 2] 执行 Vite 构建 (${config.mode} 模式)...`);
try {
  execSync(`npx vite build --mode ${config.mode}`, { stdio: 'inherit' });
  console.log('Vite 构建完成');
} catch (error) {
  console.error('Vite 构建失败:', error.message);
  process.exit(1);
}

// 步骤 3: 写入环境标记文件到 dist 目录
console.log('\n[步骤 3] 写入环境标记文件...');
const envModePath = path.join(__dirname, '..', 'dist', '.env-mode');
writeFileSync(envModePath, config.mode);
console.log(`环境标记已写入: ${config.mode}`);

// 步骤 4: 检查图标文件
console.log(`\n[步骤 4] 检查图标文件 ${config.icon}...`);
const iconPath = path.join(__dirname, '..', config.icon);
if (!existsSync(iconPath)) {
  console.log(`警告: ${config.icon} 不存在，将使用默认图标`);
}

// 步骤 5: 执行 Electron Builder 打包
console.log(`\n[步骤 5] 执行 Electron Builder 打包...`);
try {
  // 使用指定的配置文件
  const configPath = path.join(__dirname, '..', config.config);
  execSync(`npx electron-builder --config ${configPath}`, { stdio: 'inherit' });
  console.log('Electron Builder 打包完成');
} catch (error) {
  console.error('Electron Builder 打包失败:', error.message);
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`${config.name} 版本构建成功!`);
console.log(`输出目录: ${config.output}`);
console.log(`========================================\n`);

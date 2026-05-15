/**
 * Electron Builder Production 版本配置
 * 用于构建正式版本（海豚）
 */

module.exports = {
  appId: 'com.opsmin.app',
  productName: '海豚',
  directories: {
    output: 'release'
  },
  defaultArch: 'x64',
  icon: 'public/app.png',
  win: {
    target: 'nsis',
    electronLanguages: ['en-US', 'zh-CN', 'zh-TW']
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    include: 'build/installer.nsh',
    shortcutName: '海豚',
    uninstallDisplayName: '海豚',
    artifactName: '${productName}.exe'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    category: 'public.app-category.productivity',
    icon: 'public/app.png',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    identity: 'Suzhou Uni Technology Co.,Ltd. (CG65HC99F7)',
    artifactName: '${productName}-${arch}.${ext}'
  },
  dmg: {
    sign: false,
    artifactName: '${productName}-${arch}.dmg'
  },
  electronVersion: '41.0.2',
  files: [
    'dist/**/*',
    'main.js',
    'preload.js',
    'src/utils/electronMain/**/*',
    'src/utils/menu.js',
    'public/**/*'
  ],
  extraResources: [
    // 打包时写入环境标记
    {
      from: 'dist/.env-mode',
      to: 'dist/.env-mode'
    }
  ],
  asar: true,
  asarUnpack: [],
  compression: 'maximum',
  removePackageScripts: true,
  removePackageKeywords: true,
  includePdb: false,
  detectUpdateChannel: false,
  protocols: [
    {
      name: '海豚',
      schemes: ['haitun', 'opsmin']
    }
  ]
}

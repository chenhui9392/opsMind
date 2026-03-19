const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  try {
    const { appOutDir } = context;
    console.log(`Cleaning up ${appOutDir}`);
    
    // 清理语言包，只保留中文和英文
    const localesPath = path.join(appOutDir, 'locales');
    if (fs.existsSync(localesPath)) {
      try {
        const localeFiles = fs.readdirSync(localesPath);
        const keepLocales = ['en-US.pak', 'zh-CN.pak', 'zh-TW.pak'];
        
        localeFiles.forEach(file => {
          if (!keepLocales.includes(file)) {
            const filePath = path.join(localesPath, file);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Removed unused locale: ${file}`);
            }
          }
        });
      } catch (error) {
        console.log(`Error cleaning locales: ${error.message}`);
      }
    }
    
    // 清理不必要的文件
    const filesToRemove = [
      'LICENSE.electron.txt',
      'LICENSES.chromium.html',
      'chrome_200_percent.pak',
      'vk_swiftshader.dll',
      'vk_swiftshader_icd.json',
      'vulkan-1.dll'
    ];
    
    filesToRemove.forEach(file => {
      const filePath = path.join(appOutDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Removed unused file: ${file}`);
        } catch (error) {
          console.log(`Error removing ${file}: ${error.message}`);
        }
      }
    });
    
    console.log('Post-pack cleanup completed successfully!');
  } catch (error) {
    console.log(`Error in afterPack: ${error.message}`);
  }
};
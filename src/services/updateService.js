/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-30 09:01:37
 * @LastEditTime: 2026-04-09 17:10:23
 * @LastEditors: hui.chenn
 */
/**
 * 应用版本更新服务
 */
import { checkAppVersion } from '../api'
import { getCurrentVersion, isUpdateNeeded } from '../config/updateConfig'

class UpdateService {
  constructor() {
    this.isChecking = false
    this.lastCheckTime = null
    this.updateInfo = null
    this.checkInterval = 24 * 60 * 60 * 1000 // 默认24小时检查一次
  }

  /**
   * 检查应用版本更新
   * @param {Object} options - 配置选项
   * @param {boolean} options.silent - 是否静默检查（不显示错误提示）
   * @param {boolean} options.force - 是否强制检查（忽略检查间隔）
   * @returns {Promise<Object>} 检查结果
   */
  async checkForUpdates(options = {}) {
    const { silent = false, force = false } = options

    // 防止重复检查
    if (this.isChecking) {
      console.log('版本检查正在进行中...')
      return { hasUpdate: false, checking: true }
    }

    // 检查间隔限制（非强制检查时）
    if (!force && this.lastCheckTime) {
      const timeSinceLastCheck = Date.now() - this.lastCheckTime
      if (timeSinceLastCheck < this.checkInterval) {
        console.log('距离上次检查时间太短，跳过本次检查')
        return { hasUpdate: false, skipped: true }
      }
    }

    this.isChecking = true

    try {
      console.log('开始检查应用版本更新...')

      const response = await checkAppVersion()
      this.lastCheckTime = Date.now()

      // 解析响应数据
      const updateInfo = this.parseUpdateResponse(response)

      // parseUpdateResponse 返回 null 表示已是最新版本 (r === 0)
      if (!updateInfo) {
        console.log('当前已是最新版本，无需更新')
        return {
          hasUpdate: false,
          currentVersion: getCurrentVersion(),
          message: '当前已是最新版本'
        }
      }

      // 需要更新
      this.updateInfo = updateInfo

      const result = {
        hasUpdate: true,
        currentVersion: getCurrentVersion(),
        latestVersion: updateInfo.version,
        updateInfo: updateInfo
      }

      console.log(`发现新版本: ${updateInfo.version}，当前版本: ${getCurrentVersion()}`)

      return result
    } catch (error) {
      console.error('版本检查失败:', error)

      if (!silent) {
        // 非静默模式下可以抛出错误或返回错误信息
        return {
          hasUpdate: false,
          error: error.message || '版本检查失败',
          errorCode: error.code
        }
      }

      return { hasUpdate: false, error: error.message }
    } finally {
      this.isChecking = false
    }
  }

  /**
   * 解析版本检查响应
   * 根据接口规范：res.data.data.r === 0 表示已是最新版本，无需更新
   * res.data.data.r !== 0 表示需要更新
   * @param {Object} response - API响应数据
   * @returns {Object|null} 解析后的更新信息，r === 0 返回 null 表示无需更新
   */
  parseUpdateResponse(response) {
    if (!response) {
      console.error('版本检查响应为空')
      return null
    }

    console.log('版本检查原始响应:', response)

    // 获取响应数据
    // 响应格式: { code: "0000", msg: "操作成功", data: { r: 0, ut: 0, u: null, v: null, ... } }
    let data = null

    if (response.code === '0000' && response.data) {
      data = response.data
    } else if (response.success === true && response.data) {
      data = response.data
    } else if (response.data) {
      data = response.data
    }

    if (!data) {
      console.error('无法从响应中解析数据:', response)
      return null
    }

    // 根据接口规范判断是否需要更新
    // r: 更新说明	0:无更新、1 有更新，只是提示 2、必须更新
    if (data.r === 0) {
      console.log('当前已是最新版本 (r=0)')
      return null
    }

    // 需要更新，解析更新信息
    return {
      version: data.v || data.version || data.latestVersion || '',
      downloadUrl: data.u || data.downloadUrl || data.url || '',
      releaseNotes: data.t || data.releaseNotes || data.notes || '有新版本可用，建议立即更新。',
      releaseDate: data.ut || data.releaseDate || data.date || '',
      forceUpdate: data.c === 1 || data.forceUpdate || data.force || false,
      fileSize: data.img || data.fileSize || data.size || 0,
      checksum: data.checksum || data.md5 || '',
      updateCode: data.r // 更新代码
    }
  }

  /**
   * 获取上次保存的更新信息
   * @returns {Object|null} 更新信息
   */
  getUpdateInfo() {
    return this.updateInfo
  }

  /**
   * 清除更新信息
   */
  clearUpdateInfo() {
    this.updateInfo = null
  }

  /**
   * 设置检查间隔
   * @param {number} interval - 检查间隔（毫秒）
   */
  setCheckInterval(interval) {
    this.checkInterval = interval
  }

  /**
   * 执行下载并安装更新
   * @param {string} downloadUrl - 下载链接
   * @param {string} fileName - 文件名（可选）
   * @returns {Promise<Object>} 下载安装结果
   */
  async downloadAndInstall(downloadUrl, fileName) {
    if (!downloadUrl) {
      console.error('下载链接为空')
      return { success: false, message: '下载链接为空' }
    }

    try {
      // 检查是否在Electron环境中
      if (window.appUpdater && window.appUpdater.downloadAndInstall) {
        console.log('使用Electron主进程下载并安装更新')
        return await window.appUpdater.downloadAndInstall(downloadUrl, fileName)
      } else {
        // 非Electron环境，使用浏览器打开下载链接
        console.log('非Electron环境，使用浏览器打开下载链接')
        window.open(downloadUrl, '_blank')
        return { success: true, message: '已在浏览器中打开下载链接' }
      }
    } catch (error) {
      console.error('下载更新失败:', error)
      return { success: false, message: error.message || '下载更新失败' }
    }
  }

  /**
   * 打开外部链接（备用方案）
   * @param {string} url - 链接地址
   * @returns {Promise<Object>} 结果
   */
  async openExternalLink(url) {
    if (!url) {
      return { success: false, message: '链接为空' }
    }

    try {
      if (window.appUpdater && window.appUpdater.openExternalLink) {
        return await window.appUpdater.openExternalLink(url)
      } else {
        window.open(url, '_blank')
        return { success: true, message: '已在浏览器中打开链接' }
      }
    } catch (error) {
      console.error('打开链接失败:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 获取当前版本号
   * @returns {string} 当前版本号
   */
  getCurrentVersion() {
    return getCurrentVersion()
  }
}

// 导出单例
const updateService = new UpdateService()
export default updateService

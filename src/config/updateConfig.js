/*
 * @Author: hui.chenn
 * @Description: 应用版本更新配置
 * @Date: 2026-03-27 17:10:00
 * @LastEditTime: 2026-03-30 15:54:24
 * @LastEditors: hui.chenn
 */

import { md5 } from '../utils/md5'
import { UPDATE_API_BASE_URL } from './env'

// 从 package.json 读取应用版本号
import packageJson from '../../package.json'
export const APP_VERSION = packageJson.version || '1.0.0'

// 判断是否为开发环境
const isDev = import.meta.env?.DEV || false

// 认证配置
const AUTH_CONFIG = {
  authAppkey: 'ced565e5a36911ecb0dd006066ad6f14',
  appSecret: 'ced565e5a36911ecb0dd006066ad6f14'
}

// 版本检查API基础配置
const UPDATE_API_CONFIG = {
  // 基础URL - 开发环境使用代理路径，生产环境使用完整URL
  baseUrl: isDev
    ? '/api/apprelease/client'  // 开发环境：使用Vite代理
    : `${UPDATE_API_BASE_URL}/api/v2/apprelease/client`,  // 生产环境：使用env.js配置的域名

  // 路径参数
  pathParams: {
    clientId: '42933cfc0f3490b76fd51a6cf3d09d5c',
    appName: 'tineco_ops_w',
    packageName: 'tineco_ops',
    packageVersion: '1'
  }
}

/**
 * 获取YYYYMMDDHHMMSS格式的时间戳
 * @returns {string} 时间戳字符串
 */
function getYYYYMMDDHHMMSS() {
  const now = new Date()
  return now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
}

/**
 * 获取应用代码
 * Electron环境返回 
 * @returns {string} 应用代码
 */
function getAppCode() {
  // Electron 环境使用 
  return 'tineco_ops_w'
}

/**
 * 获取应用版本号
 * @returns {string} 应用版本号
 */
function getAppVersion() {
  return APP_VERSION
}

/**
 * 获取设备ID
 * 使用 clientId 作为设备标识
 * @returns {string} 设备ID
 */
function getDeviceId() {
  return UPDATE_API_CONFIG.pathParams.clientId.toLowerCase()
}

/**
 * 获取设备类型
 * Electron 返回 '1'
 * @returns {string} 设备类型
 */
function getDeviceType() {
  // Electron 环境返回 1
  return '1'
}

/**
 * 生成认证签名 (authSign)
 * 规则: MD5(authAppkey + "appCode=" + appCode + "appVersion=" + appVersion +
 *           "authTimespan=" + timeSpan + "c=tineco_css" + "channel=tineco_css" +
 *           "ct=1" + "deviceId=" + deviceId + "deviceType=" + deviceType +
 *           "it=" + timeSpan + "n=" + appCode + "v=" + appVersion + appSecret)
 * @param {string} timeSpan - 时间戳
 * @returns {string} MD5签名
 */
function generateAuthSign(timeSpan) {
  const appCode = getAppCode()
  const appVersion = getAppVersion()
  const deviceId = getDeviceId()
  const deviceType = getDeviceType()

  // 按照指定规则拼接字符串
  const signStr = AUTH_CONFIG.authAppkey +
    'appCode=' + appCode +
    'appVersion=' + appVersion +
    'authTimespan=' + timeSpan +
    'c=tineco_ops' +
    'channel=tineco_ops' +
    'ct=1' +
    'deviceId=' + deviceId +
    'deviceType=' + deviceType +
    'it=' + timeSpan +
    'n=' + appCode +
    'v=' + appVersion +
    AUTH_CONFIG.appSecret

  console.log('Sign string:', signStr)

  return md5(signStr)
}

/**
 * 获取版本检查完整URL
 * @returns {string} 完整的版本检查URL
 */
export function getVersionCheckUrl() {
  const { baseUrl, pathParams } = UPDATE_API_CONFIG
  const { clientId, appName, packageName, packageVersion } = pathParams
  const appVersion = APP_VERSION

  // 构建基础路径
  const path = `${baseUrl}/${clientId}/${appName}/${appVersion}/${packageName}/${packageVersion}/checkVersion`

  // 获取当前时间戳
  const timeSpan = getYYYYMMDDHHMMSS()

  // 生成认证签名
  const authSign = generateAuthSign(timeSpan)

  console.log('Generated authSign:', authSign)
  console.log('Time span:', timeSpan)

  // 构建查询参数
  const queryParams = {
    authAppkey: AUTH_CONFIG.authAppkey,
    authSign: authSign,
    authTimespan: timeSpan,
    c: 'tineco_ops',
    ct: '1',
    it: timeSpan,
    n: getAppCode(),
    v: getAppVersion()
  }

  // 拼接URL
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  return `${path}?${queryString}`
}

/**
 * 获取当前应用版本号
 * @returns {string} 当前应用版本号
 */
export function getCurrentVersion() {
  return APP_VERSION
}

/**
 * 比较两个版本号
 * @param {string} currentVersion - 当前版本
 * @param {string} latestVersion - 最新版本
 * @returns {number} -1: 当前版本较旧, 0: 版本相同, 1: 当前版本较新
 */
export function compareVersion(currentVersion, latestVersion) {
  const currentParts = currentVersion.split('.').map(Number)
  const latestParts = latestVersion.split('.').map(Number)

  const maxLength = Math.max(currentParts.length, latestParts.length)

  for (let i = 0; i < maxLength; i++) {
    const current = currentParts[i] || 0
    const latest = latestParts[i] || 0

    if (current < latest) {
      return -1
    } else if (current > latest) {
      return 1
    }
  }

  return 0
}

/**
 * 检查是否需要更新
 * @param {string} latestVersion - 服务器返回的最新版本
 * @returns {boolean} 是否需要更新
 */
export function isUpdateNeeded(latestVersion) {
  if (!latestVersion) return false
  return compareVersion(APP_VERSION, latestVersion) < 0
}

/**
 * PowerShell 执行服务
 * 前端调用封装，用于处理聊天返回的 JSON 并执行 PowerShell 命令
 */

/**
 * 解析聊天返回的 JSON 并执行 PowerShell 命令
 * @param {Object} chatResponse - 聊天接口返回的数据
 * @returns {Promise<Object>} - { success, data, error, displayText }
 */
export async function handleChatPowerShell(chatResponse) {
  if (!window.powerShellAPI) {
    console.error('[PowerShell Service] API 未初始化，请确保在 Electron 环境中运行')
    return {
      success: false,
      data: '',
      error: 'API 未初始化',
      displayText: '当前环境不支持执行 PowerShell 命令'
    }
  }

  // 检查响应是否包含 PowerShell 执行标识
  const actionKey = extractActionKey(chatResponse)
  if (!actionKey) {
    console.log('[PowerShell Service] 响应中无 PowerShell 执行标识')
    return {
      success: true,
      data: '',
      error: '',
      displayText: '无需执行命令'
    }
  }

  console.log(`[PowerShell Service] 检测到执行标识: ${actionKey}`)

  try {
    // 先提示用户
    const confirmed = await confirmExecution(actionKey)
    if (!confirmed) {
      return {
        success: false,
        data: '',
        error: '用户取消执行',
        displayText: '用户取消了命令执行'
      }
    }

    // 执行 PowerShell 命令
    const result = await window.powerShellAPI.execute(actionKey)

    // 构建展示文本
    let displayText = ''
    if (result.success) {
      displayText = `命令执行成功\n输出: ${result.data || '无输出'}`
    } else {
      displayText = `命令执行失败\n错误: ${result.error}`
    }

    return {
      ...result,
      displayText
    }
  } catch (error) {
    console.error('[PowerShell Service] 执行异常:', error)
    return {
      success: false,
      data: '',
      error: error.message,
      displayText: `执行异常: ${error.message}`
    }
  }
}

/**
 * 从聊天响应中提取执行标识
 * @param {Object} response - 聊天响应
 * @returns {string|null} - 执行标识或 null
 */
function extractActionKey(response) {
  // 支持多种格式：
  // 1. { action: 'run-client' }
  // 2. { command: 'run-client' }
  // 3. { data: { action: 'run-client' } }
  // 4. { message: { type: 'powershell', action: 'run-client' } }

  if (!response) return null

  // 直接携带 action/command
  if (response.action) return response.action
  if (response.command) return response.command

  // 嵌套在 data 中
  if (response.data) {
    if (response.data.action) return response.data.action
    if (response.data.command) return response.data.command
  }

  // 嵌套在 message 中
  if (response.message) {
    if (response.message.type === 'powershell') {
      return response.message.action || response.message.command
    }
  }

  // 检查是否有 powershell_type 字段
  if (response.powershell_type || response.ps_action) {
    return response.powershell_type || response.ps_action
  }

  return null
}

/**
 * 确认执行（显示提示）
 * @param {string} actionKey - 执行标识
 * @returns {Promise<boolean>} - 用户是否确认
 */
async function confirmExecution(actionKey) {
  // 在实际应用中，这里可以显示一个确认对话框
  // 目前默认返回 true，你可以根据需要修改
  console.log(`[PowerShell Service] 准备执行: ${actionKey}`)

  // 如果需要用户确认，可以使用 Element Plus 的 MessageBox
  // try {
  //   await ElMessageBox.confirm(
  //     `即将执行系统命令: ${actionKey}`,
  //     '执行确认',
  //     { confirmButtonText: '确认执行', cancelButtonText: '取消' }
  //   )
  //   return true
  // } catch {
  //   return false
  // }

  return true
}

/**
 * 流式执行 PowerShell 命令（用于长时间运行的命令）
 * @param {string} actionKey - 命令标识
 * @param {Object} options - 执行选项
 * @param {Function} onProgress - 进度回调 (progress) => void
 * @returns {Promise<Object>} - 执行结果
 */
export function executePowerShellStream(actionKey, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    if (!window.powerShellAPI) {
      reject(new Error('API 未初始化'))
      return
    }

    window.powerShellAPI.executeStream(
      actionKey,
      options,
      (progress) => {
        console.log(`[PowerShell Stream] 进度:`, progress)
        if (onProgress) {
          onProgress(progress)
        }
      },
      (result) => {
        console.log(`[PowerShell Stream] 完成:`, result)
        resolve(result)
      }
    )
  })
}

/**
 * 导出所有方法
 */
export default {
  handleChatPowerShell,
  executePowerShellStream,
  extractActionKey
}
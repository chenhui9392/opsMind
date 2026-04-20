/**
 * PowerShell 执行模块
 * 安全封装 PowerShell 命令执行
 */

const { spawn } = require('child_process')

/**
 * 白名单命令配置
 * 仅允许执行预定义的安全命令
 */
const ALLOWED_COMMANDS = {
  // 执行远程客户端命令
  'run-client': {
    command: 'Invoke-RestMethod',
    args: ['http://10.108.112.48:8000/api/run-client'],
    pipe: 'Invoke-Expression',
    description: '执行远程客户端脚本'
  }
}

/**
 * 安全封装函数 - 验证命令是否在白名单中
 * @param {string} actionKey - 命令标识（如 'run-client'）
 * @returns {Object|null} - 返回白名单配置或 null
 */
function validateCommand(actionKey) {
  // 仅允许白名单中的命令
  if (!ALLOWED_COMMANDS[actionKey]) {
    console.error(`[PowerShell] 未授权的命令: ${actionKey}`)
    return null
  }
  return ALLOWED_COMMANDS[actionKey]
}

/**
 * 构建 PowerShell 命令参数
 * @param {Object} config - 白名单配置
 * @returns {string} - PowerShell 命令字符串
 */
function buildCommand(config) {
  let cmd = config.command
  if (config.args && config.args.length > 0) {
    cmd += ' ' + config.args.join(' ')
  }
  if (config.pipe) {
    cmd += ` | ${config.pipe}`
  }
  return cmd
}

/**
 * 执行 PowerShell 命令（使用 spawn 实现流式输出）
 * @param {string} actionKey - 命令标识（如 'run-client'）
 * @param {Object} options - 执行选项
 * @param {Function} onProgress - 进度回调（可选）
 * @returns {Promise<Object>} - 返回 { success: boolean, data: string, error: string }
 */
async function executePowerShell(actionKey, options = {}, onProgress = null) {
  // 安全验证：检查命令是否在白名单中
  const config = validateCommand(actionKey)
  if (!config) {
    return {
      success: false,
      data: '',
      error: `命令 "${actionKey}" 不在允许的白名单中`
    }
  }

  // 构建安全的 PowerShell 命令（不拼接用户输入）
  const command = buildCommand(config)
  console.log(`[PowerShell] 执行白名单命令: ${actionKey}`)
  console.log(`[PowerShell] 完整命令: ${command}`)

  return new Promise((resolve) => {
    const stdoutChunks = []
    const stderrChunks = []

    // 使用 spawn 执行 PowerShell，启用流式输出
    const psProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-Command', command
    ], {
      windowsHide: true,
      cwd: process.cwd()
    })

    // 捕获标准输出（流式）
    psProcess.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdoutChunks.push(chunk)
      console.log(`[PowerShell stdout] ${chunk}`)

      // 进度回调
      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          type: 'stdout',
          data: chunk
        })
      }
    })

    // 捕获错误输出（流式）
    psProcess.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderrChunks.push(chunk)
      console.error(`[PowerShell stderr] ${chunk}`)

      // 进度回调
      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          type: 'stderr',
          data: chunk
        })
      }
    })

    // 处理进程错误
    psProcess.on('error', (err) => {
      console.error(`[PowerShell error] ${err.message}`)
      resolve({
        success: false,
        data: stdoutChunks.join(''),
        error: `进程执行错误: ${err.message}`
      })
    })

    // 进程结束
    psProcess.on('close', (code) => {
      const stdout = stdoutChunks.join('').trim()
      const stderr = stderrChunks.join('').trim()

      console.log(`[PowerShell] 进程退出，退出码: ${code}`)

      if (code === 0) {
        resolve({
          success: true,
          data: stdout,
          error: stderr || ''
        })
      } else {
        resolve({
          success: false,
          data: stdout,
          error: stderr || `命令执行失败，退出码: ${code}`
        })
      }
    })

    // 设置超时（可选）
    if (options.timeout) {
      setTimeout(() => {
        psProcess.kill()
        resolve({
          success: false,
          data: stdoutChunks.join(''),
          error: `命令执行超时（${options.timeout}ms）`
        })
      }, options.timeout)
    }
  })
}

/**
 * 解析聊天返回的 JSON 并执行对应命令
 * @param {Object} jsonData - 聊天接口返回的 JSON
 * @param {Function} onProgress - 进度回调（可选）
 * @returns {Promise<Object>} - 执行结果
 */
async function parseAndExecute(jsonData, onProgress = null) {
  // JSON 字段校验
  if (!jsonData || typeof jsonData !== 'object') {
    return {
      success: false,
      data: '',
      error: '无效的 JSON 数据'
    }
  }

  // 检查必要字段（防止注入）
  const action = jsonData.action || jsonData.command
  if (!action || typeof action !== 'string') {
    return {
      success: false,
      data: '',
      error: '缺少 action 或 command 字段'
    }
  }

  // 验证 action 格式（防止注入）
  const safeAction = action.trim().toLowerCase()
  if (!/^[\w-]+$/.test(safeAction)) {
    return {
      success: false,
      data: '',
      error: 'action 字段格式无效，仅允许字母、数字、下划线和连字符'
    }
  }

  // 执行白名单命令
  return executePowerShell(safeAction, jsonData.options || {}, onProgress)
}

module.exports = {
  executePowerShell,
  parseAndExecute,
  ALLOWED_COMMANDS,
  validateCommand
}
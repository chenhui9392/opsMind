/**
 * 消息相关的工具方法
 */

/**
 * 解析 content 内容（与 chatMessageService.parseContent 逻辑一致）
 * @param {string} content - 原始 content 字符串
 * @returns {Object} - 包含 text、hasFull、formInfo 的对象
 */
export function parseMessageContent(content) {
  const result = {
    text: content || '稍后再试，系统正在全力维修中....',
    hasFull: false,
    formInfo: null
  }

  // content 为空时返回默认提示
  if (!content || content.trim() === '') {
    return result
  }

  // 尝试解析 JSON
  let parsed = null
  try {
    parsed = JSON.parse(content)
  } catch (parseError) {
    // 解析失败，content 不是 JSON，直接显示原始内容
    console.log('Content is not JSON, treating as plain text:', content)
    return result
  }

  // JSON 解析成功，按优先级处理

  // 1. 判断是否有 hasfull 字段
  if (parsed.hasfull !== undefined) {
    // a. hasfull=false 时，显示 tip 内容
    if (parsed.hasfull === false && parsed.tip) {
      result.text = parsed.tip
      return result
    }
    // b. hasfull=true 时，用 formInfo 渲染 a2ui 组件
    if (parsed.hasfull === true && parsed.formInfo) {
      result.hasFull = true
      result.formInfo = parsed.formInfo
      result.text = parsed.input || parsed.message || ''
      return result
    }
  }

  // 2. 判断是否有 question 字段（详情接口历史消息格式）
  if (parsed.question) {
    result.text = parsed.question
    return result
  }

  // 3. 判断是否有 input 字段
  if (parsed.input) {
    result.text = parsed.input
    return result
  }

  // 4. 判断是否有 message 字段
  if (parsed.message) {
    result.text = parsed.message
    return result
  }

  // 5. 其他情况，尝试使用 tip 字段（兜底）
  if (parsed.tip) {
    result.text = parsed.tip
  }

  return result
}

/**
 * 创建用户消息对象
 * @param {string} text - 消息内容
 * @param {Array} images - 图片URL数组
 * @param {Array} files - 文件数组
 * @returns {Object} - 消息对象
 */
export function createMessage(text, images, files = []) {
  return {
    sender: 'user',
    text: text,
    time: new Date().toLocaleString('zh-CN'),
    images: images,
    files: files
  }
}

/**
 * 创建消息对象
 * @param {string} text - 消息内容
 * @param {string} sender - 发送者
 * @param {Array} images - 图片数组
 * @returns {Object} - 消息对象
 */
export function createMessageObject(text, sender = 'bot', images = []) {
  return {
    sender: sender,
    text: text,
    time: new Date().toLocaleString('zh-CN'),
    images: images
  }
}

/**
 * 将历史记录转换为消息格式
 * @param {Array} historyData - 历史记录数据
 * @param {Object} options - 可选参数
 * @param {string} options.orderStatus - 工单状态
 * @returns {Array} - 消息数组
 */
export function convertHistoryToMessages(historyData, options = {}) {
  if (!Array.isArray(historyData)) {
    return []
  }

  const { orderStatus, orderType, feedbackRecord, customerSatisfaction } = options

  const messages = historyData.map(item => {
    // 使用统一的解析逻辑处理 content
    const parsedResult = parseMessageContent(item.content)

    return {
      sender: item.messageType === 'user' ? 'user' : 'bot',
      text: parsedResult.text,
      time: item.createTime || new Date().toLocaleString('zh-CN'),
      images: [],
      // 新增：表单信息字段
      hasFull: parsedResult.hasFull,
      formInfo: parsedResult.formInfo,
      // 新增：工单状态字段
      orderStatus: orderStatus
    }
  })

  // 当存在历史反馈记录时，添加反馈状态展示卡片（仅展示，不可点击）
  if (feedbackRecord) {
    messages.push({
      sender: 'resolve-status',
      text: '',
      time: '',
      images: [],
      feedbackRecord: feedbackRecord,
      resolved: true
    })
  } else if (orderType === 'CONSULTATION' && orderStatus === 'PENDING') {
    // 没有历史反馈记录时，根据工单状态添加可交互的解决状态卡片
    messages.push({
      sender: 'resolve-status',
      text: '',
      time: '',
      images: [],
      orderStatus: orderStatus
    })
  }

  // 当存在历史满意度评价时，添加满意度展示卡片（仅展示，不可点击）
  if (customerSatisfaction) {
    messages.push({
      sender: 'satisfaction-status',
      text: '',
      time: '',
      images: [],
      customerSatisfaction: customerSatisfaction
    })
  }

  return messages
}

/**
 * 格式化时间
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} - 格式化后的时间字符串
 */
export function formatTime(date) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('zh-CN')
}

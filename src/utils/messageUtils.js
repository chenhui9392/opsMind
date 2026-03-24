/**
 * 消息相关的工具方法
 */

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
 * @returns {Array} - 消息数组
 */
export function convertHistoryToMessages(historyData) {
  if (!Array.isArray(historyData)) {
    return []
  }

  return historyData.map(item => {
    // 解析 content 字段（如果是 JSON 字符串）
    let content = item.content
    try {
      const parsedContent = JSON.parse(content)
      if (parsedContent.questionContent) {
        content = parsedContent.questionContent
      } else if (parsedContent.input) {
        content = parsedContent.input
      }
    } catch (parseError) {
      // 如果解析失败，使用原始 content
      console.log('Content is not JSON:', content)
    }

    return {
      sender: item.messageType === 'user' ? 'user' : 'bot',
      text: content,
      time: item.createTime || new Date().toLocaleString('zh-CN'),
      images: []
    }
  })
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

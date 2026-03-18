/**
 * 系统相关工具类
 */

/**
 * 获取系统用户名
 * @returns {Promise<string>} - 返回系统用户名
 */
export const getSystemUsername = async () => {
  let userName = 'unknown'
  try {
    if (window.systemInfo) {
      // 尝试同步获取用户名
      if (window.systemInfo.getUserNameSync) {
        try {
          userName = window.systemInfo.getUserNameSync() || 'unknown'
          console.log('Got username sync from systemInfo:', userName)
        } catch (syncError) {
          console.error('Error calling getUserNameSync:', syncError)
          
          // 同步失败，尝试异步获取
          if (window.systemInfo.getUserName) {
            try {
              userName = await window.systemInfo.getUserName() || 'unknown'
              console.log('Got username async from systemInfo:', userName)
            } catch (asyncError) {
              console.error('Error calling getUserName async:', asyncError)
            }
          }
        }
      } else if (window.systemInfo.getUserName) {
        // 只有异步方法
        try {
          userName = await window.systemInfo.getUserName() || 'unknown'
          console.log('Got username async from systemInfo:', userName)
        } catch (asyncError) {
          console.error('Error calling getUserName async:', asyncError)
        }
      }
    } else {
      console.log('systemInfo not available, using browser fallback')
      // 在浏览器环境中，尝试从 localStorage 获取用户名
      if (typeof localStorage !== 'undefined') {
        const storedUsername = localStorage.getItem('username')
        if (storedUsername) {
          userName = storedUsername
          console.log('Got username from localStorage:', userName)
        } else {
          // 如果 localStorage 中没有，生成一个随机用户名
          userName = 'user_' + Math.floor(Math.random() * 10000)
          localStorage.setItem('username', userName)
          console.log('Generated random username:', userName)
        }
      }
    }
  } catch (error) {
    console.error('Error getting username:', error)
  }
  
  console.log('Final username:', userName)
  return userName
}

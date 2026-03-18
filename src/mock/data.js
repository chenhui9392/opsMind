// 模拟联系人数据
export const contacts = [
  {
    id: 1,
    name: '账户登录问题',
    time: '2023-11-15 14:30',
    status: 'completed',
    statusText: '已完成',
    lastMessage: '无法登录账户，密码重置失败'
  },
  {
    id: 2,
    name: '支付流程咨询',
    time: '2023-11-15 15:45',
    status: 'processing',
    statusText: '处理中',
    lastMessage: '在线支付时遇到网络错误'
  },
  {
    id: 3,
    name: '订单配送查询',
    time: '2023-11-14 09:20',
    status: 'completed',
    statusText: '已完成',
    lastMessage: '想知道订单何时能够送达'
  },
  {
    id: 4,
    name: '退款申请处理',
    time: '2023-11-14 16:10',
    status: 'pending',
    statusText: '待响应',
    lastMessage: '申请退款但未收到处理通知'
  },
  {
    id: 5,
    name: '产品功能介绍',
    time: '2023-11-13 11:05',
    status: 'completed',
    statusText: '已完成',
    lastMessage: '询问高级功能的具体使用方法'
  },
  {
    id: 6,
    name: '发票开具申请',
    time: '2023-11-13 13:40',
    status: 'processing',
    statusText: '处理中',
    lastMessage: '需要开具增值税专用发票'
  }
]

// 模拟初始消息数据
export const initialMessages = [
  {
    sender: 'bot',
    text: '您好！我是智能助手，请问有什么可以帮助您的吗？',
    time: '2026-03-16 17:00',
    images: []
  }
]

// 模拟回复消息
export const mockReply = {
  sender: 'bot',
  text: '网络错误或服务异常，请稍后再试。',
  images: []
}

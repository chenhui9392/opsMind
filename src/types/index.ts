/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-17 11:09:08
 * @LastEditTime: 2026-03-17 11:09:14
 * @LastEditors: hui.chenn
 */
export interface Contact {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'busy'
  lastMessage: string
  lastTime: string
}

export interface Message {
  id: string
  type: 'sent' | 'received'
  content: string
  time: string
  sender: string
  images: string[]
}

export interface UploadResponse {
  success: boolean
  msg: string
  data: {
    path: string
    fileName: string
    accessPath: string
    fileSize: number
  }
  status: string
  code: string
  count: number
}

export interface ChatRequest {
  message: string
  userName: string
  fileUrls: string[]
}

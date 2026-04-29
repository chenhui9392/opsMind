<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-29 09:17:59
 * @LastEditTime: 2026-04-29 09:18:19
 * @LastEditors: hui.chenn
-->
<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed, onMounted, nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'

// Props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  autoImageLink: {
    type: Boolean,
    default: true
  }
})

// 懒加载 mermaid
let mermaid = null
let mermaidInitialized = false

const initMermaid = async () => {
  if (!mermaid) {
    mermaid = (await import('mermaid')).default
  }
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict'
    })
    mermaidInitialized = true
  }
}

// 创建 markdown-it 实例
const md = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true
})

// 自定义 fence 规则，处理 mermaid 代码块
const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const info = token.info.trim()

  if (info === 'mermaid') {
    const code = token.content.trim()
    return `<div class="mermaid">${md.utils.escapeHtml(code)}</div>`
  }

  return defaultFence(tokens, idx, options, env, self)
}

/**
 * 渲染 Markdown 文本
 * 同时将图片链接转换为 <img> 标签显示
 */
const renderedHtml = computed(() => {
  if (!props.content) return ''
  const textStr = String(props.content)
  // 手动转义 < 防止 XSS
  const escapedText = textStr.replace(/</g, '&lt;')
  let html = md.render(escapedText)

  // 将指向图片文件的 <a> 标签转换为 <img> 标签
  if (props.autoImageLink) {
    const imageExtensions = /\.(png|jpg|jpeg|gif|webp)(\?[^"]*)?$/i
    html = html.replace(
      /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
      (match, href, text) => {
        if (imageExtensions.test(href)) {
          return `<img src="${href}" alt="${text}" style="max-width:100%;max-height:300px;border-radius:4px;margin:4px 0;display:block;" />`
        }
        return match
      }
    )
  }

  return html
})

/**
 * 渲染 Mermaid 图表
 */
const renderMermaid = async () => {
  await nextTick()
  // 只选择未被渲染过的 mermaid 容器
  const containers = document.querySelectorAll('.markdown-body .mermaid:not([data-processed])')
  if (containers.length === 0) return

  // 如果没有 mermaid 代码块，不需要加载 mermaid
  await initMermaid()

  try {
    await mermaid.run({
      nodes: Array.from(containers)
    })
    // 标记为已处理
    containers.forEach(node => {
      node.setAttribute('data-processed', 'true')
    })
  } catch (error) {
    console.error('Mermaid 渲染失败:', error)
  }
}

// 监听内容变化，重新渲染 Mermaid
watch(() => props.content, () => {
  nextTick(() => {
    renderMermaid()
  })
})

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    renderMermaid()
  })
})
</script>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  /* 防止长文本溢出 */
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.25;
  /* 防止标题过长溢出 */
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(h1) {
  font-size: 1.75em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body :deep(h2) {
  font-size: 1.4em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body :deep(h3) {
  font-size: 1.2em;
}

.markdown-body :deep(h4) {
  font-size: 1em;
}

.markdown-body :deep(h5) {
  font-size: 0.875em;
}

.markdown-body :deep(h6) {
  font-size: 0.85em;
  color: #6a737d;
}

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 10px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.8em;
  margin-top: 0;
  margin-bottom: 10px;
  /* 防止列表内容溢出 */
  overflow: hidden;
}

.markdown-body :deep(li) {
  margin-top: 0.25em;
  /* 防止列表项内长文本溢出 */
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 有序列表特殊处理：确保数字和文本正确换行 */
.markdown-body :deep(ol) {
  list-style-position: outside;
}

.markdown-body :deep(ol > li) {
  padding-left: 0.3em;
}

.markdown-body :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  padding: 0.2em 0.4em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  /* 防止行内代码溢出 */
  word-break: break-word;
}

.markdown-body :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 12px;
  overflow: auto;
  font-size: 0.85em;
  line-height: 1.45;
  margin-top: 0;
  margin-bottom: 10px;
  max-width: 100%;
  /* 防止代码块撑大容器 */
  box-sizing: border-box;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  word-break: normal;
  white-space: pre;
}

.markdown-body :deep(a) {
  color: #0366d6;
  text-decoration: none;
  /* 长链接强制换行 */
  word-break: break-all;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 10px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin-bottom: 10px;
  width: 100%;
  overflow: auto;
  display: block;
  max-width: 100%;
  box-sizing: border-box;
}

.markdown-body :deep(table th) {
  font-weight: 600;
  padding: 6px 10px;
  border: 1px solid #dfe2e5;
  background-color: #f6f8fa;
}

.markdown-body :deep(table td) {
  padding: 6px 10px;
  border: 1px solid #dfe2e5;
}

.markdown-body :deep(table tr) {
  background-color: #ffffff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

/* 图片防止溢出 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  box-sizing: border-box;
}

/* Mermaid 图表容器样式 */
.markdown-body :deep(.mermaid) {
  max-width: 100%;
  overflow: auto;
  margin-bottom: 10px;
}

/* 任务列表特殊处理 */
.markdown-body :deep(ul > li) {
  list-style-position: outside;
}

/* 强调整体容器不会溢出 */
.markdown-body :deep(*) {
  max-width: 100%;
}

/* 但 pre 和 code 需要保留自身样式 */
.markdown-body :deep(pre *),
.markdown-body :deep(code *) {
  max-width: none;
}
</style>

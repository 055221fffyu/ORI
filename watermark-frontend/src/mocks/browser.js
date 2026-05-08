// src/mocks/browser.js
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 這行會根據你寫的 handlers 建立一個 Service Worker 實例
export const worker = setupWorker(...handlers)
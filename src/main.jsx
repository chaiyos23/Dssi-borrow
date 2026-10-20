// Entry point ของ frontend: ไฟล์แรกที่เบราว์เซอร์โหลด
// หน้าที่เดียวคือหา <div id="root"> ใน index.html แล้วสั่ง React วาด <App /> ลงไป

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

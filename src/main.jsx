import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dataset from './Dataset.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dataset />
  </StrictMode>,
)

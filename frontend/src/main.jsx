/**
 * @file main.jsx
 * @brief Application entry point.
 *
 * Mounts the React tree into the `#root` DOM element and applies global
 * configuration before the first render.
 *
 * @author Rodrigo Ramos Hernández
 * @date 2025-12-14
 * @version 1.0
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * Suppress React Flow internal warnings from the browser console.
 * These warnings are often related to the library's internal state management. 
 * All other warnings are forwarded to the original handler.
 */
const _warn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[React Flow]')) return;
  _warn(...args);
};

/**
 * Bootstrap the application.
 * This function initializes the React application by rendering the `App` component.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

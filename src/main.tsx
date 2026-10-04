// Ensure window.fetch has a setter if any environment script or proxy attempts assignment
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    let customFetch: typeof window.fetch | null = null;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
    if (!desc || !desc.set) {
      const newDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
        get() {
          return customFetch || (typeof originalFetch === 'function' ? originalFetch.bind(window) : originalFetch);
        },
        set(fn: typeof window.fetch) {
          customFetch = fn;
        }
      };
      try {
        Object.defineProperty(window, 'fetch', newDescriptor);
      } catch (_) {}
      if (Window.prototype) {
        try {
          Object.defineProperty(Window.prototype, 'fetch', newDescriptor);
        } catch (_) {}
      }
    }
  } catch (_) {}
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

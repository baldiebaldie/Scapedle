import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// Send Core Web Vitals to GA4
reportWebVitals(({ name, delta }) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, {
      category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    });
  }
});

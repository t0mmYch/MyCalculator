import React from 'react';
import { createRoot } from 'react-dom/client';
import Calculator from './Calculator.jsx';
import './Calculator.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Calculator />
  </React.StrictMode>
); 
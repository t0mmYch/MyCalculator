import React, { useState, useEffect, useRef } from 'react';
import './Calculator.css';

const BUTTONS = [
  [
    { label: 'AC', type: 'clear', key: 'Escape' },
    { label: '+/-', type: 'function', key: 'F9' },
    { label: '%', type: 'function', key: '%' },
    { label: '\u00F7', type: 'operator', key: '/' },
  ],
  [
    { label: '7', type: 'number', key: '7' },
    { label: '8', type: 'number', key: '8' },
    { label: '9', type: 'number', key: '9' },
    { label: '\u00D7', type: 'operator', key: '*' },
  ],
  [
    { label: '4', type: 'number', key: '4' },
    { label: '5', type: 'number', key: '5' },
    { label: '6', type: 'number', key: '6' },
    { label: '-', type: 'operator', key: '-' },
  ],
  [
    { label: '1', type: 'number', key: '1' },
    { label: '2', type: 'number', key: '2' },
    { label: '3', type: 'number', key: '3' },
    { label: '+', type: 'operator', key: '+' },
  ],
  [
    { label: '0', type: 'number', key: '0', wide: true },
    { label: '.', type: 'number', key: '.' },
    { label: '=', type: 'equals', key: 'Enter' },
  ],
];

const OP_MAP = {
  '\u00F7': '/',
  '\u00D7': '*',
  '+': '+',
  '-': '-',
};

function formatDisplay(val) {
  if (val === '' || val === null) return '0';
  if (val === 'Error') return 'Error';
  // Remove trailing .0 for integers
  if (Number(val) % 1 === 0) return String(Number(val));
  return String(val);
}

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [operator, setOperator] = useState(null);
  const [operand, setOperand] = useState(null);
  const [lastKey, setLastKey] = useState(null);
  const [lastValue, setLastValue] = useState(null);
  const [expression, setExpression] = useState('');
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef(null);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      let key = e.key;
      if (key === 'Enter') key = '=';
      if (key === 'Escape') key = 'AC';
      if (key === 'Backspace') key = 'AC';
      if (key === 'F9') key = '+/-';
      if (key === '%') key = '%';
      if (key === '.') key = '.';
      if (key === '/') key = '\u00F7';
      if (key === '*') key = '\u00D7';
      if (key === '-') key = '-';
      if (key === '+') key = '+';
      if (key.match(/^[0-9]$/)) key = key;
      if (key === '=') key = '=';
      // Find the button
      for (const row of BUTTONS) {
        for (const btn of row) {
          if (btn.label === key) {
            e.preventDefault();
            handleButtonClick(btn);
            return;
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [display, operator, operand, waitingForOperand, lastKey, lastValue, expression, showResult]);

  const inputNumber = (num) => {
    if (display === 'Error') {
      setDisplay(num);
      setWaitingForOperand(false);
      setExpression(num);
      setShowResult(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
      setShowResult(false);
    } else {
      if (display === '0') {
        setDisplay(num);
        if (showResult) setShowResult(false);
      } else {
        setDisplay(display + num);
      }
    }
    if (showResult) {
      setExpression(num);
      setShowResult(false);
    } else {
      setExpression((prev) => (prev === '' || prev === '0' ? num : prev + num));
    }
  };

  const inputDot = () => {
    if (display === 'Error') {
      setDisplay('0.');
      setWaitingForOperand(false);
      setExpression('0.');
      setShowResult(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      setShowResult(false);
      setExpression((prev) => prev + '0.');
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setExpression((prev) => prev + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setOperator(null);
    setOperand(null);
    setWaitingForOperand(false);
    setLastKey(null);
    setLastValue(null);
    setExpression('');
    setShowResult(false);
  };

  const toggleSign = () => {
    if (display === 'Error') return;
    if (display === '0') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
      setExpression((prev) => prev.replace(/-?\d+\.?\d*$/, (m) => m.slice(1)));
    } else {
      setDisplay('-' + display);
      setExpression((prev) => prev.replace(/\d+\.?\d*$/, (m) => '-' + m));
    }
  };

  const inputPercent = () => {
    if (display === 'Error') return;
    let value = parseFloat(display);
    let newValue;
    if (operator && operand !== null) {
      // e.g. 50 + 8% => 50 + (50 * 0.08)
      newValue = operand * (value / 100);
    } else {
      // e.g. 8% => 0.08
      newValue = value / 100;
    }
    setDisplay(String(newValue));
    setWaitingForOperand(true);
    setExpression((prev) => prev + '%');
  };

  const performOperation = (nextOperator) => {
    if (display === 'Error') return;
    const inputValue = parseFloat(display);
    if (operator && operand !== null && !waitingForOperand) {
      let result = calculate(operand, inputValue, operator);
      if (result === 'Error') {
        setDisplay('Error');
        setOperand(null);
        setOperator(null);
        setWaitingForOperand(false);
        setExpression('');
        setShowResult(false);
        return;
      }
      setDisplay(String(result));
      setOperand(result);
      setExpression((prev) => prev + nextOperator);
    } else {
      setOperand(inputValue);
      setExpression((prev) => prev + nextOperator);
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
    setShowResult(false);
  };

  const calculate = (left, right, op) => {
    try {
      switch (op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          if (right === 0) return 'Error';
          return left / right;
        default:
          return right;
      }
    } catch {
      return 'Error';
    }
  };

  const handleEquals = () => {
    if (display === 'Error') return;
    let result = display;
    if (operator && operand !== null) {
      result = calculate(operand, parseFloat(display), operator);
      setDisplay(String(result));
      setOperand(null);
      setOperator(null);
      setWaitingForOperand(true);
      setLastValue(parseFloat(display));
      setLastKey('=');
      setShowResult(true);
      setExpression((prev) => prev.replace(/([+\-*/])$/, ''));
    } else if (lastKey === '=' && lastValue !== null && operator) {
      result = calculate(parseFloat(display), lastValue, operator);
      setDisplay(String(result));
      setShowResult(true);
    }
  };

  const handleButtonClick = (btn) => {
    if (btn.type === 'icon') return;
    if (btn.type === 'number') {
      if (btn.label === '.') {
        inputDot();
      } else {
        inputNumber(btn.label);
      }
    } else if (btn.type === 'clear') {
      clearAll();
    } else if (btn.type === 'function') {
      if (btn.label === '+/-') toggleSign();
      if (btn.label === '%') inputPercent();
    } else if (btn.type === 'operator') {
      performOperation(OP_MAP[btn.label]);
    } else if (btn.type === 'equals') {
      handleEquals();
    }
  };

  // Focus for keyboard
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.tabIndex = 0;
      containerRef.current.focus();
    }
  }, []);

  return (
    <>
      <a
        href="https://github.com/t0mmYch"
        target="_blank"
        rel="noopener noreferrer"
        className="github-btn"
      >
        <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span style={{fontSize: '1.35rem'}}>@t0mmych</span>
      </a>
      <div className="watermark-bg">
        <span className="watermark-text watermark-left">MyCalculator</span>
        <span className="watermark-text watermark-right">by Tommy Christ</span>
      </div>
      <div className="calculator-container" ref={containerRef}>
        <div className="calculator-expression">
          {expression}
        </div>
        <div className="calculator-display">
          {showResult ? formatDisplay(display) : ''}
        </div>
        <div className="calculator-buttons">
          {BUTTONS.map((row, i) => (
            <div className="calculator-row" key={i}>
              {row.map((btn, j) => (
                <button
                  key={j}
                  className={`calculator-btn${btn.wide ? ' zero' : ''} ${btn.type} ${btn.label === '0' && btn.wide ? 'zero' : ''}`}
                  onClick={() => handleButtonClick(btn)}
                  tabIndex={btn.type === 'icon' ? -1 : 0}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Calculator; 
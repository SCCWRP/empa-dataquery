import React from 'react';
import { createRoot } from 'react-dom/client'; // New import for React 18
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container); // Create a root.

root.render(
    <App />
);

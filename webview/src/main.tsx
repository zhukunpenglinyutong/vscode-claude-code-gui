import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 导入样式
import '@mdi/font/css/materialdesignicons.css';
import '@vscode/codicons/dist/codicon.css';
import './styles/claude-theme.css';
import 'virtual:svg-icons-register';

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

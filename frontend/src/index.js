import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App';
import { store } from './store/store';
import { SettingsProvider } from './context/SettingsContext';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Get Google Client ID from environment or use empty string
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <SettingsProvider>
          <BrowserRouter>
            <App />
            <ToastContainer position="top-right" />
          </BrowserRouter>
        </SettingsProvider>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);



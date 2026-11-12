import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import keycloak from './auth/keycloak';

async function bootstrap() {
  try {
    await keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Keycloak initialization failed:', error);

    document.getElementById('root')!.innerHTML =
      '<p>Die Anmeldung ist momentan nicht möglich.</p>';
  }
}

bootstrap();
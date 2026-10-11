import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('redirects unauthenticated visitors to the login page', async () => {
  localStorage.clear();
  render(
    <BrowserRouter>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>,
  );

  expect(await screen.findByText('Sign in to your portal')).toBeInTheDocument();
});
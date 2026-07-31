import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import CriarConta from '@/pages/CriarConta';

vi.mock('@/integrations/analytics', () => ({
  track: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  toast: vi.fn(),
  sonnerError: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/components/auth/AuthContext', () => ({
  useAuth: () => ({
    signIn: mocks.signIn,
  }),
}));

vi.mock('@/hooks/useSignUp', () => ({
  useSignUp: () => ({
    signUp: mocks.signUp,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mocks.toast,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.sonnerError,
    success: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
    },
  },
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/data/auth-testimonials', () => ({
  authTestimonials: [],
}));

const renderPage = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('fluxos de autenticação', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.signIn.mockReset().mockResolvedValue(undefined);
    mocks.signUp.mockReset().mockResolvedValue(true);
    mocks.signInWithOAuth.mockReset().mockResolvedValue({ error: null });
    mocks.toast.mockReset();
    mocks.sonnerError.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('envia credenciais no login tradicional', async () => {
    const user = userEvent.setup();
    renderPage(<Login />);

    await user.type(screen.getByPlaceholderText(/Digite seu e-mail ou celular/i), 'usuario@teste.com');
    await user.type(screen.getByPlaceholderText(/Digite sua senha/i), 'SenhaForte1!');
    await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('usuario@teste.com', 'SenhaForte1!', undefined);
    });
  });

  it('inicia OAuth do Google no login', async () => {
    const user = userEvent.setup();
    renderPage(<Login />);

    await user.click(screen.getByRole('button', { name: /Continuar com Google/i }));

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://www.metaconstrutor.app.br/app/dashboard',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
  });

  it('conclui o fluxo de criação de conta com dados válidos', async () => {
    const user = userEvent.setup();
    renderPage(<CriarConta />);

    await user.type(screen.getByPlaceholderText(/Digite seu nome completo/i), 'Usuario Teste');
    await user.click(screen.getByRole('button', { name: /^Continuar$/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/seu@email\.com/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/seu@email\.com/i), 'novo@teste.com');
    await user.type(screen.getByPlaceholderText(/\(11\) 99999-9999/i), '11999999999');
    await user.click(screen.getByRole('button', { name: /^Continuar$/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Crie uma senha forte/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/Crie uma senha forte/i), 'SenhaForte1!');
    await user.type(screen.getByPlaceholderText(/Confirme sua senha/i), 'SenhaForte1!');
    await user.click(screen.getByRole('checkbox', { name: /Concordo com os/i }));
    await user.click(screen.getByRole('button', { name: /Criar conta/i }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        name: 'Usuario Teste',
        email: 'novo@teste.com',
        phone: '(11) 99999-9999',
        password: 'SenhaForte1!',
        confirmPassword: 'SenhaForte1!',
      });
    });
  });

  it('inicia OAuth do Google na criação de conta', async () => {
    const user = userEvent.setup();
    renderPage(<CriarConta />);

    await user.click(screen.getByRole('button', { name: /Continuar com Google/i }));

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://www.metaconstrutor.app.br/app/dashboard',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
  });
});

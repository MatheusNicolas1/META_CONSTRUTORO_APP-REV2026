import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSignUp } from '@/hooks/useSignUp';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  authSignUp: vi.fn(),
  signInWithPassword: vi.fn(),
  maybeSingle: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
    auth: {
      signUp: mocks.authSignUp,
      signInWithPassword: mocks.signInWithPassword,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mocks.maybeSingle,
        }),
      }),
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

describe('useSignUp', () => {
  beforeEach(() => {
    mocks.invoke.mockReset().mockResolvedValue({ data: { allowed: true }, error: null });
    mocks.authSignUp.mockReset().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.signInWithPassword.mockReset().mockResolvedValue({ error: null });
    mocks.maybeSingle.mockReset().mockResolvedValue({ data: { id: 'user-1' }, error: null });
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
  });

  it('cria conta usando o redirect autenticado correto', async () => {
    const { result } = renderHook(() => useSignUp());

    let success = false;
    await act(async () => {
      success = await result.current.signUp({
        name: 'Usuario Teste',
        email: 'novo@teste.com',
        phone: '(11) 99999-9999',
        password: 'SenhaForte1!',
        confirmPassword: 'SenhaForte1!',
      });
    });

    expect(success).toBe(true);
    expect(mocks.authSignUp).toHaveBeenCalledWith({
      email: 'novo@teste.com',
      password: 'SenhaForte1!',
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
        data: {
          name: 'Usuario Teste',
          phone: '11999999999',
          plan_type: 'free',
          terms_accepted_at: expect.any(String),
        },
      },
    });

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'novo@teste.com',
        password: 'SenhaForte1!',
      });
    });
  });
});

export type CheckoutErrorFeedback = {
  title: string;
  description: string;
  variant?: "destructive";
  redirect?: "plan-management";
};

const getMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    return typeof maybeMessage === "string" ? maybeMessage : "";
  }
  return "";
};

export const getCheckoutErrorFeedback = (error: unknown): CheckoutErrorFeedback => {
  const rawMessage = getMessage(error);
  const message = rawMessage.toLowerCase();

  if (message.includes("active subscription already exists")) {
    return {
      title: "Assinatura ativa encontrada",
      description: "Use a area de planos para trocar de plano ou ciclo de cobranca.",
      redirect: "plan-management",
    };
  }

  if (message.includes("confirme seu e-mail") || message.includes("confirm your email") || message.includes("email not confirmed")) {
    return {
      title: "Confirme seu e-mail",
      description: "Sua conta foi criada. Confirme o e-mail e faca login para continuar o pagamento.",
      variant: "destructive",
    };
  }

  if (message.includes("informe uma senha") || message.includes("password")) {
    return {
      title: "Senha obrigatoria",
      description: "Informe uma senha com pelo menos 8 caracteres para criar a conta e seguir ao pagamento.",
      variant: "destructive",
    };
  }

  if (message.includes("user not found") || message.includes("unauthorized") || message.includes("jwt") || message.includes("session")) {
    return {
      title: "Sessao expirada",
      description: "Faca login novamente e retorne ao checkout do plano escolhido.",
      variant: "destructive",
    };
  }

  if (message.includes("plan not found") || message.includes("price id") || message.includes("no such price")) {
    return {
      title: "Plano indisponivel",
      description: "Nao foi possivel iniciar este plano agora. Volte aos planos e tente novamente.",
      variant: "destructive",
    };
  }

  if (message.includes("organization not found") || message.includes("org_members") || message.includes("organizacao")) {
    return {
      title: "Conta em preparacao",
      description: "Nao foi possivel preparar a organizacao para cobranca. Tente novamente em instantes.",
      variant: "destructive",
    };
  }

  if (message.includes("failed to fetch") || message.includes("network") || message.includes("fetch")) {
    return {
      title: "Falha de conexao",
      description: "Nao foi possivel conectar ao checkout seguro. Verifique a conexao e tente novamente.",
      variant: "destructive",
    };
  }

  if (message.includes("stripe") || message.includes("checkout") || message.includes("payment")) {
    return {
      title: "Checkout indisponivel",
      description: "Nao foi possivel abrir o pagamento seguro agora. Tente novamente em instantes.",
      variant: "destructive",
    };
  }

  return {
    title: "Nao foi possivel continuar",
    description: "Revise os dados informados e tente novamente. Se o problema persistir, fale com o suporte.",
    variant: "destructive",
  };
};

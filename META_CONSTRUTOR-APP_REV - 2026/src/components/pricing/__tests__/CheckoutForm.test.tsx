import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "../CheckoutForm";

describe("CheckoutForm", () => {
  it("submits for authenticated users when password fields are hidden", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CheckoutForm
        defaultValues={{
          name: "Eliene Santana",
          email: "eliene_fsa@hotmail.com",
          company: "Meta Construtor",
        }}
        onSubmit={onSubmit}
        showPasswordFields={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /continuar para pagamento/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

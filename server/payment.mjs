/**
 * Free stub. No acquirer and no charge.
 * PAYMENT_MODE=stub (default) or test. Any other value still does not charge:
 * a live provider is intentionally not implemented.
 */
const requested = String(process.env.PAYMENT_MODE || "stub").toLowerCase();
const stub = requested === "stub" || requested === "test" || requested === "";

export function paymentModeWarning() {
  if (stub) return "";
  return "PAYMENT_MODE is not stub; live charging is not implemented. Checkout stays a free stub.";
}

export const paymentProvider = {
  id: "test",
  title: "Тестовая оплата",

  async quote() {
    return {
      provider: "test",
      amountRub: 490,
      charged: false,
      note: stub
        ? "Списание не происходит. Это плата сервиса за готовый файл, не госпошлина."
        : "Живая касса не подключена. Списание не происходит.",
    };
  },

  async confirm() {
    return {
      provider: "test",
      charged: false,
      paid: true,
    };
  },
};

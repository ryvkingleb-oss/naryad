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
  title: "Оплата файла",

  async quote() {
    return {
      provider: "test",
      amountRub: 490,
      charged: false,
      note: "490 ₽ за один заполненный PDF. Это плата сервиса, не госпошлина. После оплаты файл скачивается в кабинете.",
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

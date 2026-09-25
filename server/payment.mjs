/**
 * Test checkout. No acquirer, no charge.
 * A live provider would implement the same two functions.
 */
export const paymentProvider = {
  id: "test",
  title: "Тестовая оплата",

  async quote() {
    return {
      provider: "test",
      amountRub: 490,
      charged: false,
      note: "Списание не происходит. Это плата сервиса за готовый файл, не госпошлина.",
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

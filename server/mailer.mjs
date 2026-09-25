/**
 * Test mailbox. Messages stay in the cabinet and are not delivered.
 * A live provider would implement send() with the same arguments.
 */
export const mailer = {
  id: "test",

  async send({ to, subject, fileName }) {
    return {
      provider: "test",
      to,
      subject,
      fileName,
      delivered: false,
      sentAt: new Date().toISOString(),
      note: "Тестовая почта: письмо сохранено в кабинете и наружу не ушло.",
    };
  },
};

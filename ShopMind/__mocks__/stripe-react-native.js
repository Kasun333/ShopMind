const React = require('react');

module.exports = {
  CardField: () => null,
  useStripe: () => ({
    createPaymentMethod: jest.fn(() => Promise.resolve({ paymentMethod: {} })),
    confirmPayment: jest.fn(() => Promise.resolve({ paymentIntent: {} })),
    handleCardAction: jest.fn(() => Promise.resolve()),
  }),
  StripeProvider: ({ children }) => children,
};
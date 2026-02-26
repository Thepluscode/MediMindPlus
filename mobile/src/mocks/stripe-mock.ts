// Mock for @stripe/stripe-react-native on web
export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
  confirmPayment: async () => ({ error: null }),
});

export const StripeProvider = ({ children }: any) => children;

export default {
  useStripe,
  StripeProvider,
};

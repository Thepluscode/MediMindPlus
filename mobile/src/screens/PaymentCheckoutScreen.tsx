/**
 * Payment Checkout Screen for MediMindPlus
 * Handles Stripe payment processing for consultations
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';
import { RootState, AppDispatch } from '../store/store';
import { confirmPayment } from '../store/slices/paymentSlice';
import { paymentAPI } from '../services/paymentAPI';

interface RouteParams {
  consultationId: string;
  paymentIntent: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
  };
}

interface Props {
  route: { params: RouteParams };
  navigation: any;
}

const PaymentCheckoutContent: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { presentPaymentSheet, initPaymentSheet } = useStripe();
  const { consultationId, paymentIntent } = route.params;

  const [loading, setLoading] = useState(false);
  const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);

  const amount = paymentIntent.amount / 100; // Convert cents to dollars

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.clientSecret,
        merchantDisplayName: 'MediMindPlus',
        appearance: {
          colors: {
            primary: '#007AFF',
            background: '#FFFFFF',
            componentBackground: '#F5F5F5',
          },
        },
        returnURL: 'medimindplus://payment-return',
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to initialize payment');
        return false;
      }

      setPaymentSheetInitialized(true);
      return true;
    } catch (error: any) {
      Alert.alert('Error', 'Failed to initialize payment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Initialize payment sheet if not already done
      if (!paymentSheetInitialized) {
        const initialized = await initializePaymentSheet();
        if (!initialized) return;
      }

      setLoading(true);

      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          // User cancelled the payment sheet
          return;
        }
        throw new Error(error.message || 'Payment failed');
      }

      // Payment successful, confirm with backend
      await dispatch(
        confirmPayment({
          consultationId,
          paymentIntentId: paymentIntent.paymentIntentId,
        })
      ).unwrap();

      // Show success message
      Alert.alert(
        'Payment Successful',
        'Your consultation has been confirmed!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Home' },
                  {
                    name: 'PaymentSuccess',
                    params: { consultationId },
                  },
                ],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel? Your booking will not be confirmed.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="card-outline" size={64} color={theme.colors.primary} />
        <Typography variant="h2" weight="bold" style={styles.title}>
          Complete Payment
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Secure payment powered by Stripe
        </Typography>
      </View>

      {/* Amount Card */}
      <View style={styles.card}>
        <Typography variant="body" color="secondary" style={styles.cardTitle}>
          Payment Amount
        </Typography>
        <View style={styles.amountContainer}>
          <Typography variant="h1" weight="bold" style={styles.currency}>
            $
          </Typography>
          <Typography variant="h1" weight="bold" style={styles.amount}>
            {amount.toFixed(2)}
          </Typography>
        </View>
        <Typography variant="caption" color="secondary" style={styles.amountDescription}>
          This is the total consultation fee
        </Typography>
      </View>

      {/* Security Info */}
      <View style={styles.securityCard}>
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          <View style={styles.securityContent}>
            <Typography variant="body" weight="semibold" style={styles.securityTitle}>
              Secure Payment
            </Typography>
            <Typography variant="body" color="secondary" style={styles.securityText}>
              Your payment information is encrypted and secure
            </Typography>
          </View>
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={24} color={theme.colors.success} />
          <View style={styles.securityContent}>
            <Typography variant="body" weight="semibold" style={styles.securityTitle}>
              PCI Compliant
            </Typography>
            <Typography variant="body" color="secondary" style={styles.securityText}>
              Stripe ensures PCI DSS compliance
            </Typography>
          </View>
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="card" size={24} color={theme.colors.success} />
          <View style={styles.securityContent}>
            <Typography variant="body" weight="semibold" style={styles.securityTitle}>
              Multiple Payment Methods
            </Typography>
            <Typography variant="body" color="secondary" style={styles.securityText}>
              Credit cards, debit cards, and more
            </Typography>
          </View>
        </View>
      </View>

      {/* Test Card Info (only in dev mode) */}
      {__DEV__ && (
        <View style={styles.testCard}>
          <Typography variant="body" weight="semibold" style={styles.testCardTitle}>
            Test Card Information
          </Typography>
          <Typography variant="body" color="secondary" style={styles.testCardText}>
            Card: 4242 4242 4242 4242
          </Typography>
          <Typography variant="body" color="secondary" style={styles.testCardText}>
            Expiry: Any future date
          </Typography>
          <Typography variant="body" color="secondary" style={styles.testCardText}>
            CVV: Any 3 digits
          </Typography>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer} accessibilityLiveRegion="polite">
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={`Pay $${amount.toFixed(2)}`}
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <View accessibilityLabel="Processing payment, please wait">
              <LoadingSpinner color={theme.colors.white} size="small" />
            </View>
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={theme.colors.white} />
              <Typography variant="body" weight="bold" style={styles.primaryButtonText}>
                Pay ${amount.toFixed(2)}
              </Typography>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Cancel payment"
          accessibilityState={{ disabled: loading }}
        >
          <Typography variant="body" weight="semibold" style={styles.secondaryButtonText}>
            Cancel
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Typography variant="caption" style={styles.termsText}>
          By completing this payment, you agree to our{' '}
          <Typography variant="caption" style={styles.termsLink}>Terms of Service</Typography> and{' '}
          <Typography variant="caption" style={styles.termsLink}>Refund Policy</Typography>.
        </Typography>
      </View>
    </ScrollView>
  );
};

const PaymentCheckoutScreen: React.FC<Props> = (props) => {
  const publishableKey = paymentAPI.getStripePublishableKey();

  return (
    <StripeProvider publishableKey={publishableKey}>
      <PaymentCheckoutContent {...props} />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  currency: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  amount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  amountDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  securityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  securityContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  securityText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  testCard: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  testCardText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'monospace',
  },
  actionContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default PaymentCheckoutScreen;

/**
 * Booking Confirmation Screen for MediMindPlus
 * Displays consultation details and initiates payment flow
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';
import { RootState, AppDispatch } from '../store/store';
import { createPaymentIntent } from '../store/slices/paymentSlice';
import { getConsultationById } from '../store/slices/consultationSlice';

interface RouteParams {
  consultationId: string;
}

interface Props {
  route: { params: RouteParams };
  navigation: any;
}

const BookingConfirmationScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { consultationId } = route.params;

  const { currentConsultation, isLoading: consultationLoading } = useSelector(
    (state: RootState) => state.consultation
  );
  const { paymentIntent, isLoading: paymentLoading } = useSelector(
    (state: RootState) => state.payment
  );

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  useEffect(() => {
    // Navigate to payment screen once payment intent is created
    if (paymentIntent && !paymentLoading && !initialLoad) {
      navigation.navigate('PaymentCheckout', {
        consultationId,
        paymentIntent,
      });
    }
  }, [paymentIntent, paymentLoading]);

  const loadConsultation = async () => {
    try {
      await dispatch(getConsultationById(consultationId)).unwrap();
      setInitialLoad(false);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to load consultation details');
    }
  };

  const handleProceedToPayment = async () => {
    if (!currentConsultation) return;

    try {
      await dispatch(
        createPaymentIntent({
          consultationId: currentConsultation.id,
          amount: currentConsultation.consultationFee,
        })
      ).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to create payment');
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (consultationLoading || initialLoad) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading consultation details..."
        color={theme.colors.primary}
      />
    );
  }

  if (!currentConsultation) {
    return (
      <View style={styles.errorContainer} accessibilityLiveRegion="assertive">
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Typography variant="body" weight="semibold" style={styles.errorText}>
          Consultation not found
        </Typography>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to previous screen"
        >
          <Typography variant="body" weight="semibold" style={styles.backButtonText}>
            Go Back
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const provider = currentConsultation.provider;
  const fee = currentConsultation.consultationFee / 100; // Convert cents to dollars

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
        <Typography variant="h2" weight="bold" style={styles.successTitle}>
          Booking Confirmed!
        </Typography>
        <Typography variant="body" color="secondary" style={styles.successSubtitle}>
          Your consultation has been scheduled
        </Typography>
      </View>

      {/* Consultation Details Card */}
      <View style={styles.card}>
        <Typography variant="h3" weight="bold" style={styles.cardTitle}>
          Consultation Details
        </Typography>

        {/* Provider Info */}
        {provider && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Typography variant="caption" color="secondary" style={styles.detailLabel}>
                Provider
              </Typography>
              <Typography variant="body" weight="semibold" style={styles.detailValue}>
                Dr. {provider.firstName} {provider.lastName}
              </Typography>
              <Typography variant="body" style={styles.detailSubtext}>
                {provider.specialty}
              </Typography>
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          <View style={styles.detailContent}>
            <Typography variant="caption" color="secondary" style={styles.detailLabel}>
              Date
            </Typography>
            <Typography variant="body" weight="semibold" style={styles.detailValue}>
              {formatDate(currentConsultation.scheduledStart)}
            </Typography>
          </View>
        </View>

        {/* Time */}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <View style={styles.detailContent}>
            <Typography variant="caption" color="secondary" style={styles.detailLabel}>
              Time
            </Typography>
            <Typography variant="body" weight="semibold" style={styles.detailValue}>
              {formatTime(currentConsultation.scheduledStart)} -{' '}
              {formatTime(currentConsultation.scheduledEnd)}
            </Typography>
          </View>
        </View>

        {/* Type */}
        <View style={styles.detailRow}>
          <Ionicons name="medical-outline" size={24} color={theme.colors.primary} />
          <View style={styles.detailContent}>
            <Typography variant="caption" color="secondary" style={styles.detailLabel}>
              Consultation Type
            </Typography>
            <Typography variant="body" weight="semibold" style={styles.detailValue}>
              {currentConsultation.consultationType.replace(/_/g, ' ')}
            </Typography>
          </View>
        </View>

        {/* Reason */}
        {currentConsultation.reasonForVisit && (
          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Typography variant="caption" color="secondary" style={styles.detailLabel}>
                Reason for Visit
              </Typography>
              <Typography variant="body" weight="semibold" style={styles.detailValue}>
                {currentConsultation.reasonForVisit}
              </Typography>
            </View>
          </View>
        )}
      </View>

      {/* Payment Summary Card */}
      <View style={styles.card}>
        <Typography variant="h3" weight="bold" style={styles.cardTitle}>
          Payment Summary
        </Typography>

        <View style={styles.paymentRow}>
          <Typography variant="body" color="secondary" style={styles.paymentLabel}>
            Consultation Fee
          </Typography>
          <Typography variant="body" weight="medium" style={styles.paymentValue}>
            ${fee.toFixed(2)}
          </Typography>
        </View>

        <View style={styles.divider} />

        <View style={styles.paymentRow}>
          <Typography variant="body" weight="bold" style={styles.totalLabel}>
            Total Amount
          </Typography>
          <Typography variant="h3" weight="bold" style={styles.totalValue}>
            ${fee.toFixed(2)}
          </Typography>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Typography variant="body" style={styles.infoText}>
            Payment will be processed securely through Stripe
          </Typography>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer} accessibilityLiveRegion="polite">
        <TouchableOpacity
          style={[
            styles.primaryButton,
            paymentLoading && styles.buttonDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={paymentLoading}
          accessibilityRole="button"
          accessibilityLabel="Proceed to payment"
          accessibilityState={{ disabled: paymentLoading }}
        >
          {paymentLoading ? (
            <View accessibilityLabel="Creating payment, please wait">
              <LoadingSpinner color={theme.colors.white} size="small" />
            </View>
          ) : (
            <>
              <Typography variant="body" weight="bold" style={styles.primaryButtonText}>
                Proceed to Payment
              </Typography>
              <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancelBooking}
          disabled={paymentLoading}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
          accessibilityState={{ disabled: paymentLoading }}
        >
          <Typography variant="body" weight="semibold" style={styles.secondaryButtonText}>
            Cancel Booking
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Note */}
      <View style={styles.noteContainer}>
        <Typography variant="body" style={styles.noteText}>
          Note: You can reschedule or cancel your appointment up to 24 hours
          before the scheduled time for a full refund.
        </Typography>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorText: {
    marginTop: theme.spacing.lg,
    fontSize: 18,
    color: theme.colors.error,
    fontWeight: '600',
  },
  backButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  detailContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  detailSubtext: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  paymentLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.primary,
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
    marginRight: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: theme.colors.warningLight,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default BookingConfirmationScreen;

/**
 * Payment Success Screen for MediMindPlus
 * Displays success message after successful payment
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';
import { RootState, AppDispatch } from '../store/store';
import { getConsultationById } from '../store/slices/consultationSlice';

interface RouteParams {
  consultationId: string;
}

interface Props {
  route: { params: RouteParams };
  navigation: any;
}

const PaymentSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { consultationId } = route.params;

  const { currentConsultation } = useSelector(
    (state: RootState) => state.consultation
  );

  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    // Load consultation details
    dispatch(getConsultationById(consultationId));

    // Animate success icon
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [consultationId]);

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

  const handleViewConsultation = () => {
    navigation.navigate('ConsultationDetails', { consultationId });
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleViewReceipt = () => {
    navigation.navigate('PaymentHistory');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Animation */}
      <Animated.View
        style={[
          styles.successIconContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons name="checkmark-circle" size={120} color={theme.colors.success} />
      </Animated.View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Typography variant="h2" weight="bold" style={styles.successTitle}>
          Payment Successful!
        </Typography>
        <Typography variant="body" color="secondary" style={styles.successSubtitle}>
          Your consultation has been confirmed
        </Typography>
      </View>

      {/* Consultation Summary */}
      {currentConsultation && (
        <View style={styles.card}>
          <Typography variant="h3" weight="bold" style={styles.cardTitle}>
            Consultation Details
          </Typography>

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

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Typography variant="caption" color="secondary" style={styles.detailLabel}>
                Time
              </Typography>
              <Typography variant="body" weight="semibold" style={styles.detailValue}>
                {formatTime(currentConsultation.scheduledStart)}
              </Typography>
            </View>
          </View>

          {currentConsultation.provider && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
              <View style={styles.detailContent}>
                <Typography variant="caption" color="secondary" style={styles.detailLabel}>
                  Provider
                </Typography>
                <Typography variant="body" weight="semibold" style={styles.detailValue}>
                  Dr. {currentConsultation.provider.firstName}{' '}
                  {currentConsultation.provider.lastName}
                </Typography>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Typography variant="caption" color="secondary" style={styles.detailLabel}>
                Amount Paid
              </Typography>
              <Typography variant="body" weight="semibold" style={styles.detailValue}>
                ${(currentConsultation.consultationFee / 100).toFixed(2)}
              </Typography>
            </View>
          </View>
        </View>
      )}

      {/* Next Steps Card */}
      <View style={styles.card}>
        <Typography variant="h3" weight="bold" style={styles.cardTitle}>
          What's Next?
        </Typography>

        <View style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Typography variant="body" weight="bold" style={styles.stepNumberText}>
              1
            </Typography>
          </View>
          <View style={styles.stepContent}>
            <Typography variant="body" weight="semibold" style={styles.stepTitle}>
              Check Your Email
            </Typography>
            <Typography variant="body" color="secondary" style={styles.stepText}>
              We've sent a confirmation email with consultation details
            </Typography>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Typography variant="body" weight="bold" style={styles.stepNumberText}>
              2
            </Typography>
          </View>
          <View style={styles.stepContent}>
            <Typography variant="body" weight="semibold" style={styles.stepTitle}>
              Join the Video Call
            </Typography>
            <Typography variant="body" color="secondary" style={styles.stepText}>
              You'll receive a notification when it's time to join
            </Typography>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Typography variant="body" weight="bold" style={styles.stepNumberText}>
              3
            </Typography>
          </View>
          <View style={styles.stepContent}>
            <Typography variant="body" weight="semibold" style={styles.stepTitle}>
              Share Your Health Data
            </Typography>
            <Typography variant="body" color="secondary" style={styles.stepText}>
              Optionally share your vitals during the consultation
            </Typography>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewConsultation}
          accessibilityRole="button"
          accessibilityLabel="View consultation details"
        >
          <Typography variant="body" weight="bold" style={styles.primaryButtonText}>
            View Consultation
          </Typography>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewReceipt}
          accessibilityRole="button"
          accessibilityLabel="View payment receipt"
        >
          <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
          <Typography variant="body" weight="semibold" style={styles.secondaryButtonText}>
            View Receipt
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={handleGoHome}
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
        >
          <Typography variant="body" weight="medium" style={styles.textButtonText}>
            Go to Home
          </Typography>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  successIconContainer: {
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    width: '100%',
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  stepText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    width: '100%',
    marginTop: theme.spacing.sm,
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
  secondaryButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  textButton: {
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PaymentSuccessScreen;

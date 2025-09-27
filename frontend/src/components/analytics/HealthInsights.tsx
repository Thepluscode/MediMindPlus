import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../theme/theme';

interface HealthInsightsProps {
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface InsightItemProps {
  text: string;
  type: 'insight' | 'recommendation' | 'risk';
  index: number;
}

const InsightItem: React.FC<InsightItemProps> = ({ text, type, index }) => {
  const getIcon = () => {
    switch (type) {
      case 'insight':
        return 'lightbulb-outline';
      case 'recommendation':
        return 'recommend';
      case 'risk':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'insight':
        return theme.colors.info;
      case 'recommendation':
        return theme.colors.success;
      case 'risk':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'insight':
        return `${theme.colors.info}15`;
      case 'recommendation':
        return `${theme.colors.success}15`;
      case 'risk':
        return `${theme.colors.warning}15`;
      default:
        return theme.colors.surface;
    }
  };

  return (
    <View style={[styles.insightItem, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.insightHeader}>
        <Icon name={getIcon()} size={20} color={getColor()} />
        <View style={[styles.indexBadge, { backgroundColor: getColor() }]}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
      </View>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
};

const HealthInsights: React.FC<HealthInsightsProps> = ({
  insights,
  recommendations,
  riskFactors,
  isLoading = false,
  onRefresh
}) => {
  const hasData = insights.length > 0 || recommendations.length > 0 || riskFactors.length > 0;

  if (!hasData && !isLoading) {
    return (
      <Card containerStyle={styles.card}>
        <View style={styles.emptyState}>
          <Icon name="insights" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Insights Available</Text>
          <Text style={styles.emptySubtitle}>
            Add more health data to generate personalized insights
          </Text>
          {onRefresh && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Icon name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.refreshText}>Refresh Insights</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="insights" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>Health Insights</Text>
        </View>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh}>
            <Icon name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{insights.length}</Text>
          <Text style={styles.summaryLabel}>Insights</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{recommendations.length}</Text>
          <Text style={styles.summaryLabel}>Recommendations</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{riskFactors.length}</Text>
          <Text style={styles.summaryLabel}>Risk Factors</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.sectionTitle}>Risk Factors</Text>
            </View>
            {riskFactors.map((risk, index) => (
              <InsightItem
                key={`risk-${index}`}
                text={risk}
                type="risk"
                index={index}
              />
            ))}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lightbulb-outline" size={20} color={theme.colors.info} />
              <Text style={styles.sectionTitle}>Key Insights</Text>
            </View>
            {insights.map((insight, index) => (
              <InsightItem
                key={`insight-${index}`}
                text={insight}
                type="insight"
                index={index}
              />
            ))}
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="recommend" size={20} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            {recommendations.map((recommendation, index) => (
              <InsightItem
                key={`recommendation-${index}`}
                text={recommendation}
                type="recommendation"
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  refreshIcon: {
    padding: 4,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  insightItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  refreshText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default HealthInsights;

// Export the component for use in other files
export { HealthInsights };

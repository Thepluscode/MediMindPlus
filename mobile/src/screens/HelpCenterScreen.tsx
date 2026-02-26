import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

type HelpCenterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'HelpCenter'>;
};

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  icon?: string;
}

const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      setLoading(true);
      const [articlesRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:3000/api/settings/help/articles'),
        axios.get('http://localhost:3000/api/settings/help/categories'),
      ]);

      setArticles(articlesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load help articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHelpData();
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get('http://localhost:3000/api/settings/help/search', {
        params: { q: searchQuery },
      });
      setArticles(response.data);
      setSelectedCategory(null);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      loadHelpData();
      return;
    }

    try {
      setLoading(true);
      setSelectedCategory(category);
      const response = await axios.get('http://localhost:3000/api/settings/help/articles', {
        params: { category },
      });
      setArticles(response.data);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to filter articles');
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = async (articleId: string) => {
    if (expandedArticle === articleId) {
      setExpandedArticle(null);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/settings/help/article/${articleId}`);
      setExpandedArticle(articleId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load article');
    }
  };

  const getIconForCategory = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Getting Started': 'rocket-outline',
      'Account Management': 'person-outline',
      'Health Features': 'fitness-outline',
      'Privacy & Security': 'lock-closed-outline',
      'Troubleshooting': 'construct-outline',
    };
    return iconMap[category] || 'help-circle-outline';
  };

  if (loading && articles.length === 0) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading help articles..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="help-circle-outline" color="white" size={60} importantForAccessibility="no" accessible={false} />
        </View>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Help Center
        </Typography>
        <Typography variant="body" style={styles.headerSubtitle}>
          Find answers to your questions
        </Typography>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Help center content" accessibilityRole="scrollview">
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={24}
                color={theme.colors.textSecondary}
                style={styles.searchIcon}
                importantForAccessibility="no"
                accessible={false}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for help..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="Search help articles"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    loadHelpData();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  accessibilityHint="Clear search text and reload all articles"
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                (searching || !searchQuery.trim()) && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={searching || !searchQuery.trim()}
              accessibilityRole="button"
              accessibilityLabel="Search help articles"
              accessibilityHint="Search for help articles matching your query"
              accessibilityState={{ disabled: searching || !searchQuery.trim() }}
            >
              {searching ? (
                <LoadingSpinner color="white" size="small" />
              ) : (
                <Typography variant="body" weight="semibold" style={styles.searchButtonText}>
                  Search
                </Typography>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesContainer}>
            <Typography variant="h3" weight="semibold" style={styles.categoriesTitle}>
              Browse by Category
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => handleCategoryFilter(category)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${category}`}
                  accessibilityHint={selectedCategory === category ? 'Currently selected. Tap to show all categories' : `Show only ${category} articles`}
                  accessibilityState={{ selected: selectedCategory === category }}
                >
                  <Ionicons
                    name={getIconForCategory(category) as any}
                    size={20}
                    color={selectedCategory === category ? 'white' : theme.colors.primary}
                    style={{ marginRight: 6 }}
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {articles.length === 0 ? (
            <Card style={styles.noResultsCard}>
              <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="semibold" style={styles.noResultsText}>
                No articles found
              </Typography>
              <Typography variant="body" color="secondary" style={styles.noResultsSubtext}>
                Try adjusting your search or browse by category
              </Typography>
            </Card>
          ) : (
            <View style={styles.articlesContainer}>
              <Typography variant="h3" weight="semibold" style={styles.articlesTitle}>
                {selectedCategory
                  ? `${selectedCategory} (${articles.length})`
                  : searchQuery
                  ? `Search Results (${articles.length})`
                  : `All Articles (${articles.length})`}
              </Typography>

              {articles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => handleArticlePress(article.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${article.title} article`}
                  accessibilityHint={expandedArticle === article.id ? 'Tap to collapse article' : 'Tap to read full article'}
                >
                  <Card style={styles.articleCard}>
                    <View style={styles.articleHeader}>
                      <View style={styles.articleIconContainer}>
                        <Ionicons
                          name={(article.icon || getIconForCategory(article.category)) as any}
                          size={28}
                          color={theme.colors.primary}
                          importantForAccessibility="no"
                          accessible={false}
                        />
                      </View>
                      <View style={styles.articleInfo}>
                        <Typography variant="body" weight="semibold" style={styles.articleTitle}>
                          {article.title}
                        </Typography>
                        <Typography variant="caption" color="secondary" style={styles.articleCategory}>
                          {article.category}
                        </Typography>
                      </View>
                      <Ionicons
                        name={expandedArticle === article.id ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={theme.colors.textSecondary}
                        importantForAccessibility="no"
                        accessible={false}
                      />
                    </View>
                    {article.summary && (
                      <Typography variant="body" color="secondary" style={styles.articleSummary}>
                        {article.summary}
                      </Typography>
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Card style={styles.contactCard}>
            <Typography variant="h3" weight="bold" style={styles.contactTitle}>
              Still Need Help?
            </Typography>
            <View style={styles.contactDivider} />
            <Typography variant="body" color="secondary" style={styles.contactText}>
              Can't find what you're looking for? Our support team is here to help.
            </Typography>
            <View style={styles.contactMethods}>
              <View style={styles.contactMethod}>
                <Ionicons name="mail" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" style={styles.contactMethodText}>
                  support@medimind.com
                </Typography>
              </View>
              <View style={styles.contactMethod}>
                <Ionicons name="call" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" style={styles.contactMethodText}>
                  1-800-MEDIMIND
                </Typography>
              </View>
              <View style={styles.contactMethod}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" style={styles.contactMethodText}>
                  Mon-Fri: 9AM - 5PM EST
                </Typography>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('ContactUs')}
              accessibilityRole="button"
              accessibilityLabel="Contact support"
              accessibilityHint="Go to contact form to send a message to support team"
            >
              <Ionicons name="mail-outline" color="white" size={20} style={{ marginRight: 10 }} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" style={styles.contactButtonText}>
                Contact Support
              </Typography>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.xxl,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: theme.colors.white,
  },
  noResultsCard: {
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  articlesContainer: {
    marginBottom: theme.spacing.lg,
  },
  articlesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  articleCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  articleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  articleCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  articleSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  contactCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#E3F2FD',
    marginBottom: theme.spacing.xxl,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  contactDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  contactMethods: {
    marginBottom: theme.spacing.lg,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    justifyContent: 'center',
  },
  contactMethodText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpCenterScreen;

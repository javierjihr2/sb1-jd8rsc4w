import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FeedbackSystem } from '../components/FeedbackSystem';
import { UserReviews } from '../components/UserReviews';
import { FeedbackStats } from '../components/FeedbackStats';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

const { width } = Dimensions.get('window');

export default function FeedbackScreen() {
  const { user } = useAuth();
  const { getFeedbackStats, loading } = useFeedback();
  const [activeTab, setActiveTab] = useState<'reviews' | 'feedback' | 'stats'>('reviews');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    trackScreenView();
  }, []);

  const trackScreenView = async () => {
    await analyticsManager.trackEvent('feedback_screen_viewed', {
      userId: user?.uid,
      timestamp: new Date().toISOString(),
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const renderTabBar = () => {
    const tabs = [
      { key: 'reviews', label: 'Reseñas', icon: 'chatbubbles-outline' },
      { key: 'feedback', label: 'Feedback', icon: 'send-outline' },
      { key: 'stats', label: 'Estadísticas', icon: 'analytics-outline' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };





  const renderContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <UserReviews
            targetType="app"
            targetId="squadup"
            onAddReview={() => setShowFeedbackModal(true)}
          />
        );
      case 'feedback':
        return (
          <View style={styles.feedbackContent}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>¡Tu opinión es importante!</Text>
              <Text style={styles.feedbackSubtitle}>
                Ayúdanos a mejorar SquadGO compartiendo tu experiencia.
                Tu feedback nos permite crear una mejor plataforma para todos.
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => setShowFeedbackModal(true)}
            >
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.feedbackButtonText}>Enviar Feedback</Text>
            </TouchableOpacity>

            <View style={styles.feedbackTypes}>
              <Text style={styles.sectionTitle}>¿Qué tipo de feedback quieres enviar?</Text>
              
              {[
                { key: 'app', label: 'Sobre la aplicación', icon: 'phone-portrait-outline', desc: 'Experiencia general de uso' },
                { key: 'feature', label: 'Nueva funcionalidad', icon: 'bulb-outline', desc: 'Ideas para nuevas características' },
                { key: 'bug', label: 'Reportar error', icon: 'bug-outline', desc: 'Problemas técnicos encontrados' },
                { key: 'suggestion', label: 'Sugerencia', icon: 'chatbubble-outline', desc: 'Mejoras y recomendaciones' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={styles.feedbackTypeCard}
                  onPress={() => setShowFeedbackModal(true)}
                >
                  <Ionicons name={type.icon as any} size={24} color="#007AFF" />
                  <View style={styles.feedbackTypeContent}>
                    <Text style={styles.feedbackTypeTitle}>{type.label}</Text>
                    <Text style={styles.feedbackTypeDesc}>{type.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'stats':
        return <FeedbackStats />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback & Reseñas</Text>
        <View style={styles.placeholder} />
      </View>

      {renderTabBar()}
      {renderContent()}

      <FeedbackSystem
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        targetType="app"
        targetId="squadup"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  feedbackContent: {
    flex: 1,
    padding: 20,
  },
  feedbackHeader: {
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  feedbackTypes: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  feedbackTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  feedbackTypeContent: {
    flex: 1,
    marginLeft: 12,
  },
  feedbackTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  feedbackTypeDesc: {
    fontSize: 14,
    color: '#666',
  },

});
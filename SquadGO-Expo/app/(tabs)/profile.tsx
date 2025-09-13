import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContextSimple';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Post } from '../../lib/types';
import UserPostsFeed from '../../components/UserPostsFeed';
import AdvancedPostCreator from '../../components/AdvancedPostCreator';
import { responsiveSpacing } from '../../utils/responsive';
import { AdvancedProfile } from '../../components/modern/AdvancedProfile';

const countries = [
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'RU', name: 'Rusia', flag: '🇷🇺' },
  { code: 'TR', name: 'Turquía', flag: '🇹🇷' },
];

const Profile = () => {
  const insets = useSafeAreaInsets();
  const { user, profile, updateProfile } = useAuth();
  
  // Adaptador para convertir PlayerProfile a UserProfile
  const adaptedProfile = profile ? {
    id: profile.id,
    username: profile.username || profile.displayName,
    displayName: profile.displayName,
    bio: profile.bio || '',
    avatar: profile.avatarUrl || profile.avatar || '',
    coverImage: profile.coverPhotoUrl || '',
    isVerified: false,
    isPremium: false,
    isInfluencer: false,
    level: profile.level || 1,
    experience: 0,
    nextLevelExp: 1000,
    joinedAt: profile.createdAt ? profile.createdAt.getTime() : Date.now(),
    location: profile.region,
    website: undefined,
    socialLinks: {
      instagram: undefined,
      twitter: undefined,
      youtube: undefined,
      tiktok: undefined,
      twitch: undefined,
    },
    badges: [],
    achievements: [],
    stats: {
       followers: 0,
       following: 0,
       posts: 0,
       likes: 0,
       views: 0,
       shares: 0,
       comments: 0,
       saves: 0,
       engagement: 0,
       engagementRate: 0,
       avgLikes: 0,
       avgComments: 0,
       topHashtags: [],
       bestPerformingPost: undefined,
       growthRate: 0,
       activeHours: [],
       audienceAge: [],
       audienceGender: { male: 50, female: 50, other: 0 },
       audienceLocation: []
     },
    theme: {
       id: 'default',
       name: 'Default Theme',
       isPremium: false,
       primaryColor: '#6366f1',
       secondaryColor: '#8b5cf6',
       accentColor: '#f59e0b',
       backgroundColor: '#0f172a',
       textColor: '#f8fafc',
       cardColor: '#1e293b',
       borderColor: '#334155',
       gradientDirection: 'diagonal' as const,
       borderRadius: 12,
       fontFamily: 'Inter',
       isDark: true
     },
    isOnline: true,
    lastSeen: undefined,
    privacySettings: {
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowMessages: 'everyone' as const,
      showActivity: true
    }
  } : null;
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <AdvancedProfile
      profile={adaptedProfile}
      posts={[]}
      isOwnProfile={true}
      currentUserId={user?.uid || ''}
      onEditProfile={() => setEditing(true)}
    />
  );
}

export default Profile;
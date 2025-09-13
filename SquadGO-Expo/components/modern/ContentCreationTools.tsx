import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Animated
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
// import * as VideoThumbnails from 'expo-video-thumbnails';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface Filter {
  id: string;
  name: string;
  preview: string;
  intensity: number;
  type: 'color' | 'vintage' | 'artistic' | 'beauty' | 'cinematic';
  isPremium: boolean;
}

interface Effect {
  id: string;
  name: string;
  icon: string;
  preview: string;
  category: 'face' | 'background' | 'object' | 'text' | 'transition';
  isPremium: boolean;
  duration?: number;
}

interface Template {
  id: string;
  name: string;
  thumbnail: string;
  duration: number;
  category: 'trending' | 'music' | 'dance' | 'comedy' | 'educational' | 'lifestyle';
  isPremium: boolean;
  elements: TemplateElement[];
}

interface TemplateElement {
  type: 'text' | 'image' | 'video' | 'audio' | 'effect';
  startTime: number;
  duration: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: any;
}

interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  uri: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  thumbnail: string;
  duration: number;
  lastModified: number;
  assets: MediaAsset[];
  timeline: TimelineItem[];
  settings: ProjectSettings;
}

interface TimelineItem {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  startTime: number;
  duration: number;
  track: number;
  asset?: MediaAsset;
  properties: any;
}

interface ProjectSettings {
  resolution: '720p' | '1080p' | '4K';
  fps: 24 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

interface ContentCreationToolsProps {
  projects: Project[];
  templates: Template[];
  filters: Filter[];
  effects: Effect[];
  onCreateProject?: () => void;
  onOpenProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onPublishContent?: (project: Project, platforms: string[]) => void;
  onSaveProject?: (project: Project) => void;
}

const CREATION_MODES = [
  { id: 'camera', name: 'Cámara', icon: 'camera', color: '#FF6B35' },
  { id: 'video', name: 'Video', icon: 'videocam', color: '#E91E63' },
  { id: 'photo', name: 'Foto', icon: 'image', color: '#9C27B0' },
  { id: 'template', name: 'Plantilla', icon: 'layers', color: '#3F51B5' },
  { id: 'live', name: 'En Vivo', icon: 'radio', color: '#F44336' },
  { id: 'story', name: 'Historia', icon: 'add-circle', color: '#FF9800' },
];

const FILTER_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'color', name: 'Color' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'artistic', name: 'Artístico' },
  { id: 'beauty', name: 'Belleza' },
  { id: 'cinematic', name: 'Cinemático' },
];

const EFFECT_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'face', name: 'Cara' },
  { id: 'background', name: 'Fondo' },
  { id: 'object', name: 'Objeto' },
  { id: 'text', name: 'Texto' },
  { id: 'transition', name: 'Transición' },
];

const PUBLISHING_PLATFORMS = [
  { id: 'squadgo', name: 'SquadGO', icon: 'people', color: '#FF6B35' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'twitter', name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
];

export const ContentCreationTools: React.FC<ContentCreationToolsProps> = ({
  projects,
  templates,
  filters,
  effects,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
  onPublishContent,
  onSaveProject
}) => {
  const [selectedMode, setSelectedMode] = useState('camera');
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [effectCategory, setEffectCategory] = useState('all');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['squadgo']);
  const [publishCaption, setPublishCaption] = useState('');
  const [publishTags, setPublishTags] = useState('');

  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Pulse animation for recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return bytes + ' B';
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    // Here you would save the recorded content
    Alert.alert('Grabación guardada', 'Tu contenido ha sido guardado en borradores.');
  };

  const openEditor = (project?: Project) => {
    setSelectedProject(project || null);
    setShowEditor(true);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const publishContent = () => {
    if (selectedProject && selectedPlatforms.length > 0) {
      onPublishContent?.(selectedProject, selectedPlatforms);
      setShowPublish(false);
      Alert.alert('Contenido publicado', 'Tu contenido ha sido publicado exitosamente.');
    }
  };

  const renderCreationModes = () => {
    return (
      <View style={styles.creationModes}>
        <Text style={styles.sectionTitle}>Crear Contenido</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CREATION_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeItem,
                selectedMode === mode.id && styles.selectedMode
              ]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <LinearGradient
                colors={[mode.color, mode.color + '80'] as const}
                style={styles.modeGradient}
              >
                <Ionicons name={mode.icon as any} size={24} color="white" />
              </LinearGradient>
              <Text style={styles.modeName}>{mode.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderProjects = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Proyectos</Text>
          <TouchableOpacity onPress={onCreateProject}>
            <Ionicons name="add" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectItem}
              onPress={() => onOpenProject?.(project.id)}
              onLongPress={() => {
                Alert.alert(
                  'Opciones del Proyecto',
                  project.name,
                  [
                    { text: 'Abrir', onPress: () => onOpenProject?.(project.id) },
                    { text: 'Editar', onPress: () => openEditor(project) },
                    { text: 'Eliminar', onPress: () => onDeleteProject?.(project.id), style: 'destructive' },
                    { text: 'Cancelar', style: 'cancel' }
                  ]
                );
              }}
            >
              <Image source={{ uri: project.thumbnail }} style={styles.projectThumbnail} />
              <View style={styles.projectOverlay}>
                <Text style={styles.projectDuration}>{formatTime(project.duration)}</Text>
              </View>
              <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
              <Text style={styles.projectDate}>
                {new Date(project.lastModified).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQuickActions = () => {
    return (
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowTemplates(true)}
        >
          <LinearGradient
            colors={['#9C27B0', '#E91E63'] as const}
            style={styles.quickActionGradient}
          >
            <Ionicons name="layers" size={20} color="white" />
            <Text style={styles.quickActionText}>Plantillas</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowFilters(true)}
        >
          <LinearGradient
            colors={['#FF6B35', '#FF8A65'] as const}
            style={styles.quickActionGradient}
          >
            <Ionicons name="color-filter" size={20} color="white" />
            <Text style={styles.quickActionText}>Filtros</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowEffects(true)}
        >
          <LinearGradient
            colors={['#3F51B5', '#5C6BC0'] as const}
            style={styles.quickActionGradient}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.quickActionText}>Efectos</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => openEditor()}
        >
          <LinearGradient
            colors={['#4CAF50', '#66BB6A'] as const}
            style={styles.quickActionGradient}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.quickActionText}>Editor</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCameraInterface = () => {
    if (selectedMode !== 'camera') return null;

    return (
      <View style={styles.cameraInterface}>
        <View style={styles.cameraPreview}>
          {/* Camera preview would go here */}
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera" size={60} color="#ccc" />
            <Text style={styles.cameraPlaceholderText}>Vista previa de cámara</Text>
          </View>
          
          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="flash" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Recording Button */}
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Animated.View
                style={[
                  styles.recordButtonInner,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isRecording ? '#F44336' : '#FF6B35'
                  }
                ]}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'radio-button-on'}
                  size={30}
                  color="white"
                />
              </Animated.View>
            </TouchableOpacity>
            
            {isRecording && (
              <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTemplatesModal = () => {
    return (
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Plantillas</Text>
            <TouchableOpacity>
              <Ionicons name="search" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={templates}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateItem}
                onPress={() => {
                  setShowTemplates(false);
                  // Use template logic here
                }}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.templateThumbnail} />
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateCategory}>{item.category}</Text>
                  <Text style={styles.templateDuration}>{formatTime(item.duration)}</Text>
                </View>
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={12} color="#FFD700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.templatesList}
          />
        </View>
      </Modal>
    );
  };

  const renderFiltersModal = () => {
    const filteredFilters = filterCategory === 'all'
      ? filters
      : filters.filter(filter => filter.type === filterCategory);

    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtros</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {/* Filter Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {FILTER_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  filterCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setFilterCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    filterCategory === category.id && styles.selectedCategoryText
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <FlatList
            data={filteredFilters}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedFilter?.id === item.id && styles.selectedFilter
                ]}
                onPress={() => setSelectedFilter(item)}
              >
                <Image source={{ uri: item.preview }} style={styles.filterPreview} />
                <Text style={styles.filterName}>{item.name}</Text>
                {item.isPremium && (
                  <View style={styles.premiumIndicator}>
                    <Ionicons name="diamond" size={10} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      </Modal>
    );
  };

  const renderPublishModal = () => {
    return (
      <Modal
        visible={showPublish}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPublish(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPublish(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Publicar Contenido</Text>
            <TouchableOpacity onPress={publishContent}>
              <Text style={styles.publishButton}>Publicar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.publishContent}>
            {/* Content Preview */}
            {selectedProject && (
              <View style={styles.contentPreview}>
                <Image
                  source={{ uri: selectedProject.thumbnail }}
                  style={styles.contentThumbnail}
                />
                <Text style={styles.contentTitle}>{selectedProject.name}</Text>
              </View>
            )}
            
            {/* Caption */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Escribe una descripción..."
                value={publishCaption}
                onChangeText={setPublishCaption}
                multiline
                maxLength={2200}
              />
              <Text style={styles.characterCount}>
                {publishCaption.length}/2200
              </Text>
            </View>
            
            {/* Tags */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Etiquetas</Text>
              <TextInput
                style={styles.tagsInput}
                placeholder="#etiqueta1 #etiqueta2 #etiqueta3"
                value={publishTags}
                onChangeText={setPublishTags}
              />
            </View>
            
            {/* Platforms */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Plataformas</Text>
              <View style={styles.platformsGrid}>
                {PUBLISHING_PLATFORMS.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformItem,
                      selectedPlatforms.includes(platform.id) && styles.selectedPlatform
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <Ionicons
                      name={platform.icon as any}
                      size={24}
                      color={selectedPlatforms.includes(platform.id) ? platform.color : '#ccc'}
                    />
                    <Text
                      style={[
                        styles.platformName,
                        selectedPlatforms.includes(platform.id) && styles.selectedPlatformName
                      ]}
                    >
                      {platform.name}
                    </Text>
                    {selectedPlatforms.includes(platform.id) && (
                      <Ionicons name="checkmark-circle" size={16} color={platform.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E'] as const}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Contenido</Text>
          <TouchableOpacity onPress={() => setShowPublish(true)}>
            <Ionicons name="cloud-upload" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCreationModes()}
        {renderCameraInterface()}
        {renderQuickActions()}
        {renderProjects()}
      </ScrollView>
      
      {/* Modals */}
      {renderTemplatesModal()}
      {renderFiltersModal()}
      {renderPublishModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  creationModes: {
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.lg,
  },
  modeItem: {
    alignItems: 'center',
    marginRight: theme.spacing.xl,
    width: 80,
  },
  selectedMode: {
    transform: [{ scale: 1.1 }],
  },
  modeGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  cameraInterface: {
    height: 400,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: 15,
    overflow: 'hidden',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholderText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
  cameraControls: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingControls: {
    position: 'absolute',
    bottom: theme.spacing['2xl'],
    alignSelf: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTime: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  projectItem: {
    width: 120,
    marginRight: theme.spacing.lg,
  },
  projectThumbnail: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  projectOverlay: {
    position: 'absolute',
    bottom: 50,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectDuration: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 12,
    color: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  publishButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  templatesList: {
    padding: theme.spacing.xl,
  },
  templateItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  templateThumbnail: {
    width: '100%',
    height: 120,
  },
  templateInfo: {
    padding: 10,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  templateDuration: {
    fontSize: 11,
    color: '#999',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  premiumText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFD700',
  },
  categoriesContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: theme.spacing.md,
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  filtersList: {
    padding: theme.spacing.xl,
  },
  filterItem: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
    position: 'relative',
  },
  selectedFilter: {
    transform: [{ scale: 1.1 }],
  },
  filterPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  premiumIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 2,
  },
  publishContent: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  contentPreview: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  contentThumbnail: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: theme.spacing.sm,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  tagsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 14,
    color: '#333',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    gap: theme.spacing.sm,
  },
  selectedPlatform: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedPlatformName: {
    color: '#333',
  },
});

export default ContentCreationTools;
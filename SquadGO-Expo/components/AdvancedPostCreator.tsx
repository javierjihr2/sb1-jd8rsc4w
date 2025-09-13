import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContextSimple';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Poll, PollOption, LinkPreview } from '../lib/types';
import { uploadImage, validateImageUri } from '../lib/imageUpload';
import { 
  generateLinkPreview as generatePreview, 
  autoDetectAndPreview,
  isValidUrl,
  normalizeUrl,
  formatUrlForDisplay,
  getLinkIcon
} from '../lib/linkPreview';
import { ValidatedInput } from './ValidatedInput';
import { FormValidator } from '../utils/validation';

const { width } = Dimensions.get('window');

interface AdvancedPostCreatorProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export default function AdvancedPostCreator({ visible, onClose, onPostCreated }: AdvancedPostCreatorProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  
  // Estados para encuesta
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [pollExpiresIn, setPollExpiresIn] = useState<number | null>(null); // horas
  
  // Estados para enlace
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const resetForm = () => {
    setContent('');
    setSelectedImage(null);
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setAllowMultipleVotes(false);
    setPollExpiresIn(null);
    setLinkUrl('');
    setLinkPreview(null);
  };

  // Detectar enlaces automáticamente en el contenido
  const handleContentChange = async (text: string) => {
    setContent(text);
    
    // Solo detectar si no hay vista previa manual y no está cargando
    if (!linkUrl && !loadingPreview && !linkPreview) {
      try {
        const preview = await autoDetectAndPreview(text);
        if (preview) {
          setLinkPreview(preview);
        }
      } catch (error) {
        // Silenciar errores de detección automática
        console.log('Auto-detección de enlace falló:', error);
      }
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const updatePollOption = (index: number, text: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const generateLinkPreview = async (url: string) => {
    if (!url.trim()) return;
    
    setLoadingPreview(true);
    try {
      const preview = await generatePreview(url);
      setLinkPreview(preview);
    } catch (error) {
      console.error('Error generando preview:', error);
      Alert.alert('Error', 'No se pudo generar la vista previa del enlace');
    } finally {
      setLoadingPreview(false);
    }
  };

  const createPost = async () => {
    // Validar contenido del post
    const validator = new FormValidator();
    
    if (content.trim()) {
      validator
        .addRule('content', { required: true, message: 'El contenido es requerido' })
        .addRule('content', { minLength: 1, message: 'El contenido debe tener al menos 1 carácter' })
        .addRule('content', { maxLength: 500, message: 'El contenido no puede exceder 500 caracteres' });
    }
    
    if (pollQuestion.trim()) {
      validator
        .addRule('pollQuestion', { required: true, message: 'La pregunta es requerida' })
        .addRule('pollQuestion', { minLength: 5, message: 'La pregunta debe tener al menos 5 caracteres' })
        .addRule('pollQuestion', { maxLength: 200, message: 'La pregunta no puede exceder 200 caracteres' });
    }
    
    if (linkUrl.trim()) {
      validator.addRule('linkUrl', { pattern: /^https?:\/\/.+/, message: 'Debe ser una URL válida' });
    }
    
    const validationData: any = {};
    if (content.trim()) validationData.content = content;
    if (pollQuestion.trim()) validationData.pollQuestion = pollQuestion;
    if (linkUrl.trim()) validationData.linkUrl = linkUrl;
    
    if (Object.keys(validationData).length > 0) {
      const validationResult = validator.validate(validationData);
      if (!validationResult.isValid) {
        Alert.alert('Error de Validación', validationResult.errors.join('\n'));
        return;
      }
    }
    
    // Validar que hay contenido
    if (!content.trim() && !selectedImage && !pollQuestion.trim() && !linkPreview) {
      Alert.alert('Error', 'Debes agregar contenido, imagen, encuesta o enlace');
      return;
    }

    if (!user || !profile) {
      Alert.alert('Error', 'Debes estar autenticado para crear una publicación');
      return;
    }

    setPosting(true);

    try {
      const postData: any = {
        userId: user.uid,
        content: content.trim(),
        likes: [],
        comments: [],
        saves: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        user: {
          id: user.uid,
          displayName: profile.fullName || profile.username || 'Usuario',
          avatarUrl: profile.profileImage,
          username: profile.username,
        }
      };

      // Subir imagen a Firebase Storage si existe
      if (selectedImage) {
        if (!validateImageUri(selectedImage)) {
          Alert.alert('Error', 'La imagen seleccionada no es válida');
          return;
        }

        console.log('📤 Subiendo imagen a Firebase Storage...');
        const uploadResult = await uploadImage(selectedImage, 'posts', user.uid);
        
        if (!uploadResult.success) {
          Alert.alert('Error', `No se pudo subir la imagen: ${uploadResult.error}`);
          return;
        }

        postData.imageUrl = uploadResult.url;
        console.log('✅ Imagen subida exitosamente:', uploadResult.url);
      }

      // Agregar encuesta si existe
      if (showPollCreator && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const poll: Poll = {
          id: Date.now().toString(),
          question: pollQuestion.trim(),
          options: pollOptions
            .filter(opt => opt.trim())
            .map((opt, index) => ({
              id: `option_${index}`,
              text: opt.trim(),
              votes: []
            })),
          allowMultipleVotes,
          expiresAt: pollExpiresIn ? new Date(Date.now() + pollExpiresIn * 60 * 60 * 1000) : undefined
        };
        postData.poll = poll;
      }

      // Agregar enlace si existe
      if (linkPreview) {
        postData.linkPreview = linkPreview;
      }

      await addDoc(collection(db, 'posts'), postData);
      
      Alert.alert('¡Éxito!', 'Tu publicación ha sido creada');
      resetForm();
      onClose();
      onPostCreated?.();
    } catch (error) {
      console.error('Error creando publicación:', error);
      Alert.alert('Error', 'No se pudo crear la publicación');
    } finally {
      setPosting(false);
    }
  };

  const renderPollCreator = () => (
    <View style={styles.pollCreator}>
      <Text style={styles.sectionTitle}>Crear Encuesta</Text>
      
      <ValidatedInput
        label="Pregunta de la encuesta"
        placeholder="¿Cuál es tu pregunta?"
        value={pollQuestion}
        onChangeText={setPollQuestion}
        rules={[{ required: true, message: 'La pregunta es requerida' }, { minLength: 5, message: 'Mínimo 5 caracteres' }, { maxLength: 200, message: 'Máximo 200 caracteres' }]}
        multiline
        numberOfLines={3}
        containerStyle={styles.pollQuestionInput}
      />

      {pollOptions.map((option, index) => (
        <View key={index} style={styles.pollOptionContainer}>
          <ValidatedInput
            label={`Opción ${index + 1}`}
            placeholder={`Opción ${index + 1}`}
            value={option}
            onChangeText={(text) => updatePollOption(index, text)}
            rules={[{ required: true, message: 'La opción es requerida' }, { minLength: 1, message: 'Mínimo 1 carácter' }, { maxLength: 100, message: 'Máximo 100 caracteres' }]}
            containerStyle={styles.pollOptionInput}
          />
          {pollOptions.length > 2 && (
            <TouchableOpacity
              style={styles.removePollOption}
              onPress={() => removePollOption(index)}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {pollOptions.length < 4 && (
        <TouchableOpacity style={styles.addPollOption} onPress={addPollOption}>
          <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.addPollOptionText}>Agregar opción</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.pollSetting}
        onPress={() => setAllowMultipleVotes(!allowMultipleVotes)}
      >
        <Ionicons 
          name={allowMultipleVotes ? "checkbox" : "square-outline"} 
          size={20} 
          color="#3b82f6" 
        />
        <Text style={styles.pollSettingText}>Permitir múltiples respuestas</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLinkPreview = () => {
    if (!linkPreview) return null;

    return (
      <View style={styles.linkPreviewContainer}>
        <View style={styles.linkPreviewHeader}>
          <View style={styles.linkPreviewTitleContainer}>
            <Ionicons 
              name={getLinkIcon(linkPreview.url) as any} 
              size={16} 
              color="#3b82f6" 
            />
            <Text style={styles.linkPreviewTitle}>Vista previa del enlace</Text>
          </View>
          <TouchableOpacity onPress={() => setLinkPreview(null)}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <View style={styles.linkPreview}>
          <View style={styles.linkContent}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle} numberOfLines={2}>
                {linkPreview.title}
              </Text>
              <Text style={styles.linkDescription} numberOfLines={2}>
                {linkPreview.description}
              </Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {formatUrlForDisplay(linkPreview.url)}
              </Text>
            </View>
            {linkPreview.imageUrl && (
              <Image
                source={{ uri: linkPreview.imageUrl }}
                style={styles.linkImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <LinearGradient
          colors={['#1f2937', '#111827']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Publicación</Text>
            <TouchableOpacity
              style={[
                styles.postButton,
                { opacity: posting ? 0.5 : 1 }
              ]}
              onPress={createPost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Área de texto principal */}
            <ValidatedInput
              label="Contenido"
              placeholder="¿Qué está pasando en el Battle Royale?"
              value={content}
              onChangeText={handleContentChange}
              rules={[{ maxLength: 500, message: 'Máximo 500 caracteres' }]}
              multiline
              numberOfLines={4}
              containerStyle={styles.contentInput}
            />

            {/* Imagen seleccionada */}
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Creador de encuesta */}
            {showPollCreator && renderPollCreator()}

            {/* Vista previa del enlace */}
            {renderLinkPreview()}

            {/* Campo para agregar enlace */}
            <View style={styles.linkInputContainer}>
              <ValidatedInput
                label="Enlace"
                placeholder="Agregar enlace (opcional)"
                value={linkUrl}
                onChangeText={setLinkUrl}
                rules={[{ pattern: /^https?:\/\/.+/, message: 'Debe ser una URL válida' }]}
                containerStyle={styles.linkInput}
                onSubmitEditing={() => linkUrl.trim() && generateLinkPreview(linkUrl.trim())}
              />
              {loadingPreview && (
                <ActivityIndicator size="small" color="#3b82f6" style={styles.linkLoader} />
              )}
            </View>
          </ScrollView>

          {/* Opciones de contenido */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#3b82f6" />
              <Text style={styles.optionText}>Imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => setShowPollCreator(!showPollCreator)}
            >
              <Ionicons name="bar-chart-outline" size={24} color="#3b82f6" />
              <Text style={styles.optionText}>Encuesta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                if (linkUrl.trim()) {
                  generateLinkPreview(linkUrl.trim());
                } else {
                  Alert.alert('Enlace', 'Escribe una URL en el campo de enlace');
                }
              }}
            >
              <Ionicons name="link-outline" size={24} color="#3b82f6" />
              <Text style={styles.optionText}>Enlace</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  postButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentInput: {
    fontSize: 18,
    color: 'white',
    minHeight: 120,
    marginTop: 20,
    textAlignVertical: 'top',
  },
  selectedImageContainer: {
    position: 'relative',
    marginVertical: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  pollCreator: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  pollQuestionInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  removePollOption: {
    marginLeft: 8,
  },
  addPollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addPollOptionText: {
    color: '#3b82f6',
    marginLeft: 8,
    fontSize: 14,
  },
  pollSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  pollSettingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  linkLoader: {
    marginLeft: 8,
  },
  linkPreviewContainer: {
    marginVertical: 16,
  },
  linkPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkPreviewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkPreviewTitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 6,
  },
  linkPreview: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  linkContent: {
    flexDirection: 'row',
    padding: 12,
  },
  linkInfo: {
    flex: 1,
    paddingRight: 12,
  },
  linkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  linkTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  linkUrl: {
    color: '#3b82f6',
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  option: {
    alignItems: 'center',
  },
  optionText: {
    color: '#3b82f6',
    fontSize: 12,
    marginTop: 4,
  },
});
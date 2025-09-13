import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Sube una imagen a Firebase Storage
 * @param imageUri URI local de la imagen
 * @param folder Carpeta donde guardar la imagen (ej: 'posts', 'profiles')
 * @param userId ID del usuario para organizar las imágenes
 * @returns Promise con el resultado de la subida
 */
export const uploadImage = async (
  imageUri: string, 
  folder: string = 'posts', 
  userId: string
): Promise<UploadResult> => {
  try {
    // Generar un nombre único para la imagen
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.jpg`;
    const imagePath = `${folder}/${userId}/${fileName}`;

    // Crear referencia en Storage
    const imageRef = ref(storage, imagePath);

    // Convertir URI a blob para la subida
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Subir la imagen
    console.log('📤 Subiendo imagen a:', imagePath);
    const snapshot = await uploadBytes(imageRef, blob);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Imagen subida exitosamente:', downloadURL);
    return {
      success: true,
      url: downloadURL
    };

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Sube múltiples imágenes a Firebase Storage
 * @param imageUris Array de URIs locales de las imágenes
 * @param folder Carpeta donde guardar las imágenes
 * @param userId ID del usuario
 * @returns Promise con array de resultados
 */
export const uploadMultipleImages = async (
  imageUris: string[],
  folder: string = 'posts',
  userId: string
): Promise<UploadResult[]> => {
  const uploadPromises = imageUris.map(uri => 
    uploadImage(uri, folder, userId)
  );
  
  return Promise.all(uploadPromises);
};

/**
 * Valida si una URI de imagen es válida
 * @param imageUri URI de la imagen
 * @returns boolean indicando si es válida
 */
export const validateImageUri = (imageUri: string): boolean => {
  if (!imageUri || typeof imageUri !== 'string') {
    return false;
  }
  
  // Verificar que sea una URI válida
  const validPrefixes = ['file://', 'content://', 'http://', 'https://'];
  return validPrefixes.some(prefix => imageUri.startsWith(prefix));
};

/**
 * Obtiene el tamaño estimado de una imagen en bytes
 * @param imageUri URI de la imagen
 * @returns Promise con el tamaño en bytes
 */
export const getImageSize = async (imageUri: string): Promise<number> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.error('Error obteniendo tamaño de imagen:', error);
    return 0;
  }
};
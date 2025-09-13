'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { Camera, CameraOff, RotateCcw, Send, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CameraCaptureProps {
  onSendImage?: (imageBlob: Blob, imageUrl: string) => void;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function CameraCapture({ 
  onSendImage, 
  className,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
}: CameraCaptureProps) {
  const { permissions, requestCameraPermission, takePhoto } = usePermissions();
  const { toast } = useToast();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Limpiar stream al desmontar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  const startCamera = async () => {
    if (!permissions.camera) {
      const granted = await requestCameraPermission();
      if (!granted) {
        toast({
          title: "Permiso denegado",
          description: "No se puede acceder a la cámara sin permisos.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: maxWidth },
          height: { ideal: maxHeight }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsStreaming(true);
      
      toast({
        title: "Cámara activada",
        description: "La cámara está lista para tomar fotos.",
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a blob
    canvas.toBlob((blob) => {
      if (blob) {
        setImageBlob(blob);
        
        if (capturedImage) {
          URL.revokeObjectURL(capturedImage);
        }
        
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        
        stopCamera();
        
        toast({
          title: "Foto capturada",
          description: "La imagen ha sido capturada exitosamente.",
        });
      }
    }, 'image/jpeg', quality);
  };

  const useCapacitorCamera = async () => {
    try {
      const result = await takePhoto();
      if (result && result.webPath) {
        // Convertir base64 a blob
        const response = await fetch(result.webPath);
        const blob = await response.blob();
        
        setImageBlob(blob);
        setCapturedImage(result.webPath);
        
        toast({
          title: "Foto capturada",
          description: "La imagen ha sido capturada con la cámara nativa.",
        });
      }
    } catch (error) {
      console.error('Error taking photo with Capacitor:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo tomar la foto con la cámara nativa.",
        variant: "destructive"
      });
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      // Reiniciar con la nueva orientación
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const deleteImage = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    
    setCapturedImage(null);
    setImageBlob(null);
    
    toast({
      title: "Imagen eliminada",
      description: "La imagen capturada ha sido eliminada.",
    });
  };

  const sendImage = () => {
    if (imageBlob && capturedImage && onSendImage) {
      onSendImage(imageBlob, capturedImage);
      deleteImage(); // Limpiar después de enviar
      
      toast({
        title: "Imagen enviada",
        description: "Tu imagen ha sido enviada al chat.",
      });
    }
  };

  const selectFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImageBlob(file);
        
        if (capturedImage) {
          URL.revokeObjectURL(capturedImage);
        }
        
        const imageUrl = URL.createObjectURL(file);
        setCapturedImage(imageUrl);
        
        toast({
          title: "Imagen seleccionada",
          description: "La imagen ha sido seleccionada de la galería.",
        });
      }
    };
    input.click();
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Vista previa de la cámara */}
          {isStreaming && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Controles de la cámara */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  size="sm"
                >
                  <CameraOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Imagen capturada */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={capturedImage}
                  alt="Imagen capturada"
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteImage}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
                
                <Button
                  onClick={sendImage}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Imagen
                </Button>
              </div>
            </div>
          )}

          {/* Controles principales */}
          {!isStreaming && !capturedImage && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={startCamera}
                  disabled={!permissions.camera}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Cámara
                </Button>
                
                <Button
                  onClick={useCapacitorCamera}
                  disabled={!permissions.camera}
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cámara Nativa
                </Button>
                
                <Button
                  onClick={selectFromGallery}
                  variant="outline"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Seleccionar de Galería
                </Button>
              </div>
            </div>
          )}

          {/* Mensaje de permisos */}
          {!permissions.camera && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Camera className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Permiso de cámara requerido</p>
                  <p className="text-yellow-700 mt-1">
                    Para tomar fotos y enviar imágenes, necesitas permitir el acceso a la cámara.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestCameraPermission()}
                    className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  >
                    Permitir Cámara
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
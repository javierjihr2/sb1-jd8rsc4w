"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, User, Crop } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { usePermissions } from "@/hooks/use-permissions"
import { PermissionsDialog } from "@/components/permissions-dialog"
import { ImageCropDialog } from "@/components/image-crop-dialog"

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageData: string | null) => void
  type: 'avatar' | 'cover'
  className?: string
  disabled?: boolean
}

export function ImageUpload({ 
  currentImage, 
  onImageChange, 
  type, 
  className,
  disabled = false 
}: ImageUploadProps) {
  const { toast } = useToast()
  const { permissions } = usePermissions()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string>("")

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen es demasiado grande. Máximo 10MB.",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Convertir a base64 para mostrar en el diálogo de recorte
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setTempImageSrc(result)
        setShowCropDialog(true)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setIsUploading(false)
        toast({
          title: "Error",
          description: "Error al cargar la imagen.",
          variant: "destructive"
        })
      }
      reader.readAsDataURL(file)
    } catch {
      setIsUploading(false)
      toast({
        title: "Error",
        description: "Error al procesar la imagen.",
        variant: "destructive"
      })
    }

    // Limpiar input
    event.target.value = ''
  }

  const handleRemoveImage = () => {
    onImageChange(null)
    toast({
      title: "Imagen eliminada",
      description: "La imagen ha sido eliminada correctamente."
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = async () => {
    if (!permissions.camera) {
      setShowPermissionsDialog(true)
      return
    }
    
    // Aquí podrías implementar la captura de cámara nativa
    // Por ahora, usamos el input de archivo con capture
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        const mockEvent = {
          target: target,
          currentTarget: target,
          preventDefault: () => {},
          stopPropagation: () => {}
        } as React.ChangeEvent<HTMLInputElement>
        handleFileSelect(mockEvent)
      }
    }
    input.click()
  }

  const handlePermissionsComplete = (allGranted: boolean) => {
    setShowPermissionsDialog(false)
    if (allGranted && permissions.camera) {
      handleCameraClick()
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    onImageChange(croppedImage)
    setTempImageSrc("")
    toast({
      title: "Éxito",
      description: "Imagen procesada y guardada correctamente."
    })
  }

  const handleEditImage = () => {
    if (currentImage) {
      setTempImageSrc(currentImage)
      setShowCropDialog(true)
    }
  }

  if (type === 'avatar') {
    return (
      <div className={cn("relative", className)}>
        <Avatar className="h-24 w-24 cursor-pointer" onClick={!disabled ? handleUploadClick : undefined}>
          <AvatarImage src={currentImage} />
          <AvatarFallback className="bg-muted">
            {currentImage ? (
              <User className="h-8 w-8" />
            ) : (
              <Camera className="h-8 w-8" />
            )}
          </AvatarFallback>
        </Avatar>
        
        {currentImage && !disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        {!disabled && (
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleUploadClick}
              disabled={isUploading}
              title="Subir desde galería"
            >
              <Upload className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleCameraClick}
              disabled={isUploading}
              title="Tomar foto"
            >
              <Camera className="h-3 w-3" />
            </Button>
            {currentImage && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleEditImage}
                disabled={isUploading}
                title="Editar imagen"
              >
                <Crop className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <PermissionsDialog
          open={showPermissionsDialog}
          onOpenChange={setShowPermissionsDialog}
          requiredPermissions={['camera']}
          title="Permiso de Cámara"
          description="Para tomar fotos, necesitamos acceso a tu cámara."
          onComplete={handlePermissionsComplete}
        />
        
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          type={type}
        />
      </div>
    )
  }

  // Cover photo layout
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative h-32 w-full bg-muted flex items-center justify-center">
          {currentImage ? (
            <Image
              src={currentImage}
              alt="Foto de portada"
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Foto de portada</p>
            </div>
          )}
          
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {currentImage ? 'Cambiar' : 'Subir'}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCameraClick}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Cámara
              </Button>
              
              {currentImage && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditImage}
                  disabled={isUploading}
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              
              {currentImage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </CardContent>
      
      <PermissionsDialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
        requiredPermissions={['camera']}
        title="Permiso de Cámara"
        description="Para tomar fotos, necesitamos acceso a tu cámara."
        onComplete={handlePermissionsComplete}
      />
      
      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        type={type}
      />
    </Card>
  )
}
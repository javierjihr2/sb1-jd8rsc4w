"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Crop, RotateCcw, ZoomIn, ZoomOut, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  aspectRatio?: number
  type: 'avatar' | 'cover'
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio,
  type
}: ImageCropDialogProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState([1])
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const defaultAspectRatio = type === 'avatar' ? 1 : 16 / 9
  const finalAspectRatio = aspectRatio || defaultAspectRatio

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetTransform = () => {
    setScale([1])
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const cropImage = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar el tamaño del canvas según el tipo
    const outputWidth = type === 'avatar' ? 300 : 800
    const outputHeight = type === 'avatar' ? 300 : Math.round(800 / finalAspectRatio)
    
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Limpiar canvas
    ctx.clearRect(0, 0, outputWidth, outputHeight)

    // Guardar estado del contexto
    ctx.save()

    // Aplicar transformaciones
    ctx.translate(outputWidth / 2, outputHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale[0], scale[0])
    ctx.translate(-outputWidth / 2, -outputHeight / 2)
    ctx.translate(position.x, position.y)

    // Dibujar la imagen
    ctx.drawImage(image, 0, 0, outputWidth, outputHeight)

    // Restaurar estado del contexto
    ctx.restore()

    // Convertir a base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onCropComplete(croppedImage)
    onOpenChange(false)
    
    toast({
      title: "Imagen procesada",
      description: "La imagen ha sido recortada y redimensionada correctamente."
    })
  }, [scale, rotation, position, type, finalAspectRatio, onCropComplete, onOpenChange, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Ajustar {type === 'avatar' ? 'Foto de Perfil' : 'Foto de Portada'}
          </DialogTitle>
          <DialogDescription>
            Arrastra, redimensiona y rota tu imagen para obtener el mejor resultado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Área de previsualización */}
          <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: finalAspectRatio, height: '300px' }}>
            <div 
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale[0]}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                draggable={false}
              />
            </div>
            
            {/* Overlay de recorte */}
            <div className="absolute inset-0 border-2 border-primary border-dashed pointer-events-none" />
          </div>

          {/* Controles */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {scale[0].toFixed(1)}x
              </Label>
              <Slider
                value={scale}
                onValueChange={setScale}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotación */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Rotación: {rotation}°
              </Label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={15}
                className="w-full"
              />
            </div>

            {/* Botón de reset */}
            <Button variant="outline" onClick={resetTransform} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={cropImage}>
            <Check className="h-4 w-4 mr-2" />
            Aplicar
          </Button>
        </DialogFooter>
        
        {/* Canvas oculto para el procesamiento */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
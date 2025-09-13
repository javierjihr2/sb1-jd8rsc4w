"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AudioCallProps {
  isOpen: boolean
  onClose: () => void
  contactName: string
  contactAvatar?: string
  isIncoming?: boolean
  onAnswer?: () => void
  onDecline?: () => void
}

export function AudioCall({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  isIncoming = false,
  onAnswer,
  onDecline
}: AudioCallProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isConnected && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000) as unknown as number
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isConnected])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup cuando el componente se desmonta o se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      cleanup()
    }
    
    return () => {
      cleanup()
    }
  }, [isOpen])

  const requestMicrophonePermission = async () => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso al micrófono')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      })
      localStreamRef.current = stream
      return stream
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      let errorMessage = "No se pudo acceder al micrófono. Verifica los permisos."
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permisos de micrófono denegados. Por favor, permite el acceso al micrófono en la configuración del navegador."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No se encontró ningún micrófono. Verifica que tu dispositivo tenga un micrófono conectado."
      } else if (error.name === 'NotReadableError') {
        errorMessage = "El micrófono está siendo usado por otra aplicación. Cierra otras aplicaciones que puedan estar usando el micrófono."
      }
      
      toast({
        title: "Error de Micrófono",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  const initializePeerConnection = async () => {
    try {
      // Verificar soporte para WebRTC
      if (!window.RTCPeerConnection) {
        throw new Error('Tu navegador no soporta llamadas de voz (WebRTC no disponible)')
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle' as RTCBundlePolicy,
        rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
      }
      
      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection
      
      // Agregar el stream local
      const stream = await requestMicrophonePermission()
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      // Manejar ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // En una implementación real, enviarías este candidate al peer remoto
          console.log('ICE candidate:', event.candidate)
        }
      }
      
      // Manejar stream remoto
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream')
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0]
        }
      }
      
      // Manejar cambios en el estado de conexión
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
          toast({
            title: "Llamada Conectada",
            description: "La llamada se ha establecido correctamente.",
            variant: "default"
          })
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          toast({
            title: "Llamada Desconectada",
            description: "La llamada se ha desconectado.",
            variant: "destructive"
          })
          handleEndCall()
        }
      }
      
      // Manejar errores de ICE
      peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', peerConnection.iceGatheringState)
      }
      
      return peerConnection
    } catch (error: any) {
      console.error('Error initializing peer connection:', error)
      toast({
        title: "Error de Conexión",
        description: error.message || "No se pudo establecer la conexión de llamada.",
        variant: "destructive"
      })
      throw error
    }
  }

  const handleAnswer = async () => {
    try {
      setIsConnecting(true)
      await initializePeerConnection()
      
      // En una implementación real, aquí enviarías la respuesta al servidor
      // y establecerías la conexión WebRTC real
      
      // Simular conexión exitosa después de 2 segundos
      setTimeout(() => {
        if (peerConnectionRef.current?.connectionState !== 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
          toast({
            title: "Llamada Conectada",
            description: `Llamada de audio con ${contactName} iniciada.`
          })
        }
      }, 2000)
      
      onAnswer?.()
    } catch (error) {
      console.error('Error answering call:', error)
      setIsConnecting(false)
      toast({
        title: "Error al Responder",
        description: "No se pudo responder la llamada. Intenta nuevamente.",
        variant: "destructive"
      })
    }
  }

  const handleStartCall = async () => {
    try {
      setIsConnecting(true)
      await initializePeerConnection()
      
      // En una implementación real, aquí iniciarías la llamada enviando
      // una oferta al servidor y al peer remoto
      
      // Simular conexión exitosa después de 3 segundos
      setTimeout(() => {
        if (peerConnectionRef.current?.connectionState !== 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
          toast({
            title: "Llamada Iniciada",
            description: `Llamando a ${contactName}...`
          })
        }
      }, 3000)
    } catch (error) {
      console.error('Error starting call:', error)
      setIsConnecting(false)
      toast({
        title: "Error al Iniciar Llamada",
        description: "No se pudo iniciar la llamada. Verifica tu conexión y permisos.",
        variant: "destructive"
      })
    }
  }

  const handleEndCall = () => {
    try {
      // En una implementación real, aquí notificarías al servidor
      // que la llamada ha terminado
      cleanup()
      toast({
        title: "Llamada Finalizada",
        description: "La llamada ha terminado.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      onClose()
    }
  }

  const handleDecline = () => {
    try {
      // En una implementación real, aquí notificarías al servidor
      // que la llamada fue rechazada
      cleanup()
      toast({
        title: "Llamada Rechazada",
        description: "Has rechazado la llamada.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error declining call:', error)
    } finally {
      onDecline?.()
      onClose()
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // En una implementación real, cambiarías el dispositivo de salida de audio
  }

  const cleanup = () => {
    try {
      // Limpiar stream local
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log('Stopped local track:', track.kind)
        })
        localStreamRef.current = null
      }
      
      // Limpiar peer connection
      if (peerConnectionRef.current) {
        // Cerrar todos los senders
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop()
          }
        })
        
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
        console.log('Peer connection closed')
      }
      
      // Limpiar timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // Limpiar elementos de audio
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = null
      }
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
      
      // Resetear estados
      setIsConnected(false)
      setIsConnecting(false)
      setCallDuration(0)
      setIsMuted(false)
      setIsSpeakerOn(false)
      
      console.log('Call cleanup completed')
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center space-y-6">
          {/* Avatar y nombre del contacto */}
          <div className="space-y-4">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="text-2xl">
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{contactName}</h3>
              {isConnecting && (
                <p className="text-sm text-muted-foreground">
                  {isIncoming ? "Conectando..." : "Llamando..."}
                </p>
              )}
              {isConnected && (
                <p className="text-sm text-muted-foreground">
                  {formatDuration(callDuration)}
                </p>
              )}
              {!isConnected && !isConnecting && isIncoming && (
                <p className="text-sm text-muted-foreground">Llamada entrante</p>
              )}
            </div>
          </div>

          {/* Controles de llamada */}
          <div className="flex justify-center space-x-4">
            {isIncoming && !isConnected && !isConnecting ? (
              // Botones para llamada entrante
              <>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-14 h-14"
                  onClick={handleDecline}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700"
                  onClick={handleAnswer}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : isConnected ? (
              // Controles durante la llamada
              <>
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  className="rounded-full w-12 h-12"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant={isSpeakerOn ? "default" : "secondary"}
                  className="rounded-full w-12 h-12"
                  onClick={toggleSpeaker}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-14 h-14"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            ) : (
              // Botón para iniciar llamada saliente
              <>
                {!isConnecting && (
                  <Button
                    size="lg"
                    className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700"
                    onClick={handleStartCall}
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-14 h-14"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Audio elements para WebRTC */}
      <audio ref={localAudioRef} muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  )
}
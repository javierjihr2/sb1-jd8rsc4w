'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { Mic, MicOff, Play, Pause, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSendVoiceMessage?: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number;
  className?: string;
}

export function VoiceRecorder({ 
  onSendVoiceMessage, 
  maxDuration = 60, 
  className 
}: VoiceRecorderProps) {
  const { permissions, requestMicrophonePermission } = usePermissions();
  const { toast } = useToast();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!permissions.microphone) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        toast({
          title: "Permiso denegado",
          description: "No se puede grabar sin permisos de micrófono.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000) as unknown as number;
      
      toast({
        title: "Grabación iniciada",
        description: "Habla ahora para grabar tu mensaje de voz."
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error de grabación",
        description: "No se pudo iniciar la grabación.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Grabación completada",
        description: "Tu mensaje de voz está listo."
      });
    }
  };

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    toast({
      title: "Grabación eliminada",
      description: "La grabación ha sido eliminada."
    });
  };

  const sendRecording = () => {
    if (audioBlob && onSendVoiceMessage) {
      onSendVoiceMessage(audioBlob, recordingDuration);
      deleteRecording();
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje de voz ha sido enviado."
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {!audioBlob ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className={`h-16 w-16 rounded-full ${
                    isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''
                  }`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!permissions.microphone && !isRecording}
                >
                  {isRecording ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              </div>
              
              {isRecording && (
                <div className="space-y-2">
                  <div className="text-lg font-mono text-red-500">
                    {formatDuration(recordingDuration)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Máximo: {formatDuration(maxDuration)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(recordingDuration / maxDuration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {!isRecording && (
                <p className="text-sm text-muted-foreground">
                  {permissions.microphone 
                    ? 'Toca el micrófono para grabar'
                    : 'Necesitas permitir el acceso al micrófono'
                  }
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPlaying ? pauseRecording : playRecording}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="text-sm font-mono">
                    {formatDuration(recordingDuration)}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteRecording}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={sendRecording}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!permissions.microphone && !isRecording && (
            <div className="text-center space-y-2">
              <div className="text-sm text-yellow-600">
                Se requiere permiso de micrófono
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestMicrophonePermission()}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Permitir Micrófono
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Camera, Mic, Users, MessageSquare, GamepadIcon } from 'lucide-react';

interface PermissionPrimerProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  permissionType: 'location' | 'camera' | 'microphone' | 'all';
}

const permissionContent = {
  location: {
    icon: MapPin,
    title: '¿Por qué necesitamos tu ubicación?',
    description: 'Tu ubicación nos ayuda a conectarte con jugadores cercanos y encontrar partidas locales.',
    benefits: [
      'Encuentra jugadores en tu área',
      'Únete a torneos locales',
      'Mejora la latencia en partidas'
    ],
    example: 'Como en Pokémon GO, usamos tu ubicación para crear una experiencia más social y conectada.'
  },
  camera: {
    icon: Camera,
    title: '¿Por qué necesitamos tu cámara?',
    description: 'La cámara te permite compartir capturas épicas y personalizar tu perfil.',
    benefits: [
      'Comparte tus mejores jugadas',
      'Personaliza tu avatar',
      'Documenta tus victorias'
    ],
    example: 'Como en Instagram, puedes capturar y compartir momentos especiales de tus partidas.'
  },
  microphone: {
    icon: Mic,
    title: '¿Por qué necesitamos tu micrófono?',
    description: 'El micrófono es esencial para la comunicación en equipo durante las partidas.',
    benefits: [
      'Comunícate con tu equipo',
      'Coordina estrategias',
      'Envía mensajes de voz rápidos'
    ],
    example: 'Como en Discord, la comunicación por voz es clave para el trabajo en equipo.'
  },
  all: {
    icon: GamepadIcon,
    title: '¡Prepárate para la mejor experiencia!',
    description: 'Para ofrecerte todas las funciones de SquadGO, necesitamos algunos permisos.',
    benefits: [
      'Experiencia completa de juego',
      'Todas las funciones sociales',
      'Comunicación sin límites'
    ],
    example: 'Como las mejores apps de gaming, combinamos ubicación, cámara y micrófono para una experiencia única.'
  }
};

export function PermissionPrimer({ isOpen, onClose, onContinue, permissionType }: PermissionPrimerProps) {
  const content = permissionContent[permissionType];
  const Icon = content.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {content.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600 text-center leading-relaxed">
            {content.description}
          </p>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Users className="h-4 w-4 mr-2 text-orange-600" />
              Esto te permitirá:
            </h4>
            <ul className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">Ejemplo:</span> {content.example}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 text-center">
              🔒 <span className="font-medium">Tu privacidad es importante.</span> Solo usamos estos permisos para mejorar tu experiencia de juego. Puedes cambiar estos permisos en cualquier momento.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onContinue}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Entendido, continuar
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Ahora no
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
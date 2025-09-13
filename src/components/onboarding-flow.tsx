'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { MapPin, Mic, Users, Gamepad2, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { PermissionPrimer } from './permission-primer';
import { usePermissions } from '@/hooks/use-permissions';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'benefits' | 'permissions' | 'complete';

const steps = [
  { id: 'welcome', title: 'Bienvenido', progress: 25 },
  { id: 'benefits', title: 'Beneficios', progress: 50 },
  { id: 'permissions', title: 'Permisos', progress: 75 },
  { id: 'complete', title: 'Listo', progress: 100 }
];

export function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [showPrimer, setShowPrimer] = useState(false);
  const { requestAllPermissions } = usePermissions();
  
  const currentStepData = steps.find(step => step.id === currentStep);
  
  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('benefits');
        break;
      case 'benefits':
        setCurrentStep('permissions');
        break;
      case 'permissions':
        setShowPrimer(true);
        break;
      case 'complete':
        onComplete();
        break;
    }
  };
  
  const handlePermissionsGranted = () => {
    setShowPrimer(false);
    setCurrentStep('complete');
  };
  
  const handleSkipPermissions = () => {
    setShowPrimer(false);
    setCurrentStep('complete');
  };
  
  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
          <Gamepad2 className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <Star className="h-4 w-4 text-yellow-800" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido a SquadGO!</h2>
        <p className="text-gray-600 leading-relaxed">
          La plataforma definitiva para conectar con jugadores, formar equipos épicos y dominar PUBG Mobile.
        </p>
      </div>
      
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <span className="font-semibold">🎮 Únete a miles de jugadores</span> que ya están usando SquadGO para mejorar su experiencia de juego.
        </p>
      </div>
    </div>
  );
  
  const renderBenefitsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">¿Qué puedes hacer?</h2>
        <p className="text-gray-600">
          Descubre todas las funciones que te ayudarán a mejorar tu juego
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Encuentra tu Squad</h3>
            <p className="text-sm text-gray-600">Conecta con jugadores de tu nivel y forma equipos ganadores</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Partidas Locales</h3>
            <p className="text-sm text-gray-600">Encuentra jugadores cerca de ti para menor latencia</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Mic className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Comunicación Pro</h3>
            <p className="text-sm text-gray-600">Chat de voz integrado para coordinar estrategias</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderPermissionsStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">¡Casi listo!</h2>
        <p className="text-gray-600 leading-relaxed">
          Para ofrecerte la mejor experiencia, necesitamos algunos permisos. Te explicaremos exactamente para qué los usamos.
        </p>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">🔒 Tu privacidad es nuestra prioridad.</span> Solo pedimos los permisos esenciales y puedes cambiarlos cuando quieras.
        </p>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          Configurar Permisos
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          onClick={handleSkipPermissions}
          variant="outline"
          className="w-full"
        >
          Continuar sin permisos
        </Button>
      </div>
    </div>
  );
  
  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-green-200 rounded-full animate-ping" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">¡Todo listo!</h2>
        <p className="text-gray-600 leading-relaxed">
          Ya puedes empezar a usar SquadGO. Encuentra tu squad perfecto y domina el campo de batalla.
        </p>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <span className="font-semibold">🎯 Consejo:</span> Completa tu perfil para encontrar mejores compañeros de equipo.
        </p>
      </div>
      
      <Button
        onClick={onComplete}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        ¡Empezar a jugar!
        <Gamepad2 className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'benefits':
        return renderBenefitsStep();
      case 'permissions':
        return renderPermissionsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };
  
  return (
    <>
      <PermissionPrimer
        isOpen={showPrimer}
        onClose={() => setShowPrimer(false)}
        onContinue={async () => {
          setShowPrimer(false);
          try {
            await requestAllPermissions();
            handlePermissionsGranted();
          } catch (error) {
            console.error('Error requesting permissions:', error);
            handleSkipPermissions();
          }
        }}
        permissionType="all"
      />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Configuración inicial de SquadGO</DialogTitle>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Paso {steps.findIndex(s => s.id === currentStep) + 1} de {steps.length}</span>
                <span>{currentStepData?.progress}%</span>
              </div>
              <Progress value={currentStepData?.progress || 0} className="h-2" />
            </div>
            
            {/* Step Content */}
            {renderCurrentStep()}
            
            {/* Navigation */}
            {currentStep !== 'permissions' && currentStep !== 'complete' && (
              <div className="flex gap-3">
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                {currentStep === 'welcome' && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Omitir
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
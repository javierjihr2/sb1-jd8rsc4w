'use client';

import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Progress } from './ui/progress';
import { useOfflineSync } from '../hooks/use-offline-sync';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function OfflineStatus() {
  const { syncStatus, pendingActions, forceSync, clearPendingActions } = useOfflineSync();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.pendingActions > 0) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) {
      return 'Sincronizando...';
    }
    
    if (!syncStatus.isOnline) {
      return 'Sin conexión';
    }
    
    if (syncStatus.pendingActions > 0) {
      return `${syncStatus.pendingActions} pendientes`;
    }
    
    return 'Sincronizado';
  };

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) {
      return 'bg-blue-500';
    }
    
    if (!syncStatus.isOnline) {
      return 'bg-red-500';
    }
    
    if (syncStatus.pendingActions > 0) {
      return 'bg-yellow-500';
    }
    
    return 'bg-green-500';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) {
      return 'Nunca';
    }
    
    return formatDistanceToNow(new Date(syncStatus.lastSyncTime), {
      addSuffix: true,
      locale: es
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-2 relative"
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">
            {getStatusText()}
          </span>
          {syncStatus.pendingActions > 0 && (
            <Badge 
              variant="secondary" 
              className={`h-5 px-1.5 text-xs ${getStatusColor()} text-white`}
            >
              {syncStatus.pendingActions}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Estado de Sincronización</h4>
            {getStatusIcon()}
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Conectado</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">Sin conexión</span>
              </>
            )}
          </div>
          
          {/* Sync Progress */}
          {syncStatus.syncInProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Sincronizando acciones...</span>
                <span>{syncStatus.pendingActions} restantes</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}
          
          {/* Pending Actions */}
          {syncStatus.pendingActions > 0 && !syncStatus.syncInProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Acciones Pendientes</span>
                <Badge variant="outline">{syncStatus.pendingActions}</Badge>
              </div>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pendingActions.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium capitalize">{action.type}</div>
                      <div className="text-gray-500 truncate">{action.url}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {action.retryCount}/{action.maxRetries}
                    </Badge>
                  </div>
                ))}
                
                {pendingActions.length > 5 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{pendingActions.length - 5} más...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Last Sync Time */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Última sincronización:</span>
            <span>{formatLastSync()}</span>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={forceSync}
              disabled={!syncStatus.isOnline || syncStatus.syncInProgress || syncStatus.pendingActions === 0}
              className="flex-1"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            
            {syncStatus.pendingActions > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar todas las acciones pendientes?')) {
                    clearPendingActions();
                    setIsOpen(false);
                  }
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
          
          {/* Offline Mode Info */}
          {!syncStatus.isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <div className="font-medium mb-1">Modo Offline Activo</div>
                  <div>
                    Las acciones se guardarán localmente y se sincronizarán automáticamente cuando se restaure la conexión.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Success State */}
          {syncStatus.isOnline && syncStatus.pendingActions === 0 && !syncStatus.syncInProgress && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-xs text-green-800 font-medium">
                  Todas las acciones están sincronizadas
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default OfflineStatus;
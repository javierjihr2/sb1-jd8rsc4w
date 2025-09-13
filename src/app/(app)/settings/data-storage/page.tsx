"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  HardDrive,
  Trash2,
  Download,
  Upload,
  Database,
  Clock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useAuth } from "@/app/auth-provider"

interface StorageData {
  totalUsed: number
  totalLimit: number
  breakdown: {
    profiles: number
    matches: number
    messages: number
    media: number
    cache: number
    backups: number
  }
  lastCleanup: string
  autoCleanup: boolean
  retentionDays: number
}

interface CacheData {
  localStorage: number
  sessionStorage: number
  indexedDB: number
  serviceWorker: number
}

export default function DataStoragePage() {
  const { user } = useAuth()
  const [storageData, setStorageData] = useState<StorageData>({
    totalUsed: 0,
    totalLimit: 100,
    breakdown: {
      profiles: 0,
      matches: 0,
      messages: 0,
      media: 0,
      cache: 0,
      backups: 0
    },
    lastCleanup: new Date().toISOString(),
    autoCleanup: true,
    retentionDays: 30
  })
  const [cacheData, setCacheData] = useState<CacheData>({
    localStorage: 0,
    sessionStorage: 0,
    indexedDB: 0,
    serviceWorker: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Calcular uso de almacenamiento
  const calculateStorageUsage = async () => {
    try {
      // Calcular localStorage
      let localStorageSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length
        }
      }

      // Calcular sessionStorage
      let sessionStorageSize = 0
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          sessionStorageSize += sessionStorage[key].length + key.length
        }
      }

      // Estimar IndexedDB (si está disponible)
      let indexedDBSize = 0
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        indexedDBSize = estimate.usage || 0
      }

      setCacheData({
        localStorage: Math.round(localStorageSize / 1024), // KB
        sessionStorage: Math.round(sessionStorageSize / 1024), // KB
        indexedDB: Math.round(indexedDBSize / 1024), // KB
        serviceWorker: 0 // Placeholder
      })

      // Simular breakdown de datos del usuario
      const totalUsed = Math.round((localStorageSize + sessionStorageSize + indexedDBSize) / (1024 * 1024)) // MB
      setStorageData(prev => ({
        ...prev,
        totalUsed,
        breakdown: {
          profiles: Math.round(totalUsed * 0.3),
          matches: Math.round(totalUsed * 0.25),
          messages: Math.round(totalUsed * 0.2),
          media: Math.round(totalUsed * 0.15),
          cache: Math.round(totalUsed * 0.08),
          backups: Math.round(totalUsed * 0.02)
        }
      }))
    } catch (error) {
      console.error('Error calculating storage:', error)
    }
  }

  // Limpiar datos específicos
  const clearSpecificData = async (type: string) => {
    setIsClearing(true)
    try {
      switch (type) {
        case 'cache':
          // Limpiar cache del navegador
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
          }
          break
        case 'localStorage':
          // Limpiar solo datos de SquadGO
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('squadgo_') || key.startsWith('profile_') || key.startsWith('pending_')) {
              localStorage.removeItem(key)
            }
          })
          break
        case 'sessionStorage':
          sessionStorage.clear()
          break
        case 'backups':
          // Limpiar backups antiguos
          const backupKeys = Object.keys(localStorage).filter(key => key.includes('backup'))
          backupKeys.forEach(key => localStorage.removeItem(key))
          break
        case 'messages':
          // Limpiar mensajes antiguos (simulado)
          const messageKeys = Object.keys(localStorage).filter(key => key.includes('message'))
          messageKeys.forEach(key => localStorage.removeItem(key))
          break
      }

      await calculateStorageUsage()
      toast({
        title: "Datos limpiados",
        description: `Se han eliminado los datos de ${type} correctamente`
      })
    } catch (error) {
      console.error('Error clearing data:', error)
      toast({
        title: "Error",
        description: "No se pudieron limpiar los datos",
        variant: "destructive"
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Limpiar todos los datos
  const clearAllData = async () => {
    setIsClearing(true)
    try {
      // Limpiar localStorage (solo datos de SquadGO)
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('squadgo_') || key.startsWith('profile_') || key.startsWith('pending_')) {
          localStorage.removeItem(key)
        }
      })

      // Limpiar sessionStorage
      sessionStorage.clear()

      // Limpiar cache
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }

      await calculateStorageUsage()
      setStorageData(prev => ({ ...prev, lastCleanup: new Date().toISOString() }))
      
      toast({
        title: "Limpieza completa",
        description: "Todos los datos locales han sido eliminados"
      })
    } catch (error) {
      console.error('Error clearing all data:', error)
      toast({
        title: "Error",
        description: "No se pudieron limpiar todos los datos",
        variant: "destructive"
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Exportar datos
  const exportData = async () => {
    setIsLoading(true)
    try {
      const userData = {
        profile: localStorage.getItem(`profile_${user?.uid}`),
        settings: localStorage.getItem(`settings_${user?.uid}`),
        matches: localStorage.getItem(`matches_${user?.uid}`),
        exportDate: new Date().toISOString()
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `squadgo-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Datos exportados",
        description: "Tus datos han sido descargados correctamente"
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar configuración
  const updateSetting = (key: keyof StorageData, value: any) => {
    setStorageData(prev => ({ ...prev, [key]: value }))
    // Guardar en localStorage
    localStorage.setItem(`storage_settings_${user?.uid}`, JSON.stringify({ ...storageData, [key]: value }))
    toast({
      title: "Configuración actualizada",
      description: "Los cambios han sido guardados"
    })
  }

  useEffect(() => {
    calculateStorageUsage()
    
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem(`storage_settings_${user?.uid}`)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setStorageData(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading storage settings:', error)
      }
    }
  }, [user])

  const usagePercentage = (storageData.totalUsed / storageData.totalLimit) * 100
  const totalCacheSize = cacheData.localStorage + cacheData.sessionStorage + cacheData.indexedDB

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Datos y Almacenamiento</h1>
          <p className="text-muted-foreground">Gestiona el uso de almacenamiento y limpia datos innecesarios</p>
        </div>
      </div>

      {/* Resumen de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Uso de Almacenamiento
          </CardTitle>
          <CardDescription>
            {storageData.totalUsed} MB de {storageData.totalLimit} MB utilizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso total</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm">Perfiles: {storageData.breakdown.profiles} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm">Matches: {storageData.breakdown.matches} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm">Mensajes: {storageData.breakdown.messages} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span className="text-sm">Media: {storageData.breakdown.media} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-sm">Cache: {storageData.breakdown.cache} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm">Backups: {storageData.breakdown.backups} MB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache del navegador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache del Navegador
          </CardTitle>
          <CardDescription>
            Datos temporales almacenados localmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{cacheData.localStorage}</div>
              <div className="text-sm text-muted-foreground">Local Storage (KB)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{cacheData.sessionStorage}</div>
              <div className="text-sm text-muted-foreground">Session Storage (KB)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{cacheData.indexedDB}</div>
              <div className="text-sm text-muted-foreground">IndexedDB (KB)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Archive className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{totalCacheSize}</div>
              <div className="text-sm text-muted-foreground">Total Cache (KB)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones de limpieza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Configuración de Limpieza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Limpieza automática</Label>
              <p className="text-sm text-muted-foreground">
                Eliminar automáticamente datos antiguos
              </p>
            </div>
            <Switch
              checked={storageData.autoCleanup}
              onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Retención de datos (días)</Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="7"
                max="90"
                value={storageData.retentionDays}
                onChange={(e) => updateSetting('retentionDays', parseInt(e.target.value))}
                className="flex-1"
              />
              <Badge variant="outline">{storageData.retentionDays} días</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Los datos más antiguos que este período serán eliminados automáticamente
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Última limpieza</h4>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {new Date(storageData.lastCleanup).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de limpieza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Acciones de Limpieza
          </CardTitle>
          <CardDescription>
            Elimina datos específicos para liberar espacio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => clearSpecificData('cache')}
              disabled={isClearing}
              className="justify-start"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpiar Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearSpecificData('localStorage')}
              disabled={isClearing}
              className="justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Limpiar Local Storage
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearSpecificData('backups')}
              disabled={isClearing}
              className="justify-start"
            >
              <Archive className="mr-2 h-4 w-4" />
              Limpiar Backups
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearSpecificData('messages')}
              disabled={isClearing}
              className="justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Limpiar Mensajes Antiguos
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={exportData}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isLoading ? 'Exportando...' : 'Exportar Datos'}
            </Button>
            
            <Button
              onClick={clearAllData}
              disabled={isClearing}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? 'Limpiando...' : 'Limpiar Todo'}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Advertencia:</strong> La limpieza completa eliminará todos los datos locales. 
              Esta acción no se puede deshacer. Se recomienda exportar los datos antes de continuar.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
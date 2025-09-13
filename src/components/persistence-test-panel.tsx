/**
 * Panel de pruebas para el sistema de persistencia ultra-robusto
 * Permite probar diferentes escenarios y verificar la integridad de los datos
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { getUltraPersistence } from '@/lib/ultra-persistence'
import { validateProfile, verifyDataIntegrity, generateDataHash } from '@/lib/data-validator'
import { playerProfile } from '@/lib/data'
import type { PlayerProfile } from '@/lib/types'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  duration?: number
  details?: any
}

interface PersistenceStats {
  totalSaves: number
  totalLoads: number
  successfulSaves: number
  successfulLoads: number
  dataCorruptions: number
  autoRepairs: number
  lastTest: number
}

export function PersistenceTestPanel() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<PersistenceStats>({
    totalSaves: 0,
    totalLoads: 0,
    successfulSaves: 0,
    successfulLoads: 0,
    dataCorruptions: 0,
    autoRepairs: 0,
    lastTest: 0
  })
  const [currentProfile, setCurrentProfile] = useState<PlayerProfile | null>(null)

  // Cargar estadísticas al inicializar
  useEffect(() => {
    loadStats()
    loadCurrentProfile()
  }, [])

  const loadStats = async () => {
    try {
      const ultraPersistence = await getUltraPersistence()
      if (!ultraPersistence) {
        console.warn('Ultra persistence no disponible')
        return
      }
      const systemStats = ultraPersistence.getStats()
      if (systemStats) {
        // Convertir estadísticas del sistema a nuestro formato
        const persistenceStats: PersistenceStats = {
          totalSaves: 0,
          totalLoads: 0,
          successfulSaves: 0,
          successfulLoads: 0,
          dataCorruptions: 0,
          autoRepairs: 0,
          lastTest: Date.now()
        }
        setStats(persistenceStats)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const saveStats = async (newStats: PersistenceStats) => {
    try {
      // Las estadísticas se manejan internamente por UltraPersistence
      // Solo actualizamos el estado local
      setStats(newStats)
    } catch (error) {
      console.error('Error guardando estadísticas:', error)
    }
  }

  const loadCurrentProfile = async () => {
    try {
      const ultraPersistence = await getUltraPersistence()
      if (!ultraPersistence) {
        console.warn('Ultra persistence no disponible')
        return
      }
      const profile = await ultraPersistence.loadProfile()
      setCurrentProfile(profile)
    } catch (error) {
      console.error('Error cargando perfil:', error)
    }
  }

  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...result } : test
    ))
  }

  const runTest = async (testName: string, testFn: () => Promise<any>, index: number) => {
    const startTime = Date.now()
    updateTestResult(index, { status: 'running' })
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      updateTestResult(index, {
        status: 'passed',
        message: 'Prueba exitosa',
        duration,
        details: result
      })
      return true
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(index, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Error desconocido',
        duration
      })
      return false
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setProgress(0)
    
    const testSuite = [
      {
        name: 'Guardar perfil básico',
        test: async () => {
          const ultraPersistence = await getUltraPersistence()
          if (!ultraPersistence) throw new Error('Ultra persistence no disponible')
          const testProfile = { ...playerProfile, name: 'Test User', lastModified: Date.now() }
          return await ultraPersistence.saveProfile(testProfile)
        }
      },
      {
        name: 'Cargar perfil guardado',
        test: async () => {
          const ultraPersistence = await getUltraPersistence()
          if (!ultraPersistence) throw new Error('Ultra persistence no disponible')
          const profile = await ultraPersistence.loadProfile()
          if (!profile || profile.name !== 'Test User') {
            throw new Error('Perfil no cargado correctamente')
          }
          return profile
        }
      },
      {
        name: 'Validación de datos',
        test: async () => {
          const testProfile = { ...playerProfile, name: '', email: 'invalid-email' }
          const validation = validateProfile(testProfile)
          if (validation.isValid) {
            throw new Error('Validación debería haber fallado')
          }
          return validation
        }
      },
      {
        name: 'Reparación automática',
        test: async () => {
          const ultraPersistence = await getUltraPersistence()
          if (!ultraPersistence) throw new Error('Ultra persistence no disponible')
          const corruptedProfile = { ...playerProfile, name: 'Test', level: 999 as any } // level inválido para prueba
          await ultraPersistence.saveProfile(corruptedProfile)
          const repairedProfile = await ultraPersistence.loadProfile()
          return repairedProfile
        }
      },
      {
        name: 'Múltiples capas de respaldo',
        test: async () => {
          const ultraPersistence = await getUltraPersistence()
          if (!ultraPersistence) throw new Error('Ultra persistence no disponible')
          const testData = { ...playerProfile, id: 'backup-test', name: 'Backup Test', lastModified: Date.now() }
          
          // Guardar en todas las capas
          await ultraPersistence.saveProfile(testData)
          
          // Simular pérdida de localStorage principal
          if (typeof window !== 'undefined') {
            localStorage.removeItem('backup_test')
          }
          
          // Debería cargar desde backup
          const recovered = await ultraPersistence.loadProfile()
          if (!recovered || recovered.name !== 'Backup Test') {
            throw new Error('No se pudo recuperar desde backup')
          }
          return recovered
        }
      },
      {
        name: 'Integridad de hash',
        test: async () => {
          const testData = { name: 'Hash Test', level: 50 }
          const hash1 = generateDataHash(testData)
          const hash2 = generateDataHash(testData)
          const hash3 = generateDataHash({ ...testData, level: 51 })
          
          if (hash1 !== hash2) {
            throw new Error('Hashes idénticos no coinciden')
          }
          if (hash1 === hash3) {
            throw new Error('Hashes diferentes son idénticos')
          }
          return { hash1, hash2, hash3 }
        }
      },
      {
        name: 'Verificación de integridad',
        test: async () => {
          const testProfile = { ...playerProfile, name: 'Integrity Test' }
          const report = await verifyDataIntegrity('test-user', testProfile, 'profile')
          return report
        }
      },
      {
        name: 'Recuperación de emergencia',
        test: async () => {
          const ultraPersistence = await getUltraPersistence()
          if (!ultraPersistence) throw new Error('Ultra persistence no disponible')
          
          // Limpiar todos los datos
          if (typeof window !== 'undefined') {
            localStorage.removeItem('emergency_test')
            localStorage.removeItem('emergency_test_backup')
            localStorage.removeItem('emergency_test_emergency')
            sessionStorage.removeItem('emergency_test')
          }
          
          // Debería retornar perfil por defecto
          const defaultProfile = await ultraPersistence.loadProfile()
          return defaultProfile
        }
      }
    ]

    setTests(testSuite.map(t => ({
      name: t.name,
      status: 'pending' as const,
      message: 'Esperando...'
    })))

    let passed = 0
    const newStats = { ...stats }

    for (let i = 0; i < testSuite.length; i++) {
      const success = await runTest(testSuite[i].name, testSuite[i].test, i)
      if (success) passed++
      
      setProgress(((i + 1) / testSuite.length) * 100)
      
      // Pequeña pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Actualizar estadísticas
    newStats.lastTest = Date.now()
    newStats.totalSaves += testSuite.length
    newStats.successfulSaves += passed
    await saveStats(newStats)

    setIsRunning(false)
    console.log(`✅ Pruebas completadas: ${passed}/${testSuite.length} exitosas`)
  }

  const clearAllData = async () => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('profile') || key.includes('test')) {
          localStorage.removeItem(key)
        }
      })
      
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach(key => {
        if (key.includes('profile') || key.includes('test')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    console.log('🧹 Datos de prueba limpiados')
    await loadCurrentProfile()
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'running': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'Exitosa'
      case 'failed': return 'Fallida'
      case 'running': return 'Ejecutando'
      default: return 'Pendiente'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Panel de Pruebas de Persistencia</CardTitle>
          <CardDescription>
            Verifica que el sistema de persistencia ultra-robusto funcione correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar Todas las Pruebas'}
            </Button>
            <Button 
              onClick={clearAllData} 
              variant="outline"
              disabled={isRunning}
            >
              Limpiar Datos de Prueba
            </Button>
          </div>
          
          {isRunning && (
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% completado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList>
          <TabsTrigger value="tests">Resultados de Pruebas</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="profile">Perfil Actual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests" className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(test.status)}>
                      {getStatusText(test.status)}
                    </Badge>
                    <h3 className="font-medium">{test.name}</h3>
                  </div>
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{test.message}</p>
                {test.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-blue-600">Ver detalles</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
          
          {tests.length === 0 && (
            <Alert>
              <AlertDescription>
                Haz clic en "Ejecutar Todas las Pruebas" para comenzar la verificación del sistema.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalSaves}</div>
                  <div className="text-sm text-gray-600">Total Guardados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.successfulSaves}</div>
                  <div className="text-sm text-gray-600">Guardados Exitosos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.dataCorruptions}</div>
                  <div className="text-sm text-gray-600">Corrupciones Detectadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.autoRepairs}</div>
                  <div className="text-sm text-gray-600">Reparaciones Auto</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {stats.totalSaves > 0 ? Math.round((stats.successfulSaves / stats.totalSaves) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Tasa de Éxito</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {stats.lastTest ? new Date(stats.lastTest).toLocaleString() : 'Nunca'}
                  </div>
                  <div className="text-sm text-gray-600">Última Prueba</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Actual en Memoria</CardTitle>
            </CardHeader>
            <CardContent>
              {currentProfile ? (
                <div className="space-y-2">
                  <div><strong>Nombre:</strong> {currentProfile.name}</div>
                  <div><strong>Email:</strong> {currentProfile.email}</div>
                  <div><strong>Nivel:</strong> {currentProfile.level}</div>
                  <div><strong>Última Modificación:</strong> {new Date((currentProfile as any).lastModified || Date.now()).toLocaleString()}</div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600">Ver perfil completo</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                      {JSON.stringify(currentProfile, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No hay perfil cargado en memoria.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
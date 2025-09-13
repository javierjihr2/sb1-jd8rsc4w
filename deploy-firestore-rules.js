#!/usr/bin/env node

/**
 * Script para desplegar reglas de Firestore de forma segura
 * 
 * Uso:
 * node deploy-firestore-rules.js [environment]
 * 
 * Environments:
 * - dev: Despliega reglas de desarrollo (firestore-dev.rules)
 * - prod: Despliega reglas de producción seguras (firestore-secure.rules)
 * - backup: Crea backup de las reglas actuales
 * - restore: Restaura reglas desde backup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  dev: {
    rulesFile: 'firestore-dev.rules',
    description: 'Reglas de desarrollo (más permisivas pero seguras)'
  },
  prod: {
    rulesFile: 'firestore-secure.rules',
    description: 'Reglas de producción (máxima seguridad)'
  },
  current: {
    rulesFile: 'firestore.rules',
    description: 'Reglas actuales'
  }
};

const BACKUP_DIR = 'firestore-rules-backups';

// Funciones de utilidad
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  if (!fileExists(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Directorio de backup creado: ${BACKUP_DIR}`);
  }
}

function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `firestore-rules-backup-${timestamp}.rules`;
}

// Funciones principales
function createBackup() {
  try {
    createBackupDir();
    
    const currentRules = readFile(CONFIG.current.rulesFile);
    const backupFileName = getBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    writeFile(backupPath, currentRules);
    
    log(`✅ Backup creado exitosamente: ${backupPath}`, 'success');
    return backupPath;
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`, 'error');
    throw error;
  }
}

function deployRules(environment) {
  try {
    if (!CONFIG[environment]) {
      throw new Error(`Ambiente no válido: ${environment}. Usar: dev, prod`);
    }
    
    const config = CONFIG[environment];
    
    // Verificar que el archivo de reglas existe
    if (!fileExists(config.rulesFile)) {
      throw new Error(`Archivo de reglas no encontrado: ${config.rulesFile}`);
    }
    
    log(`🔄 Iniciando despliegue de ${config.description}...`);
    
    // Crear backup antes del despliegue
    log('📦 Creando backup de reglas actuales...');
    const backupPath = createBackup();
    
    // Leer las nuevas reglas
    const newRules = readFile(config.rulesFile);
    
    // Validar sintaxis básica
    if (!newRules.includes('rules_version = \'2\'')) {
      throw new Error('Las reglas deben incluir rules_version = \'2\'');
    }
    
    // Copiar las nuevas reglas al archivo principal
    writeFile(CONFIG.current.rulesFile, newRules);
    log(`✅ Reglas copiadas a ${CONFIG.current.rulesFile}`, 'success');
    
    // Intentar desplegar con Firebase CLI
    try {
      log('🚀 Desplegando reglas a Firebase...');
      execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
      log('✅ Reglas desplegadas exitosamente a Firebase!', 'success');
    } catch (deployError) {
      log('❌ Error desplegando a Firebase. Restaurando backup...', 'error');
      
      // Restaurar backup
      const backupContent = readFile(backupPath);
      writeFile(CONFIG.current.rulesFile, backupContent);
      
      throw new Error(`Despliegue falló: ${deployError.message}`);
    }
    
    log(`🎉 Despliegue completado: ${config.description}`, 'success');
    
  } catch (error) {
    log(`❌ Error en despliegue: ${error.message}`, 'error');
    process.exit(1);
  }
}

function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      log('📁 No hay backups disponibles');
      return;
    }
    
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.rules'))
      .sort()
      .reverse(); // Más recientes primero
    
    if (backups.length === 0) {
      log('📁 No hay backups disponibles');
      return;
    }
    
    log('📋 Backups disponibles:');
    backups.forEach((backup, index) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, backup));
      log(`  ${index + 1}. ${backup} (${stats.mtime.toLocaleString()})`);
    });
    
  } catch (error) {
    log(`❌ Error listando backups: ${error.message}`, 'error');
  }
}

function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    if (!fileExists(backupPath)) {
      throw new Error(`Backup no encontrado: ${backupPath}`);
    }
    
    log(`🔄 Restaurando backup: ${backupFileName}`);
    
    // Crear backup de las reglas actuales antes de restaurar
    createBackup();
    
    // Restaurar el backup
    const backupContent = readFile(backupPath);
    writeFile(CONFIG.current.rulesFile, backupContent);
    
    log('✅ Backup restaurado exitosamente', 'success');
    log('⚠️  Recuerda desplegar las reglas a Firebase con: firebase deploy --only firestore:rules', 'warning');
    
  } catch (error) {
    log(`❌ Error restaurando backup: ${error.message}`, 'error');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔥 Script de Despliegue de Reglas de Firestore

Uso:
  node deploy-firestore-rules.js <comando> [opciones]

Comandos:
  dev                    Despliega reglas de desarrollo
  prod                   Despliega reglas de producción
  backup                 Crea backup de reglas actuales
  list                   Lista backups disponibles
  restore <archivo>      Restaura backup específico
  help                   Muestra esta ayuda

Ejemplos:
  node deploy-firestore-rules.js dev
  node deploy-firestore-rules.js prod
  node deploy-firestore-rules.js backup
  node deploy-firestore-rules.js list
  node deploy-firestore-rules.js restore firestore-rules-backup-2024-01-15T10-30-00-000Z.rules

Archivos de reglas:
  - firestore-dev.rules: Reglas de desarrollo (más permisivas)
  - firestore-secure.rules: Reglas de producción (máxima seguridad)
  - firestore.rules: Reglas actuales (se sobrescribe en despliegue)
`);
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'dev':
      deployRules('dev');
      break;
      
    case 'prod':
      deployRules('prod');
      break;
      
    case 'backup':
      createBackup();
      break;
      
    case 'list':
      listBackups();
      break;
      
    case 'restore':
      if (args.length < 2) {
        log('❌ Especifica el archivo de backup a restaurar', 'error');
        log('💡 Usa: node deploy-firestore-rules.js list para ver backups disponibles');
        process.exit(1);
      }
      restoreBackup(args[1]);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      log(`❌ Comando no reconocido: ${command}`, 'error');
      showHelp();
      process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  deployRules,
  createBackup,
  listBackups,
  restoreBackup
};
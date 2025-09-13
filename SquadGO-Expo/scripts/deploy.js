#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completado`, 'green');
  } catch (error) {
    log(`❌ Error en ${description}`, 'red');
    process.exit(1);
  }
}

function checkEnvironment() {
  log('🔍 Verificando entorno...', 'yellow');
  
  // Verificar que estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    log('❌ No se encontró package.json. Ejecuta este script desde la raíz del proyecto.', 'red');
    process.exit(1);
  }
  
  // Verificar que Expo CLI está instalado
  try {
    execSync('expo --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Expo CLI no está instalado. Instálalo con: npm install -g @expo/cli', 'red');
    process.exit(1);
  }
  
  // Verificar que EAS CLI está instalado
  try {
    execSync('eas --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ EAS CLI no está instalado. Instálalo con: npm install -g eas-cli', 'red');
    process.exit(1);
  }
  
  log('✅ Entorno verificado correctamente', 'green');
}

function runTests() {
  log('\n🧪 Ejecutando tests...', 'yellow');
  
  // Verificar que hay tests configurados
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts || !packageJson.scripts.test) {
    log('⚠️  No hay tests configurados, saltando...', 'yellow');
    return;
  }
  
  execCommand('npm test -- --watchAll=false --coverage', 'Ejecutando tests');
}

function runLinting() {
  log('\n🔍 Ejecutando linting...', 'yellow');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.lint) {
    execCommand('npm run lint', 'Ejecutando linting');
  } else {
    log('⚠️  No hay linting configurado, saltando...', 'yellow');
  }
}

function buildApp(platform, profile = 'production') {
  log(`\n🏗️  Construyendo aplicación para ${platform}...`, 'yellow');
  
  const command = `eas build --platform ${platform} --profile ${profile} --non-interactive`;
  execCommand(command, `Build de ${platform}`);
}

function publishUpdate(channel = 'production') {
  log(`\n📤 Publicando actualización al canal ${channel}...`, 'yellow');
  
  const command = `expo publish --release-channel ${channel}`;
  execCommand(command, `Publicación al canal ${channel}`);
}

function submitToStores(platform) {
  log(`\n🚀 Enviando a ${platform === 'ios' ? 'App Store' : 'Google Play'}...`, 'yellow');
  
  const command = `eas submit --platform ${platform} --latest --non-interactive`;
  execCommand(command, `Envío a ${platform === 'ios' ? 'App Store' : 'Google Play'}`);
}

function updateVersion(type = 'patch') {
  log(`\n📝 Actualizando versión (${type})...`, 'yellow');
  
  execCommand(`npm version ${type}`, `Actualización de versión ${type}`);
  
  // Actualizar también la versión en app.json/app.config.js
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = packageJson.version;
  
  if (fs.existsSync('app.json')) {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    appJson.expo.version = newVersion;
    fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
    log(`✅ Versión actualizada a ${newVersion} en app.json`, 'green');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  log('🚀 SquadUp Deployment Script', 'bright');
  log('================================', 'bright');
  
  switch (command) {
    case 'check':
      checkEnvironment();
      break;
      
    case 'test':
      checkEnvironment();
      runTests();
      break;
      
    case 'lint':
      checkEnvironment();
      runLinting();
      break;
      
    case 'build':
      const platform = args[1] || 'all';
      const profile = args[2] || 'production';
      
      checkEnvironment();
      runTests();
      runLinting();
      
      if (platform === 'all') {
        buildApp('android', profile);
        buildApp('ios', profile);
      } else {
        buildApp(platform, profile);
      }
      break;
      
    case 'publish':
      const channel = args[1] || 'production';
      
      checkEnvironment();
      runTests();
      runLinting();
      publishUpdate(channel);
      break;
      
    case 'submit':
      const submitPlatform = args[1] || 'all';
      
      checkEnvironment();
      
      if (submitPlatform === 'all') {
        submitToStores('android');
        submitToStores('ios');
      } else {
        submitToStores(submitPlatform);
      }
      break;
      
    case 'release':
      const versionType = args[1] || 'patch';
      const releaseChannel = args[2] || 'production';
      
      checkEnvironment();
      runTests();
      runLinting();
      updateVersion(versionType);
      publishUpdate(releaseChannel);
      buildApp('all');
      break;
      
    case 'full-deploy':
      checkEnvironment();
      runTests();
      runLinting();
      updateVersion('patch');
      publishUpdate('production');
      buildApp('all');
      submitToStores('all');
      break;
      
    default:
      log('\nUso: node scripts/deploy.js <comando> [opciones]', 'yellow');
      log('\nComandos disponibles:', 'cyan');
      log('  check                    - Verificar entorno', 'white');
      log('  test                     - Ejecutar tests', 'white');
      log('  lint                     - Ejecutar linting', 'white');
      log('  build [platform] [profile] - Construir app (android/ios/all)', 'white');
      log('  publish [channel]        - Publicar actualización OTA', 'white');
      log('  submit [platform]        - Enviar a stores (android/ios/all)', 'white');
      log('  release [type] [channel] - Release completo con nueva versión', 'white');
      log('  full-deploy              - Deployment completo (versión + build + submit)', 'white');
      log('\nEjemplos:', 'cyan');
      log('  node scripts/deploy.js build android preview', 'white');
      log('  node scripts/deploy.js publish staging', 'white');
      log('  node scripts/deploy.js release minor production', 'white');
      break;
  }
  
  log('\n✨ Script completado', 'green');
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironment,
  runTests,
  runLinting,
  buildApp,
  publishUpdate,
  submitToStores,
  updateVersion
};
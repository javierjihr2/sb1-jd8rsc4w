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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'bright');
}

function getCurrentProjectInfo() {
  try {
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    const projectId = firebaserc.projects.default;
    return { projectId };
  } catch (error) {
    logError('No se pudo leer .firebaserc');
    return null;
  }
}

function getFirebaseConfig() {
  try {
    const configPath = path.join('src', 'lib', 'firebase.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Extraer authDomain del archivo
    const authDomainMatch = configContent.match(/authDomain:\s*["']([^"']+)["']/);
    const projectIdMatch = configContent.match(/projectId:\s*["']([^"']+)["']/);
    
    return {
      authDomain: authDomainMatch ? authDomainMatch[1] : null,
      projectId: projectIdMatch ? projectIdMatch[1] : null
    };
  } catch (error) {
    logError('No se pudo leer la configuración de Firebase');
    return null;
  }
}

function getProductionUrls(projectId) {
  return [
    `https://${projectId}.web.app`,
    `https://${projectId}.firebaseapp.com`,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:8080',
    'http://localhost:9002',
    'http://192.168.209.143:9002',
    '192.168.209.143:9002'
  ];
}

function generateInstructions(projectId, authDomain) {
  const productionUrls = getProductionUrls(projectId);
  
  return `
${colors.bright}🔧 INSTRUCCIONES PARA CONFIGURAR DOMINIOS AUTORIZADOS${colors.reset}

${colors.yellow}1. Abrir Firebase Console:${colors.reset}
   https://console.firebase.google.com/project/${projectId}/authentication/settings

${colors.yellow}2. En la sección "Authorized domains", agregar estos dominios:${colors.reset}
${productionUrls.map(url => `   ✓ ${url}`).join('\n')}

${colors.yellow}3. Configuración actual detectada:${colors.reset}
   • Project ID: ${projectId}
   • Auth Domain: ${authDomain}
   • Hosting URL: https://${projectId}.web.app

${colors.yellow}4. Pasos en Firebase Console:${colors.reset}
   a) Ir a Authentication > Settings
   b) Scroll hasta "Authorized domains"
   c) Hacer clic en "Add domain"
   d) Agregar cada URL de la lista anterior
   e) Guardar cambios

${colors.yellow}5. Verificar después de agregar dominios:${colors.reset}
   • Abrir: https://${projectId}.web.app
   • Intentar registrarse/iniciar sesión
   • Verificar que no aparezca error "auth/unauthorized-domain"
`;
}

function checkFirebaseLogin() {
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  log('🔐 SOLUCIONADOR DE PROBLEMAS DE AUTENTICACIÓN - SQUADGO', 'bright');
  log('=' .repeat(60), 'blue');
  
  logStep(1, 'Verificando configuración del proyecto');
  
  if (!checkFirebaseLogin()) {
    logError('No estás autenticado en Firebase CLI');
    logInfo('Ejecuta: firebase login');
    process.exit(1);
  }
  
  const projectInfo = getCurrentProjectInfo();
  if (!projectInfo) {
    logError('No se pudo obtener información del proyecto');
    process.exit(1);
  }
  
  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig) {
    logError('No se pudo leer la configuración de Firebase');
    process.exit(1);
  }
  
  logSuccess(`Proyecto detectado: ${projectInfo.projectId}`);
  logSuccess(`Auth domain: ${firebaseConfig.authDomain}`);
  
  logStep(2, 'Generando instrucciones de configuración');
  console.log(generateInstructions(projectInfo.projectId, firebaseConfig.authDomain));
  
  logStep(3, 'Abriendo Firebase Console');
  const consoleUrl = `https://console.firebase.google.com/project/${projectInfo.projectId}/authentication/settings`;
  
  try {
    // Intentar abrir en Windows
    execSync(`start "" "${consoleUrl}"`, { stdio: 'ignore' });
    logSuccess('Firebase Console abierto en el navegador');
  } catch (error) {
    logWarning('No se pudo abrir automáticamente el navegador');
    logInfo(`Abre manualmente: ${consoleUrl}`);
  }
  
  logStep(4, 'URLs de prueba después de la configuración');
  log(`\n📱 URLs para probar:`, 'bright');
  log(`   • Producción: https://${projectInfo.projectId}.web.app`, 'green');
  log(`   • Local: http://localhost:3000`, 'green');
  
  logStep(5, 'Comandos útiles');
  log(`\n🛠️ Comandos de verificación:`, 'bright');
  log(`   firebase projects:list`, 'cyan');
  log(`   firebase hosting:channel:list`, 'cyan');
  log(`   npm run build && firebase deploy`, 'cyan');
  
  log(`\n🎉 Sigue las instrucciones anteriores para resolver el problema de autenticación`, 'green');
}

if (require.main === module) {
  main();
}

module.exports = {
  getCurrentProjectInfo,
  getFirebaseConfig,
  getProductionUrls,
  generateInstructions
};
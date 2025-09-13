#!/usr/bin/env node

/**
 * Script para configurar dominio personalizado en SquadGO
 * Uso: node scripts/setup-custom-domain.js <tu-dominio.com>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function generateDNSInstructions(domain) {
  return `
${colors.bright}📋 INSTRUCCIONES DNS PARA: ${domain}${colors.reset}

${colors.yellow}1. Registro de Verificación (TXT):${colors.reset}
   Tipo: TXT
   Nombre: @
   Valor: [Será proporcionado por Firebase Console]
   TTL: 3600

${colors.yellow}2. Dominio Principal (A):${colors.reset}
   Tipo: A
   Nombre: @
   Valor: 151.101.1.195
   TTL: 3600

   Tipo: A
   Nombre: @
   Valor: 151.101.65.195
   TTL: 3600

${colors.yellow}3. Subdominio WWW (CNAME):${colors.reset}
   Tipo: CNAME
   Nombre: www
   Valor: squadup-battle.web.app
   TTL: 3600

${colors.yellow}4. Subdominio APP (CNAME) [Opcional]:${colors.reset}
   Tipo: CNAME
   Nombre: app
   Valor: squadup-battle.web.app
   TTL: 3600
`;
}

function updateFirebaseConfig(domain) {
  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    
    // Agregar headers de seguridad
    if (!firebaseConfig.hosting.headers) {
      firebaseConfig.hosting.headers = [];
    }
    
    const securityHeaders = {
      "source": "**",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    };
    
    // Verificar si ya existen headers similares
    const hasSecurityHeaders = firebaseConfig.hosting.headers.some(h => 
      h.headers && h.headers.some(header => header.key === 'X-Frame-Options')
    );
    
    if (!hasSecurityHeaders) {
      firebaseConfig.hosting.headers.push(securityHeaders);
    }
    
    fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
    logSuccess('firebase.json actualizado con headers de seguridad');
  } catch (error) {
    logWarning(`No se pudo actualizar firebase.json: ${error.message}`);
  }
}

function createEnvProduction(domain) {
  const envPath = path.join(process.cwd(), '.env.production');
  const envContent = `# Configuración para dominio personalizado
NEXT_PUBLIC_APP_URL=https://${domain}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${domain}
`;
  
  try {
    if (fs.existsSync(envPath)) {
      const existingContent = fs.readFileSync(envPath, 'utf8');
      if (!existingContent.includes('NEXT_PUBLIC_APP_URL')) {
        fs.appendFileSync(envPath, '\n' + envContent);
      } else {
        logWarning('.env.production ya contiene configuración de dominio');
      }
    } else {
      fs.writeFileSync(envPath, envContent);
    }
    logSuccess('.env.production configurado');
  } catch (error) {
    logWarning(`No se pudo crear .env.production: ${error.message}`);
  }
}

function generateVerificationCommands(domain) {
  return `
${colors.bright}🔍 COMANDOS DE VERIFICACIÓN${colors.reset}

${colors.yellow}Verificar propagación DNS:${colors.reset}
  nslookup ${domain}
  nslookup -type=A ${domain}
  nslookup -type=CNAME www.${domain}
  nslookup -type=TXT ${domain}

${colors.yellow}Verificar SSL:${colors.reset}
  curl -I https://${domain}

${colors.yellow}Herramientas online:${colors.reset}
  - https://dnschecker.org/
  - https://www.whatsmydns.net/
  - https://www.ssllabs.com/ssltest/
`;
}

function main() {
  const domain = process.argv[2];
  
  log('🌐 CONFIGURADOR DE DOMINIO PERSONALIZADO - SQUADGO', 'bright');
  log('=' .repeat(50), 'blue');
  
  if (!domain) {
    logError('Por favor proporciona un dominio');
    log('Uso: node scripts/setup-custom-domain.js <tu-dominio.com>', 'yellow');
    process.exit(1);
  }
  
  if (!validateDomain(domain)) {
    logError('Formato de dominio inválido');
    process.exit(1);
  }
  
  logStep(1, 'Validando dominio');
  logSuccess(`Dominio válido: ${domain}`);
  
  logStep(2, 'Actualizando configuración de Firebase');
  updateFirebaseConfig(domain);
  
  logStep(3, 'Creando archivo de variables de entorno');
  createEnvProduction(domain);
  
  logStep(4, 'Generando instrucciones DNS');
  console.log(generateDNSInstructions(domain));
  
  logStep(5, 'URLs de Firebase Console');
  log(`\n📱 Firebase Console:`, 'bright');
  log(`   https://console.firebase.google.com/project/squadup-battle/hosting/main`, 'blue');
  log(`\n🔐 Authentication Settings:`, 'bright');
  log(`   https://console.firebase.google.com/project/squadup-battle/authentication/settings`, 'blue');
  
  logStep(6, 'Dominios a autorizar en Firebase Auth');
  log(`\n📋 Agregar estos dominios en Firebase Auth > Authorized domains:`, 'bright');
  log(`   - ${domain}`, 'green');
  log(`   - www.${domain}`, 'green');
  log(`   - app.${domain} (opcional)`, 'green');
  
  console.log(generateVerificationCommands(domain));
  
  logStep(7, 'Próximos pasos');
  log(`\n📝 CHECKLIST:`, 'bright');
  log(`   [ ] 1. Configurar registros DNS en tu proveedor`, 'yellow');
  log(`   [ ] 2. Agregar dominio en Firebase Console`, 'yellow');
  log(`   [ ] 3. Verificar propiedad del dominio (TXT)`, 'yellow');
  log(`   [ ] 4. Autorizar dominios en Firebase Auth`, 'yellow');
  log(`   [ ] 5. Esperar propagación DNS (24-48h)`, 'yellow');
  log(`   [ ] 6. Verificar SSL y funcionalidad`, 'yellow');
  log(`   [ ] 7. Deploy final: npm run build && firebase deploy`, 'yellow');
  
  log(`\n🎉 Configuración completada para: ${domain}`, 'green');
  log(`\n📖 Para más detalles, consulta: DOMINIO_PERSONALIZADO_GUIA.md`, 'cyan');
}

if (require.main === module) {
  main();
}

module.exports = {
  validateDomain,
  generateDNSInstructions,
  updateFirebaseConfig,
  createEnvProduction
};
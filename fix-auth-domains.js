const { execSync } = require('child_process');
const fs = require('fs');

const PROJECT_ID = 'squadgo-app';

function getProjectInfo() {
  try {
    const result = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
    const projects = JSON.parse(result);
    const project = projects.find(p => p.projectId === PROJECT_ID);
    return project;
  } catch (error) {
    console.error('Error getting project info:', error.message);
    return null;
  }
}

function getFirebaseConfig() {
  try {
    const configPath = './src/lib/firebase.ts';
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const authDomainMatch = content.match(/authDomain: "([^"]+)"/);
      return {
        authDomain: authDomainMatch ? authDomainMatch[1] : null
      };
    }
  } catch (error) {
    console.error('Error reading Firebase config:', error.message);
  }
  return null;
}

function getProductionUrls() {
  try {
    const result = execSync(`firebase hosting:sites:list --json`, { encoding: 'utf8' });
    const sites = JSON.parse(result);
    return sites.map(site => `https://${site.defaultUrl.replace('https://', '')}`);
  } catch (error) {
    console.error('Error getting hosting sites:', error.message);
    return [];
  }
}

function generateInstructions() {
  console.log('\n🔧 INSTRUCCIONES PARA RESOLVER EL PROBLEMA DE AUTENTICACIÓN\n');
  
  const project = getProjectInfo();
  const config = getFirebaseConfig();
  const productionUrls = getProductionUrls();
  
  console.log('📋 Información del proyecto:');
  console.log(`   - Project ID: ${PROJECT_ID}`);
  console.log(`   - Project Name: ${project ? project.displayName : 'No encontrado'}`);
  console.log(`   - Auth Domain actual: ${config ? config.authDomain : 'No encontrado'}`);
  
  console.log('\n🌐 URLs de producción detectadas:');
  productionUrls.forEach(url => console.log(`   - ${url}`));
  
  console.log('\n🔑 PASOS PARA CONFIGURAR DOMINIOS AUTORIZADOS:');
  console.log('\n1. Ve a Firebase Console > Authentication > Settings > Authorized domains');
  console.log('2. Agrega los siguientes dominios a la lista de dominios autorizados:');
  
  const domainsToAdd = [
    'https://squadgo-app.web.app',
    'https://squadgo-app.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080'
  ];
  
  domainsToAdd.forEach(domain => {
    console.log(`   ✅ ${domain}`);
  });
  
  console.log('\n3. Guarda los cambios en Firebase Console');
  console.log('4. Espera unos minutos para que los cambios se propaguen');
  console.log('5. Prueba la autenticación nuevamente');
  
  console.log('\n🚀 Abriendo Firebase Console...');
  
  // Abrir Firebase Console
  try {
    execSync(`start https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`\n🌐 Abre manualmente: https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings`);
  }
}

generateInstructions();
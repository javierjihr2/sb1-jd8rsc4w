// Script para habilitar las APIs necesarias de Firebase
// Ejecutar con: node scripts/enable-firebase-apis.js

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Lista de APIs de Firebase que necesitamos habilitar
const requiredApis = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com', // Firebase Auth
  'cloudfunctions.googleapis.com',
  'storage-component.googleapis.com',
  'storage.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com'
];

const projectId = 'squadgo-app';

async function enableFirebaseApis() {
  console.log('🔧 Habilitando APIs de Firebase para el proyecto:', projectId);
  console.log('📋 APIs a habilitar:', requiredApis.length);
  
  try {
    // Verificar si gcloud está instalado
    try {
      await execPromise('gcloud --version');
      console.log('✅ Google Cloud CLI detectado');
    } catch (error) {
      console.log('❌ Google Cloud CLI no está instalado');
      console.log('📥 Instala gcloud CLI desde: https://cloud.google.com/sdk/docs/install');
      return;
    }
    
    // Configurar el proyecto
    console.log('🔧 Configurando proyecto...');
    await execPromise(`gcloud config set project ${projectId}`);
    
    // Habilitar cada API
    for (const api of requiredApis) {
      try {
        console.log(`🔄 Habilitando ${api}...`);
        await execPromise(`gcloud services enable ${api}`);
        console.log(`✅ ${api} habilitada`);
      } catch (error) {
        console.log(`⚠️ Error habilitando ${api}:`, error.message);
      }
    }
    
    console.log('\n🎉 Proceso completado!');
    console.log('⏳ Las APIs pueden tardar unos minutos en estar completamente disponibles.');
    console.log('🔄 Reinicia tu aplicación después de unos minutos.');
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error.message);
    console.log('\n🛠️ Soluciones alternativas:');
    console.log('1. Habilita las APIs manualmente en: https://console.cloud.google.com/apis/dashboard');
    console.log('2. Asegúrate de tener permisos de administrador en el proyecto');
    console.log('3. Verifica que el proyecto existe y está activo');
  }
}

// Función alternativa usando Firebase CLI
async function enableWithFirebaseCli() {
  console.log('\n🔧 Intentando con Firebase CLI...');
  
  try {
    // Verificar autenticación
    await execPromise('firebase login:list');
    
    // Inicializar Firestore
    console.log('🔄 Inicializando Firestore...');
    await execPromise('firebase firestore:databases:create --location=us-central1');
    console.log('✅ Firestore inicializado');
    
  } catch (error) {
    console.log('⚠️ Error con Firebase CLI:', error.message);
    console.log('💡 Intenta: firebase login');
  }
}

// Ejecutar el script
if (require.main === module) {
  console.log('🚀 Iniciando configuración de Firebase APIs...');
  enableFirebaseApis().then(() => {
    return enableWithFirebaseCli();
  }).catch(error => {
    console.error('❌ Error final:', error.message);
    process.exit(1);
  });
}

module.exports = { enableFirebaseApis, enableWithFirebaseCli };
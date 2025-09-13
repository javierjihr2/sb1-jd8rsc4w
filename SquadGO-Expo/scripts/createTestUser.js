// Script para crear usuario de prueba en Firebase Auth
// Ejecutar con: node scripts/createTestUser.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Configuración de Firebase (misma que en tu app)
const firebaseConfig = {
  projectId: "squadgo-app",
  appId: "1:442519077443:web:3d4e9e034e222838230af6",
  storageBucket: "squadgo-app.firebasestorage.app",
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: "squadgo-app.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "442519077443"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  try {
    console.log('🔄 Creando usuario de prueba...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'test@squadgo.com',
      'SquadGo2024!'
    );
    
    const user = userCredential.user;
    console.log('✅ Usuario creado en Auth:', user.uid);
    
    // Crear perfil en Firestore
    await setDoc(doc(db, 'profiles', user.uid), {
      username: 'TestUser',
      fullName: 'Usuario de Prueba',
      email: 'test@squadgo.com',
      bio: '🎮 Usuario de prueba para SquadGO - ¡Listo para jugar PUBG Mobile!',
      pubgId: 'TestSquadGO2024',
      rank: 'Diamond',
      kd: 2.5,
      wins: 150,
      matches: 300,
      avatarUrl: '',
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Perfil creado en Firestore');
    
    // Crear algunas publicaciones de ejemplo
    const { addDoc, collection } = require('firebase/firestore');
    
    const posts = [
      {
        content: '¡Hola SquadGO! 🎮 Soy el usuario de prueba y estoy listo para encontrar compañeros de equipo para PUBG Mobile. ¿Quién se apunta para algunas partidas épicas? 🔥',
        userId: user.uid,
        username: 'TestUser',
        userAvatar: '',
        likes: ['sample-like-1', 'sample-like-2'],
        comments: [],
        saves: [],
        imageUrl: '',
        createdAt: new Date()
      },
      {
        content: 'Acabo de conseguir mi rango Diamond! 💎 Buscando squad serio para push a Crown. Mi K/D es 2.5 y tengo más de 150 chicken dinners 🍗 ¿Alguien interesado?',
        userId: user.uid,
        username: 'TestUser',
        userAvatar: '',
        likes: ['sample-like-3'],
        comments: [],
        saves: [],
        imageUrl: '',
        createdAt: new Date(Date.now() - 3600000) // 1 hora atrás
      },
      {
        content: 'Tips para mejorar en PUBG Mobile:\n\n🎯 Practica tu aim en el campo de entrenamiento\n🏃‍♂️ Aprende las mejores rutas de loot\n🎧 Usa audífonos para escuchar pasos\n🤝 Comunícate con tu squad\n\n¿Qué otros consejos agregarían?',
        userId: user.uid,
        username: 'TestUser',
        userAvatar: '',
        likes: [],
        comments: [],
        saves: [],
        imageUrl: '',
        createdAt: new Date(Date.now() - 7200000) // 2 horas atrás
      }
    ];
    
    for (const post of posts) {
      await addDoc(collection(db, 'posts'), post);
    }
    
    console.log('✅ Posts de ejemplo creados');
    
    console.log('\n🎉 ¡Usuario de prueba creado exitosamente!');
    console.log('📧 Email: test@squadgo.com');
    console.log('🔑 Contraseña: SquadGo2024!');
    console.log('👤 Username: TestUser');
    console.log('🆔 UID:', user.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ El usuario ya existe. Puedes usar las credenciales:');
      console.log('📧 Email: test@squadgo.com');
      console.log('🔑 Contraseña: SquadGo2024!');
    } else {
      console.error('❌ Error creando usuario:', error.message);
    }
  }
}

// Ejecutar la función
createTestUser().then(() => {
  console.log('\n✨ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error en el script:', error);
  process.exit(1);
});
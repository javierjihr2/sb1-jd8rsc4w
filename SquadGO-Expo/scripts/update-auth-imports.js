const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan ser actualizados
const filesToUpdate = [
  'app/settings/notifications.tsx',
  'app/settings/profile.tsx',
  'app/(tabs)/feed.tsx',
  'app/(tabs)/profile.tsx',
  'app/settings/blocked-users.tsx',
  'components/ProfileDropdownMenu.tsx',
  'components/CustomHeader.tsx',
  'app/settings/index.tsx',
  'app/settings/gaming.tsx',
  'app/(auth)/login.tsx',
  'components/PollComponent.tsx',
  'components/AdvancedPostCreator.tsx',
  'components/PostCard.tsx',
  'app/(tabs)/settings.tsx',
  'app/index.tsx',
  'app/(tabs)/matchmaking.tsx',
  'app/settings/security.tsx',
  'app/(tabs)/match-connections.tsx',
  'app/(tabs)/friends.tsx',
  'app/settings/privacy.tsx',
  'app/(tabs)/tournaments.tsx',
  'app/(tabs)/sensitivities.tsx',
  'app/settings/account.tsx',
  'app/(tabs)/maps.tsx',
  'app/(tabs)/chat.tsx',
  'app/(auth)/register.tsx'
];

// Función para actualizar las importaciones
function updateImports() {
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reemplazar las importaciones
      content = content.replace(
        /import\s*{\s*useAuth\s*}\s*from\s*['"].*\/contexts\/AuthContext['"]/g,
        "import { useAuth } from '../contexts/AuthContextSimple'"
      );
      
      // Para archivos en subdirectorios, ajustar la ruta
      if (filePath.includes('settings/') || filePath.includes('(tabs)/') || filePath.includes('(auth)/')) {
        content = content.replace(
          "import { useAuth } from '../contexts/AuthContextSimple'",
          "import { useAuth } from '../../contexts/AuthContextSimple'"
        );
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error.message);
    }
  });
}

// Ejecutar la actualización
updateImports();
console.log('Import updates completed!');
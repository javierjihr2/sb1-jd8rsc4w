const fs = require('fs');
const path = require('path');

// Función para convertir rutas absolutas a relativas
function fixPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Reemplazar rutas absolutas con relativas
  content = content.replace(/href="\/_next\//g, 'href="./_next/');
  content = content.replace(/src="\/_next\//g, 'src="./_next/');
  content = content.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed paths in: ${filePath}`);
}

// Procesar todos los archivos HTML en el directorio out
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.html')) {
      fixPaths(fullPath);
    }
  });
}

// Ejecutar el script
const outDir = path.join(__dirname, '..', 'out');
if (fs.existsSync(outDir)) {
  processDirectory(outDir);
  console.log('Path fixing completed!');
} else {
  console.error('Out directory not found!');
}
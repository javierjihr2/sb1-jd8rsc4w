#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Bundle Analyzer Script
 * Analiza el tamaño del bundle y proporciona recomendaciones de optimización
 */

class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = path.join(this.projectRoot, 'bundle-analysis');
    this.reportPath = path.join(this.outputDir, 'bundle-report.json');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
  }

  async analyze() {
    console.log(chalk.blue('🔍 Iniciando análisis del proyecto...\n'));

    try {
      // Crear directorio de salida
      this.ensureOutputDir();

      // Analizar proyecto completo
      const projectAnalysis = await this.analyzeProject();

      // Analizar assets
      const assetStats = this.analyzeAssets();

      // Generar reporte
      this.generateReport(projectAnalysis, assetStats);

      // Proporcionar recomendaciones
      this.provideRecommendations(projectAnalysis, assetStats);

    } catch (error) {
      console.error(chalk.red('❌ Error durante el análisis:'), error.message);
      process.exit(1);
    }
  }

  async analyzeProject() {
    console.log(chalk.blue('🔍 Analizando proyecto...'));
    
    const dependencyAnalysis = await this.analyzeDependencies();
    
    // Analizar archivos del proyecto
    const projectFiles = this.analyzeProjectFiles();
    
    // Análisis combinado
    const analysis = {
      ...dependencyAnalysis,
      projectFiles,
      timestamp: new Date().toISOString(),
      recommendations: this.generateRecommendations(dependencyAnalysis, projectFiles)
    };

    console.log(chalk.green('✅ Análisis completado\n'));
    return analysis;
  }

  generateRecommendations(dependencyAnalysis, projectFiles) {
    const recommendations = [];
    
    // Recomendaciones basadas en dependencias
    if (dependencyAnalysis.heavyDependencies.length > 0) {
      recommendations.push('Considera alternativas más ligeras para dependencias pesadas');
    }
    
    // Recomendaciones basadas en archivos del proyecto
    if (projectFiles.totalFiles > 200) {
      recommendations.push('Proyecto con muchos archivos, considera modularización');
    }
    
    return recommendations;
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async analyzeDependencies() {
    console.log(chalk.yellow('📦 Analizando dependencias del proyecto...'));
    
    try {
      // Leer package.json
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      
      // Analizar dependencias
      const dependencies = {
        production: packageJson.dependencies || {},
        development: packageJson.devDependencies || {},
        peer: packageJson.peerDependencies || {}
      };
      
      // Calcular tamaños estimados de node_modules
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      let totalSize = 0;
      const dependencySizes = {};
      
      if (fs.existsSync(nodeModulesPath)) {
        for (const depName of Object.keys(dependencies.production)) {
          const depPath = path.join(nodeModulesPath, depName);
          if (fs.existsSync(depPath)) {
            const size = this.calculateDirectorySize(depPath);
            dependencySizes[depName] = size;
            totalSize += size;
          }
        }
      }
      
      console.log(chalk.green('✅ Análisis de dependencias completado\n'));
      
      return {
        dependencies,
        dependencySizes,
        totalSize,
        packageJson
      };
    } catch (error) {
      throw new Error(`Error analizando dependencias: ${error.message}`);
    }
  }

  analyzeBundleSize() {
    console.log(chalk.yellow('📊 Analizando tamaño del bundle...'));
    
    if (!fs.existsSync(this.bundlePath)) {
      throw new Error('Bundle no encontrado');
    }

    const stats = fs.statSync(this.bundlePath);
    const sizeInBytes = stats.size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    const bundleContent = fs.readFileSync(this.bundlePath, 'utf8');
    const moduleCount = (bundleContent.match(/\"\d+\":/g) || []).length;

    return {
      sizeInBytes,
      sizeInKB,
      sizeInMB,
      moduleCount,
      gzipEstimate: this.estimateGzipSize(bundleContent)
    };
  }

  estimateGzipSize(content) {
    // Estimación aproximada del tamaño gzip (típicamente 70-80% de reducción)
    const estimatedGzipSize = content.length * 0.3;
    return {
      bytes: Math.round(estimatedGzipSize),
      kb: (estimatedGzipSize / 1024).toFixed(2),
      mb: (estimatedGzipSize / (1024 * 1024)).toFixed(2)
    };
  }

  async analyzeDependencies() {
    console.log(chalk.yellow('📋 Analizando dependencias...'));
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const heavyDependencies = [];
    const unusedDependencies = [];

    // Analizar tamaño de node_modules
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    const nodeModulesSize = this.getDirectorySize(nodeModulesPath);

    // Identificar dependencias pesadas (esto es una simplificación)
    const knownHeavyPackages = [
      'react-native-vector-icons',
      'react-native-maps',
      'react-native-video',
      'lottie-react-native',
      '@react-native-firebase/app',
      'react-native-chart-kit'
    ];

    Object.keys(dependencies).forEach(dep => {
      if (knownHeavyPackages.includes(dep)) {
        heavyDependencies.push(dep);
      }
    });

    return {
      total: Object.keys(dependencies).length,
      nodeModulesSize,
      heavyDependencies,
      unusedDependencies
    };
  }

  analyzeAssets() {
    console.log(chalk.yellow('🖼️  Analizando assets...'));
    
    const assetsDir = path.join(this.projectRoot, 'assets');
    let totalSize = 0;
    let imageCount = 0;
    let fontCount = 0;
    const largeAssets = [];

    if (fs.existsSync(assetsDir)) {
      const analyzeDir = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            analyzeDir(filePath);
          } else {
            totalSize += stats.size;
            
            const ext = path.extname(file).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
              imageCount++;
            } else if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
              fontCount++;
            }
            
            // Assets mayores a 100KB
            if (stats.size > 100 * 1024) {
              largeAssets.push({
                file: path.relative(this.projectRoot, filePath),
                size: stats.size,
                sizeKB: (stats.size / 1024).toFixed(2)
              });
            }
          }
        });
      };
      
      analyzeDir(assetsDir);
    }

    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      imageCount,
      fontCount,
      largeAssets
    };
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignorar errores de permisos
    }
    
    return totalSize;
  }

  getDirectorySize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  }

  analyzeProjectFiles() {
     console.log(chalk.yellow('📁 Analizando archivos del proyecto...'));
     
     // Directorios típicos de React Native/Expo
     const projectDirs = [
       path.join(this.projectRoot, 'src'),
       path.join(this.projectRoot, 'components'),
       path.join(this.projectRoot, 'screens'),
       path.join(this.projectRoot, 'utils'),
       path.join(this.projectRoot, 'lib'),
       path.join(this.projectRoot, 'hooks'),
       path.join(this.projectRoot, 'context'),
       path.join(this.projectRoot, 'services')
     ];
     
     let totalFiles = 0;
     let totalSize = 0;
     const fileTypes = {};
     
     const analyzeDir = (dir) => {
       try {
         const files = fs.readdirSync(dir);
         
         files.forEach(file => {
           const filePath = path.join(dir, file);
           const stats = fs.statSync(filePath);
           
           if (stats.isDirectory()) {
             // Evitar node_modules y otros directorios no relevantes
             if (!['node_modules', '.git', '.expo', 'dist', 'build'].includes(file)) {
               analyzeDir(filePath);
             }
           } else {
             // Solo contar archivos de código relevantes
             const ext = path.extname(file).toLowerCase();
             if (['.js', '.jsx', '.ts', '.tsx', '.json'].includes(ext)) {
               totalFiles++;
               totalSize += stats.size;
               fileTypes[ext] = (fileTypes[ext] || 0) + 1;
             }
           }
         });
       } catch (error) {
         // Ignorar errores de permisos o directorios no existentes
       }
     };
     
     // Analizar cada directorio que exista
     projectDirs.forEach(dir => {
       if (fs.existsSync(dir)) {
         analyzeDir(dir);
       }
     });
     
     // También analizar archivos raíz importantes
     const rootFiles = ['App.js', 'App.tsx', 'index.js', 'index.tsx'];
     rootFiles.forEach(file => {
       const filePath = path.join(this.projectRoot, file);
       if (fs.existsSync(filePath)) {
         const stats = fs.statSync(filePath);
         totalFiles++;
         totalSize += stats.size;
         const ext = path.extname(file).toLowerCase();
         fileTypes[ext] = (fileTypes[ext] || 0) + 1;
       }
     });
     
     return {
       totalFiles,
       totalSize,
       totalSizeKB: (totalSize / 1024).toFixed(2),
       fileTypes
     };
   }

  generateReport(projectAnalysis, assetStats) {
    console.log(chalk.blue('\n📄 Generando reporte...\n'));
    
    const report = {
      timestamp: new Date().toISOString(),
      project: projectAnalysis,
      assets: assetStats
    };

    // Guardar reporte JSON
    const reportPath = path.join(this.outputDir, 'project-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Mostrar resumen en consola
    this.displaySummary(projectAnalysis, assetStats);

    console.log(chalk.green(`\n📄 Reporte completo guardado en: ${reportPath}`));
  }

  displaySummary(projectAnalysis, assetStats) {
    console.log(chalk.bold('📊 RESUMEN DEL ANÁLISIS'));
    console.log(chalk.bold('========================\n'));

    // Project Files Stats
    console.log(chalk.cyan('📁 Archivos del Proyecto:'));
    console.log(`   Total archivos: ${projectAnalysis.projectFiles.totalFiles}`);
    console.log(`   Tamaño total: ${projectAnalysis.projectFiles.totalSizeKB} KB`);
    console.log(`   Tipos de archivo: ${Object.keys(projectAnalysis.projectFiles.fileTypes).join(', ')}\n`);

    // Dependencies Stats
    console.log(chalk.cyan('📋 Dependencias:'));
    console.log(`   Total: ${projectAnalysis.total}`);
    console.log(`   Node modules: ${(projectAnalysis.nodeModulesSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Dependencias pesadas: ${projectAnalysis.heavyDependencies.join(', ') || 'Ninguna'}\n`);

    // Assets Stats
    console.log(chalk.cyan('🖼️  Assets:'));
    console.log(`   Tamaño total: ${assetStats.totalSizeMB} MB (${assetStats.totalSizeKB} KB)`);
    console.log(`   Imágenes: ${assetStats.imageCount}`);
    console.log(`   Fuentes: ${assetStats.fontCount}`);
    
    if (assetStats.largeAssets.length > 0) {
      console.log(`   Assets grandes (>100KB):`);
      assetStats.largeAssets.forEach(asset => {
        console.log(`     - ${asset.file}: ${asset.sizeKB} KB`);
      });
    }
  }

  provideRecommendations(projectAnalysis, assetStats) {
    console.log(chalk.bold('\n💡 RECOMENDACIONES'));
    console.log(chalk.bold('==================\n'));

    const recommendations = [];

    // Project size recommendations
    if (projectAnalysis.projectFiles.totalFiles > 200) {
      recommendations.push('🟡 Proyecto con muchos archivos. Considera modularización.');
    }

    // Dependencies recommendations
    if (projectAnalysis.heavyDependencies.length > 0) {
      recommendations.push(`🟡 Dependencias pesadas detectadas: ${projectAnalysis.heavyDependencies.join(', ')}`);
      recommendations.push('   Considera alternativas más ligeras o lazy loading.');
    }

    // Assets recommendations
    if (assetStats.largeAssets.length > 0) {
      recommendations.push('🟡 Assets grandes detectados. Considera optimización de imágenes.');
    }

    // General recommendations
    recommendations.push('\n🚀 Optimizaciones sugeridas:');
    recommendations.push('   • Implementar lazy loading para pantallas no críticas');
    recommendations.push('   • Optimizar imágenes (WebP, compresión)');
    recommendations.push('   • Usar React.memo() para componentes pesados');
    recommendations.push('   • Implementar virtualization para listas largas');
    recommendations.push('   • Considerar Hermes engine para mejor performance');

    recommendations.forEach(rec => console.log(rec));
  }
}

// Ejecutar análisis si se llama directamente
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = BundleAnalyzer;
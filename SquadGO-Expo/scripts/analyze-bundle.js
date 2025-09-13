#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuración
const CONFIG = {
  outputDir: 'dist',
  reportDir: 'performance-reports',
  thresholds: {
    bundleSize: 5 * 1024 * 1024, // 5MB
    chunkSize: 1 * 1024 * 1024,  // 1MB
    assetSize: 500 * 1024,       // 500KB
  },
  formats: ['json', 'html', 'text']
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundles: [],
      assets: [],
      dependencies: [],
      warnings: [],
      errors: [],
      summary: {}
    };
  }

  async analyze() {
    console.log(chalk.blue('🔍 Iniciando análisis de bundle...'));
    
    try {
      // Crear directorio de reportes
      this.ensureDirectoryExists(CONFIG.reportDir);
      
      // Analizar bundle principal
      await this.analyzeBundles();
      
      // Analizar assets
      await this.analyzeAssets();
      
      // Analizar dependencias
      await this.analyzeDependencies();
      
      // Generar resumen
      this.generateSummary();
      
      // Verificar umbrales
      this.checkThresholds();
      
      // Generar reportes
      await this.generateReports();
      
      // Mostrar resultados
      this.displayResults();
      
    } catch (error) {
      console.error(chalk.red('❌ Error durante el análisis:'), error.message);
      process.exit(1);
    }
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async analyzeBundles() {
    console.log(chalk.yellow('📦 Analizando bundles...'));
    
    // Ejecutar metro bundle para análisis
    try {
      const bundleCommand = 'npx expo export --platform all --clear';
      execSync(bundleCommand, { stdio: 'pipe' });
      
      // Analizar archivos generados
      const distPath = path.join(process.cwd(), CONFIG.outputDir);
      if (fs.existsSync(distPath)) {
        this.analyzeBundleFiles(distPath);
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'bundle_analysis',
        message: 'No se pudo generar bundle para análisis',
        details: error.message
      });
    }
  }

  analyzeBundleFiles(distPath) {
    const files = this.getAllFiles(distPath);
    
    files.forEach(file => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(distPath, file);
      const ext = path.extname(file);
      
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        this.results.bundles.push({
          name: relativePath,
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          type: 'javascript',
          gzipSize: this.estimateGzipSize(stats.size)
        });
      }
    });
  }

  async analyzeAssets() {
    console.log(chalk.yellow('🖼️  Analizando assets...'));
    
    const assetsPath = path.join(process.cwd(), 'assets');
    if (!fs.existsSync(assetsPath)) {
      return;
    }
    
    const assetFiles = this.getAllFiles(assetsPath);
    
    assetFiles.forEach(file => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(assetsPath, file);
      const ext = path.extname(file).toLowerCase();
      
      this.results.assets.push({
        name: relativePath,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        type: this.getAssetType(ext),
        optimizable: this.isOptimizable(ext, stats.size)
      });
    });
  }

  async analyzeDependencies() {
    console.log(chalk.yellow('📚 Analizando dependencias...'));
    
    try {
      // Leer package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      // Analizar tamaño de node_modules
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        Object.keys(dependencies).forEach(dep => {
          const depPath = path.join(nodeModulesPath, dep);
          if (fs.existsSync(depPath)) {
            const size = this.getDirectorySize(depPath);
            this.results.dependencies.push({
              name: dep,
              version: dependencies[dep],
              size: size,
              sizeFormatted: this.formatBytes(size),
              type: packageJson.dependencies[dep] ? 'production' : 'development'
            });
          }
        });
      }
      
      // Ordenar por tamaño
      this.results.dependencies.sort((a, b) => b.size - a.size);
      
    } catch (error) {
      this.results.warnings.push({
        type: 'dependency_analysis',
        message: 'Error analizando dependencias',
        details: error.message
      });
    }
  }

  generateSummary() {
    const totalBundleSize = this.results.bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const totalAssetSize = this.results.assets.reduce((sum, asset) => sum + asset.size, 0);
    const totalDependencySize = this.results.dependencies.reduce((sum, dep) => sum + dep.size, 0);
    
    this.results.summary = {
      totalBundleSize,
      totalAssetSize,
      totalDependencySize,
      totalSize: totalBundleSize + totalAssetSize,
      bundleCount: this.results.bundles.length,
      assetCount: this.results.assets.length,
      dependencyCount: this.results.dependencies.length,
      largestBundle: this.results.bundles.reduce((max, bundle) => 
        bundle.size > (max?.size || 0) ? bundle : max, null),
      largestAsset: this.results.assets.reduce((max, asset) => 
        asset.size > (max?.size || 0) ? asset : max, null),
      largestDependency: this.results.dependencies[0] || null
    };
  }

  checkThresholds() {
    console.log(chalk.yellow('⚠️  Verificando umbrales...'));
    
    // Verificar tamaño total del bundle
    if (this.results.summary.totalBundleSize > CONFIG.thresholds.bundleSize) {
      this.results.warnings.push({
        type: 'threshold_exceeded',
        message: `Bundle total excede el umbral (${this.formatBytes(CONFIG.thresholds.bundleSize)})`,
        current: this.formatBytes(this.results.summary.totalBundleSize),
        threshold: this.formatBytes(CONFIG.thresholds.bundleSize)
      });
    }
    
    // Verificar bundles individuales
    this.results.bundles.forEach(bundle => {
      if (bundle.size > CONFIG.thresholds.chunkSize) {
        this.results.warnings.push({
          type: 'large_chunk',
          message: `Bundle '${bundle.name}' es muy grande`,
          current: bundle.sizeFormatted,
          threshold: this.formatBytes(CONFIG.thresholds.chunkSize)
        });
      }
    });
    
    // Verificar assets
    this.results.assets.forEach(asset => {
      if (asset.size > CONFIG.thresholds.assetSize) {
        this.results.warnings.push({
          type: 'large_asset',
          message: `Asset '${asset.name}' es muy grande`,
          current: asset.sizeFormatted,
          threshold: this.formatBytes(CONFIG.thresholds.assetSize)
        });
      }
    });
  }

  async generateReports() {
    console.log(chalk.yellow('📄 Generando reportes...'));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Reporte JSON
    if (CONFIG.formats.includes('json')) {
      const jsonPath = path.join(CONFIG.reportDir, `bundle-analysis-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    }
    
    // Reporte HTML
    if (CONFIG.formats.includes('html')) {
      const htmlPath = path.join(CONFIG.reportDir, `bundle-analysis-${timestamp}.html`);
      fs.writeFileSync(htmlPath, this.generateHtmlReport());
    }
    
    // Reporte de texto
    if (CONFIG.formats.includes('text')) {
      const textPath = path.join(CONFIG.reportDir, `bundle-analysis-${timestamp}.txt`);
      fs.writeFileSync(textPath, this.generateTextReport());
    }
  }

  generateHtmlReport() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .large { color: #d63384; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Bundle Analysis Report</h1>
    <p>Generated: ${this.results.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Bundle Size:</strong> ${this.formatBytes(this.results.summary.totalBundleSize)}</p>
        <p><strong>Total Asset Size:</strong> ${this.formatBytes(this.results.summary.totalAssetSize)}</p>
        <p><strong>Total Size:</strong> ${this.formatBytes(this.results.summary.totalSize)}</p>
        <p><strong>Bundle Count:</strong> ${this.results.summary.bundleCount}</p>
        <p><strong>Asset Count:</strong> ${this.results.summary.assetCount}</p>
    </div>
    
    ${this.results.warnings.map(w => `<div class="warning"><strong>${w.type}:</strong> ${w.message}</div>`).join('')}
    ${this.results.errors.map(e => `<div class="error"><strong>Error:</strong> ${e.message}</div>`).join('')}
    
    <h2>Bundles</h2>
    <table>
        <tr><th>Name</th><th>Size</th><th>Type</th><th>Gzip (est.)</th></tr>
        ${this.results.bundles.map(b => `
            <tr>
                <td>${b.name}</td>
                <td class="${b.size > CONFIG.thresholds.chunkSize ? 'large' : ''}">${b.sizeFormatted}</td>
                <td>${b.type}</td>
                <td>${this.formatBytes(b.gzipSize)}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>Assets</h2>
    <table>
        <tr><th>Name</th><th>Size</th><th>Type</th><th>Optimizable</th></tr>
        ${this.results.assets.map(a => `
            <tr>
                <td>${a.name}</td>
                <td class="${a.size > CONFIG.thresholds.assetSize ? 'large' : ''}">${a.sizeFormatted}</td>
                <td>${a.type}</td>
                <td>${a.optimizable ? 'Yes' : 'No'}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>Top Dependencies</h2>
    <table>
        <tr><th>Name</th><th>Version</th><th>Size</th><th>Type</th></tr>
        ${this.results.dependencies.slice(0, 20).map(d => `
            <tr>
                <td>${d.name}</td>
                <td>${d.version}</td>
                <td>${d.sizeFormatted}</td>
                <td>${d.type}</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>
    `;
  }

  generateTextReport() {
    let report = `Bundle Analysis Report\n`;
    report += `Generated: ${this.results.timestamp}\n\n`;
    
    report += `SUMMARY\n`;
    report += `=======\n`;
    report += `Total Bundle Size: ${this.formatBytes(this.results.summary.totalBundleSize)}\n`;
    report += `Total Asset Size: ${this.formatBytes(this.results.summary.totalAssetSize)}\n`;
    report += `Total Size: ${this.formatBytes(this.results.summary.totalSize)}\n`;
    report += `Bundle Count: ${this.results.summary.bundleCount}\n`;
    report += `Asset Count: ${this.results.summary.assetCount}\n\n`;
    
    if (this.results.warnings.length > 0) {
      report += `WARNINGS\n`;
      report += `========\n`;
      this.results.warnings.forEach(w => {
        report += `${w.type}: ${w.message}\n`;
      });
      report += `\n`;
    }
    
    return report;
  }

  displayResults() {
    console.log('\n' + chalk.green('✅ Análisis completado'));
    console.log(chalk.blue('📊 Resumen:'));
    console.log(`  Bundle total: ${chalk.yellow(this.formatBytes(this.results.summary.totalBundleSize))}`);
    console.log(`  Assets total: ${chalk.yellow(this.formatBytes(this.results.summary.totalAssetSize))}`);
    console.log(`  Tamaño total: ${chalk.yellow(this.formatBytes(this.results.summary.totalSize))}`);
    
    if (this.results.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  ${this.results.warnings.length} advertencias encontradas`));
      this.results.warnings.forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(chalk.red(`\n❌ ${this.results.errors.length} errores encontrados`));
      this.results.errors.forEach(error => {
        console.log(`  - ${error.message}`);
      });
    }
    
    console.log(chalk.blue(`\n📄 Reportes generados en: ${CONFIG.reportDir}/`));
  }

  // Utility methods
  getAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  getDirectorySize(dir) {
    let size = 0;
    try {
      const files = this.getAllFiles(dir);
      files.forEach(file => {
        const stats = fs.statSync(file);
        size += stats.size;
      });
    } catch (error) {
      // Ignorar errores de acceso
    }
    return size;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  estimateGzipSize(size) {
    // Estimación aproximada de compresión gzip (70% del tamaño original)
    return Math.round(size * 0.3);
  }

  getAssetType(ext) {
    const types = {
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.mp4': 'video',
      '.mov': 'video',
      '.avi': 'video',
      '.mp3': 'audio',
      '.wav': 'audio',
      '.m4a': 'audio',
      '.ttf': 'font',
      '.otf': 'font',
      '.woff': 'font',
      '.woff2': 'font'
    };
    return types[ext] || 'other';
  }

  isOptimizable(ext, size) {
    const optimizableTypes = ['.png', '.jpg', '.jpeg', '.gif'];
    return optimizableTypes.includes(ext) && size > 100 * 1024; // > 100KB
  }
}

// Ejecutar análisis
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error(chalk.red('❌ Error fatal:'), error);
    process.exit(1);
  });
}

module.exports = BundleAnalyzer;
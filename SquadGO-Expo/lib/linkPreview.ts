import { LinkPreview } from './types';

// Simulación de metadatos para diferentes dominios
const mockMetadata: Record<string, Partial<LinkPreview>> = {
  'youtube.com': {
    title: 'Video de YouTube',
    description: 'Mira este increíble video en YouTube',
    imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  'youtu.be': {
    title: 'Video de YouTube',
    description: 'Mira este increíble video en YouTube',
    imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  'twitter.com': {
    title: 'Tweet',
    description: 'Mira este tweet interesante',
    imageUrl: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png',
  },
  'x.com': {
    title: 'Post en X',
    description: 'Mira este post interesante en X',
    imageUrl: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png',
  },
  'instagram.com': {
    title: 'Post de Instagram',
    description: 'Mira esta increíble foto en Instagram',
    imageUrl: 'https://static.cdninstagram.com/rsrc.php/v3/yz/r/VCqeEOLKoS2.png',
  },
  'github.com': {
    title: 'Repositorio de GitHub',
    description: 'Explora este repositorio de código',
    imageUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
  },
  'stackoverflow.com': {
    title: 'Pregunta en Stack Overflow',
    description: 'Encuentra la solución a este problema de programación',
    imageUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png',
  },
  'medium.com': {
    title: 'Artículo en Medium',
    description: 'Lee este interesante artículo',
    imageUrl: 'https://miro.medium.com/v2/resize:fit:1200/1*jfdwtvU6V6g99q3G7gq7dQ.png',
  },
  'reddit.com': {
    title: 'Post de Reddit',
    description: 'Mira esta discusión en Reddit',
    imageUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
  },
  'linkedin.com': {
    title: 'Post de LinkedIn',
    description: 'Contenido profesional en LinkedIn',
    imageUrl: 'https://static.licdn.com/aero-v1/sc/h/8s162nmbcnfkg7a0k8nq9wwqo',
  },
};

/**
 * Valida si una URL es válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza una URL agregando protocolo si es necesario
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extrae el dominio de una URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(normalizeUrl(url));
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Genera una vista previa de enlace simulada
 */
export async function generateLinkPreview(url: string): Promise<LinkPreview | null> {
  if (!isValidUrl(normalizeUrl(url))) {
    throw new Error('URL inválida');
  }

  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(normalizedUrl);
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Buscar metadatos simulados por dominio
  const metadata = mockMetadata[domain];
  
  if (metadata) {
    return {
      url: normalizedUrl,
      title: metadata.title || 'Enlace',
      description: metadata.description || 'Haz clic para ver el contenido',
      imageUrl: metadata.imageUrl,
    };
  }
  
  // Generar vista previa genérica
  return {
    url: normalizedUrl,
    title: `Contenido de ${domain}`,
    description: 'Haz clic para visitar este enlace',
    imageUrl: undefined,
  };
}

/**
 * Extrae URLs de un texto
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const matches = text.match(urlRegex) || [];
  
  return matches
    .map(url => normalizeUrl(url))
    .filter(url => isValidUrl(url));
}

/**
 * Detecta automáticamente enlaces en texto y genera vista previa del primero
 */
export async function autoDetectAndPreview(text: string): Promise<LinkPreview | null> {
  const urls = extractUrlsFromText(text);
  
  if (urls.length === 0) {
    return null;
  }
  
  // Generar vista previa del primer enlace encontrado
  try {
    return await generateLinkPreview(urls[0]);
  } catch (error) {
    console.error('Error generando vista previa automática:', error);
    return null;
  }
}

/**
 * Formatea una URL para mostrar de manera amigable
 */
export function formatUrlForDisplay(url: string): string {
  try {
    const urlObj = new URL(normalizeUrl(url));
    let display = urlObj.hostname.replace('www.', '');
    
    if (urlObj.pathname !== '/') {
      display += urlObj.pathname;
    }
    
    // Limitar longitud
    if (display.length > 50) {
      display = display.substring(0, 47) + '...';
    }
    
    return display;
  } catch {
    return url;
  }
}

/**
 * Verifica si una URL es de un dominio de redes sociales
 */
export function isSocialMediaUrl(url: string): boolean {
  const domain = extractDomain(url);
  const socialDomains = [
    'twitter.com', 'x.com', 'instagram.com', 'facebook.com',
    'linkedin.com', 'tiktok.com', 'snapchat.com', 'pinterest.com'
  ];
  
  return socialDomains.includes(domain);
}

/**
 * Verifica si una URL es de un sitio de video
 */
export function isVideoUrl(url: string): boolean {
  const domain = extractDomain(url);
  const videoDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv'];
  
  return videoDomains.includes(domain);
}

/**
 * Obtiene el icono apropiado para un tipo de enlace
 */
export function getLinkIcon(url: string): string {
  const domain = extractDomain(url);
  
  const iconMap: Record<string, string> = {
    'youtube.com': 'logo-youtube',
    'youtu.be': 'logo-youtube',
    'twitter.com': 'logo-twitter',
    'x.com': 'logo-twitter',
    'instagram.com': 'logo-instagram',
    'github.com': 'logo-github',
    'linkedin.com': 'logo-linkedin',
    'reddit.com': 'logo-reddit',
  };
  
  return iconMap[domain] || 'link';
}
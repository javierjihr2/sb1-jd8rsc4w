
"use client"

import { useContext, useEffect } from 'react';
import { ShepherdTour, ShepherdTourContext } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';
import { useRouter } from 'next/navigation';

const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'shepherd-custom',
    scrollTo: { behavior: 'smooth' as ScrollBehavior, block: 'center' as ScrollLogicalPosition }
  },
  useModalOverlay: true
};

const steps = [
  {
    id: 'intro',
    text: `
      <div class="shepherd-header">
        <h3 class="shepherd-title">¡Bienvenido a SquadGO!</h3>
      </div>
      <div class="shepherd-content">
        <p>¡Qué emoción tenerte a bordo! Descubre cómo convertirte en un <strong>Creador de Contenido</strong> y monetizar tu pasión por PUBG Mobile. Este tour te mostrará todas las herramientas para crear torneos, ofrecer servicios y construir tu comunidad.</p>
      </div>
    `,
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Saltar',
        type: 'cancel'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Comenzar Tour',
        type: 'next'
      }
    ]
  },
  {
    id: 'nav-dashboard',
    attachTo: {
      element: '#nav-dashboard',
      on: 'right' as const
    },
    title: 'Tu Centro de Mando',
    text: 'Este es el Inicio, tu base de operaciones. Aquí verás las últimas noticias, la actividad de tus amigos y los próximos torneos de un vistazo.',
    buttons: [
       {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'nav-tournaments',
    attachTo: {
      element: '#nav-tournaments',
      on: 'right' as const
    },
    title: 'Crea y Gestiona Torneos',
    text: '¡El corazón de tu negocio como creador! Aquí puedes <strong>crear torneos ilimitados</strong>, gestionar inscripciones, configurar premios y construir tu comunidad. Como creador, tendrás herramientas avanzadas para personalizar cada detalle.',
    buttons: [
       {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
    {
    id: 'nav-matchmaking',
    attachTo: {
      element: '#nav-matchmaking',
      on: 'right' as const
    },
    title: 'Encuentra a tu Dúo Ideal',
    text: '¿Cansado de jugar solo? Usa el "MATCH PUBGM" para descubrir nuevos jugadores, analizar su compatibilidad contigo y romper el hielo con la ayuda de la IA.',
     buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
    {
    id: 'nav-equipment',
    attachTo: {
      element: '#nav-equipment',
      on: 'right' as const
    },
    title: 'Servicios Premium para Creadores',
    text: 'Como creador, puedes <strong>ofrecer servicios de coaching</strong>, análisis de sensibilidades personalizadas y configuraciones optimizadas. Monetiza tu experiencia ayudando a otros jugadores a mejorar su rendimiento.',
     buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'creator-chat',
    title: 'Sistema de Chat para Creadores',
    text: `
      <div class="shepherd-content">
        <p><strong>Conecta con tu audiencia:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>• Chat en tiempo real durante torneos</li>
          <li>• Comunicación directa con participantes</li>
          <li>• Moderación avanzada de mensajes</li>
          <li>• Notificaciones de mensajes importantes</li>
        </ul>
        <p>Construye relaciones sólidas con tu comunidad.</p>
      </div>
    `,
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'creator-lists',
    title: 'Gestión de Listas y Equipos',
    text: `
      <div class="shepherd-content">
        <p><strong>Organiza tu comunidad:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>• Crea listas de jugadores favoritos</li>
          <li>• Gestiona equipos para torneos</li>
          <li>• Sistema de ranking personalizado</li>
          <li>• Invitaciones automáticas a eventos</li>
        </ul>
        <p>Mantén a tu audiencia organizada y comprometida.</p>
      </div>
    `,
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'creator-monetization',
    title: 'Monetización y Crecimiento',
    text: `
      <div class="shepherd-content">
        <p><strong>Convierte tu pasión en ingresos:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>• <strong>Plan Creador Básico ($9.99/mes):</strong> Torneos ilimitados, servicios básicos</li>
          <li>• <strong>Plan Creador Pro ($19.99/mes):</strong> Analytics avanzados, streaming integrado</li>
          <li>• Comisiones reducidas en servicios premium</li>
          <li>• Promoción en la plataforma</li>
        </ul>
        <p>¡Empieza hoy y construye tu imperio gaming!</p>
      </div>
    `,
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
  {
    id: 'user-nav',
    attachTo: {
      element: '.user-nav-trigger',
      on: 'bottom' as const
    },
    title: 'Tu Perfil de Creador',
    text: 'Gestiona tu perfil de creador, revisa tus estadísticas, configura tus servicios y accede a herramientas avanzadas. ¡Todo lo que necesitas para hacer crecer tu negocio!',
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: '¡Comenzar como Creador!',
        type: 'complete'
      }
    ]
  },
];


// We need a separate component to access the tour context
function TourInstance() {
    const router = useRouter();
    const tour = useContext(ShepherdTourContext);

    useEffect(() => {
        const tourCompleted = localStorage.getItem('squadgo_tour_completed');

        // Delay to ensure the DOM is ready and hydrated
        const timer = setTimeout(() => {
            if (tour && !tourCompleted) {
                tour.start();
                tour.on('complete', () => {
                    localStorage.setItem('squadgo_tour_completed', 'true');
                });
                tour.on('cancel', () => {
                     localStorage.setItem('squadgo_tour_completed', 'true');
                })
            }
        }, 1500); 

        return () => clearTimeout(timer);

    }, [tour]);
    
    return null;
}

const CustomTourStyles = () => (
    <style jsx global>{`
        .shepherd-custom {
            --shepherd-text-color: hsl(var(--card-foreground));
            --shepherd-header-background: hsl(var(--card));
            --shepherd-background: hsl(var(--card));
            --shepherd-footer-background: hsl(var(--card));
            --shepherd-arrow-background: hsl(var(--card));
            border-radius: var(--radius);
            border: 1px solid hsl(var(--border));
        }
        .shepherd-title {
            color: hsl(var(--primary));
            font-weight: 700;
        }
        .shepherd-button {
            border-radius: var(--radius);
            transition: all 0.2s ease-in-out;
        }
        .shepherd-button-primary {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        .shepherd-button-primary:hover {
            background-color: hsl(var(--primary) / 0.9);
        }
        .shepherd-button-secondary {
            background-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
        }
         .shepherd-button-secondary:hover {
            background-color: hsl(var(--secondary) / 0.8);
        }
        .shepherd-cancel-icon {
            color: hsl(var(--muted-foreground));
        }
        .shepherd-cancel-icon:hover {
            color: hsl(var(--foreground));
        }
    `}</style>
)


export function AppTour() {
    return (
        <>
            <CustomTourStyles />
            <ShepherdTour steps={steps} tourOptions={tourOptions}>
                <TourInstance />
            </ShepherdTour>
        </>
    )
}

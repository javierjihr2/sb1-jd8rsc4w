
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
    scrollTo: { behavior: 'smooth', block: 'center' }
  },
  useModalOverlay: true
};

const steps = [
  {
    id: 'intro',
    text: `
      <div class="shepherd-header">
        <h3 class="shepherd-title">¡Bienvenido a SquadUp!</h3>
      </div>
      <div class="shepherd-content">
        <p>¡Qué emoción tenerte a bordo! Prepárate para llevar tu juego al siguiente nivel. Este rápido tour te mostrará las herramientas clave para dominar el campo de batalla.</p>
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
      on: 'right'
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
      on: 'right'
    },
    title: 'Compite por la Gloria',
    text: '¡Aquí está la acción! Explora, inscríbete y compite en torneos. ¡La gloria y los premios te esperan!',
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
      on: 'right'
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
      on: 'right'
    },
    title: 'El Taller de Precisión',
    text: 'La victoria se forja aquí. Obtén configuraciones de sensibilidad y controles generadas por IA y optimizadas para tu dispositivo y estilo de juego.',
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
      on: 'bottom'
    },
    title: 'Tu Perfil y Ajustes',
    text: 'Desde aquí puedes acceder a tu perfil público, configurar los ajustes de la aplicación, cambiar el tema y cerrar sesión.',
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Finalizar',
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
        const tourCompleted = localStorage.getItem('squadup_tour_completed');

        // Delay to ensure the DOM is ready and hydrated
        const timer = setTimeout(() => {
            if (tour && !tourCompleted) {
                tour.start();
                tour.on('complete', () => {
                    localStorage.setItem('squadup_tour_completed', 'true');
                });
                tour.on('cancel', () => {
                     localStorage.setItem('squadup_tour_completed', 'true');
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


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
    classes: 'shadow-md bg-background border border-border rounded-lg',
    scrollTo: { behavior: 'smooth', block: 'center' }
  },
  useModalOverlay: true
};

const steps = [
  {
    id: 'intro',
    text: '¡Bienvenido a SquadUp! Te daremos un rápido recorrido por las funciones principales de la aplicación.',
    buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Saltar',
        type: 'cancel'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Comenzar',
        type: 'next'
      }
    ]
  },
  {
    id: 'logo',
    attachTo: {
      element: '#app-logo',
      on: 'bottom'
    },
    text: 'Este es el logo de SquadUp. Siempre puedes hacer clic aquí para volver a la página de inicio.',
    buttons: [
      {
        classes: 'shepherd-button-primary',
        text: 'Siguiente',
        type: 'next'
      }
    ]
  },
   {
    id: 'search',
    attachTo: {
      element: '#search-bar',
      on: 'bottom'
    },
    text: 'Usa la barra de búsqueda para encontrar jugadores, equipos o torneos rápidamente.',
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
    text: 'Aquí encontrarás todos los torneos disponibles. ¡Inscríbete y compite por la gloria!',
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
    id: 'nav-admin',
    attachTo: {
      element: '#nav-admin',
      on: 'right'
    },
    text: 'Si eres administrador o creador, desde aquí podrás gestionar torneos, usuarios y configurar la aplicación.',
     buttons: [
      {
        classes: 'shepherd-button-secondary',
        text: 'Atrás',
        type: 'back'
      },
      {
        classes: 'shepherd-button-primary',
        text: 'Finalizar',
        type: 'next'
      }
    ]
  },
];

function TourInstance() {
    const router = useRouter();
    const tour = useContext(ShepherdTourContext);

    useEffect(() => {
        const tourCompleted = localStorage.getItem('squadup_tour_completed');

        // Delay to ensure the DOM is ready
        setTimeout(() => {
            if (tour && !tourCompleted) {
                tour.start();
                tour.on('complete', () => {
                    localStorage.setItem('squadup_tour_completed', 'true');
                });
                tour.on('cancel', () => {
                     localStorage.setItem('squadup_tour_completed', 'true');
                })
            }
        }, 1000);

    }, [tour]);
    
    return null;
}


export function AppTour() {
    return (
        <ShepherdTour steps={steps} tourOptions={tourOptions}>
            <TourInstance />
        </ShepherdTour>
    )
}

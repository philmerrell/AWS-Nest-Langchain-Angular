import { trigger, state, style, animate, transition, animation } from '@angular/animations';

export const slide = trigger('slide', [
  // Initial state
  state('void', style({
    transform: 'translateX(-10%)'
  })),
  
  // End state
  state('*', style({
    transform: 'translateX(0)'
  })),
  
  // Enter animation
  transition(':enter', [
    animate('300ms ease-out')
  ]),
  
  // Leave animation
//   transition(':leave', [
//     animate('300ms ease-in', style({
//       transform: 'translateX(10%)'
//     }))
//   ])
]);
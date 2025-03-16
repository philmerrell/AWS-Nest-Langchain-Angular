import { trigger, state, style, transition, animate } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
    state('collapsed', style({
      height: '50px',
      overflow: 'hidden'
    }), { params: { collapsedHeight: 0 } }),
    state('expanded', style({
      height: '*'
    })),
    transition('collapsed <=> expanded', [
      animate('300ms ease-out')
    ])
  ])
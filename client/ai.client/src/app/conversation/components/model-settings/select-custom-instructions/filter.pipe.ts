import { Pipe, PipeTransform } from '@angular/core';
import { CustomInstruction } from 'src/app/conversation/services/conversation.model';

@Pipe({
  name: 'filterInstructions',
  standalone: true
})
export class FilterInstructionsPipe implements PipeTransform {

  transform(prompts: CustomInstruction[], type: string): CustomInstruction[] {
    const filteredPrompts = prompts.filter(p => p.id === type);
    return filteredPrompts;
  }

}

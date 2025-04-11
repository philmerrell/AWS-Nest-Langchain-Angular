import { Component, Input, OnInit } from '@angular/core';
import { 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
  IonIcon, IonBadge 
} from '@ionic/angular/standalone';
import { 
  ContentBlock, ToolResultContentBlock, ToolUseContentBlock 
} from 'src/app/conversation/services/conversation.model';
import { addIcons } from 'ionicons';
import { 
  buildOutline, checkmarkCircleOutline, closeCircleOutline, 
  codeOutline, chevronUpOutline, chevronDownOutline, 
  terminalOutline, informationCircleOutline, documentOutline
} from 'ionicons/icons';
import { MarkdownComponent } from 'ngx-markdown';
import { JsonPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-tool-execution',
  templateUrl: './tool-execution.component.html',
  styleUrls: ['./tool-execution.component.scss'],
  standalone: true,
  imports: [
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonIcon, IonBadge,
    MarkdownComponent, JsonPipe, NgClass
  ]
})
export class ToolExecutionComponent implements OnInit {
  @Input() toolUse!: ToolUseContentBlock;
  @Input() toolResult?: ToolResultContentBlock;
  @Input() messageBlocks?: ContentBlock[];
  
  // Single expanded state for the entire component
  expanded: boolean = true;
  
  constructor() {
    addIcons({ 
      buildOutline, checkmarkCircleOutline, closeCircleOutline, 
      codeOutline, chevronUpOutline, chevronDownOutline,
      terminalOutline, informationCircleOutline, documentOutline
    });
  }

  ngOnInit() {
    // If no direct toolResult is provided, try to find it in messageBlocks
    if (!this.toolResult && this.messageBlocks) {
      this.toolResult = this.findToolResultForToolUse(
        this.messageBlocks, 
        this.toolUse.toolUse.toolUseId
      );
    }
  }
  
  // Toggle expanded/collapsed state for the entire component
  toggleExpand() {
    this.expanded = !this.expanded;
  }
  
  // Find tool result for a specific tool use ID
  findToolResultForToolUse(contentBlocks: ContentBlock[], toolUseId: string): ToolResultContentBlock | undefined {
    if (!Array.isArray(contentBlocks)) {
      return undefined;
    }
    
    return contentBlocks.find(
      block => 'toolResult' in block && 
      (block as ToolResultContentBlock).toolResult.toolUseId === toolUseId
    ) as ToolResultContentBlock | undefined;
  }
  
  // Get tool result text content
  getToolResultText(): string {
    if (!this.toolResult || !this.toolResult.toolResult.content || !Array.isArray(this.toolResult.toolResult.content)) {
      return '';
    }
    
    return this.toolResult.toolResult.content
      .filter(item => 'text' in item)
      .map(item => (item as any).text)
      .join('\n');
  }
  
  // Check if the tool result contains JSON content
  hasJsonContent(): boolean {
    if (!this.toolResult || !this.toolResult.toolResult.content || !Array.isArray(this.toolResult.toolResult.content)) {
      return false;
    }
    
    return this.toolResult.toolResult.content.some(item => 'json' in item);
  }
  
  // Get JSON content if available
  getJsonContent(): any {
    if (!this.toolResult || !this.toolResult.toolResult.content || !Array.isArray(this.toolResult.toolResult.content)) {
      return null;
    }
    
    const jsonContent = this.toolResult.toolResult.content.find(item => 'json' in item);
    return jsonContent ? (jsonContent as any).json : null;
  }
  
  // Determine if content is code (for syntax highlighting)
  isCodeContent(): boolean {
    const text = this.getToolResultText();
    return text.includes('```') || 
           text.startsWith('{') || 
           text.startsWith('[') ||
           text.includes('function') ||
           text.includes('const ') ||
           text.includes('let ');
  }
  
  // Get the tool's status (success, error, or pending)
  getToolStatus(): 'success' | 'error' | 'pending' {
    if (!this.toolResult) {
      return 'pending';
    }
    return this.toolResult.toolResult.status as 'success' | 'error';
  }
}
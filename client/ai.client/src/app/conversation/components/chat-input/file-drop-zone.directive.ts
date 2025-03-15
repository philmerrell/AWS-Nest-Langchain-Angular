import { Directive, HostBinding, HostListener, output } from '@angular/core';

@Directive({
  selector: '[appFileDropZone]',
  standalone: true
})
export class FileDropZoneDirective {

  constructor() { }

  @HostBinding('class.fileover') fileOver: boolean = false;
  fileDropped = output<any>();

  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    evt.dataTransfer.dropEffect = 'copy';
    this.fileOver = true;
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  // Drop listener
  @HostListener('drop', ['$event']) public ondrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    let files = evt.dataTransfer.files;
    let valid_files : Array<File> = files;
    this.fileDropped.emit(valid_files);
  }

}

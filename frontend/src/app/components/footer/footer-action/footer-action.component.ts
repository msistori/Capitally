import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-footer-action',
  templateUrl: './footer-action.component.html',
  styleUrls: ['./footer-action.component.scss']
})
export class FooterActionComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() disabled = false;
  @Output() action = new EventEmitter<void>();

  onClick(): void {
    this.action.emit();
  }
}

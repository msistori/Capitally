import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from './../loader.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="loading-overlay" role="status" aria-live="polite">
        <div class="loader-card">
          <img src="assets/logo.svg" alt="Loading" class="logo-spinner" />
        </div>
      </div>
    }
  `,
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent {
  private loader = inject(LoaderService);
  visible = computed(() => this.loader.isLoading());

  constructor() {
    effect(() => {
      document.body.classList.toggle('body-lock', this.visible());
    });
  }
}
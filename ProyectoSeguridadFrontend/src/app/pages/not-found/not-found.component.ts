import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <h1>404</h1>
      <p>Página no encontrada</p>
      <a routerLink="/messenger">Volver a Messenger</a>
    </main>
  `,
  styles: `
    .not-found {
      min-height: 100vh;
      display: grid;
      place-items: center;
      text-align: center;
      background: #f0f2f5;
      color: #111827;
    }

    h1 {
      font-size: 96px;
      margin: 0;
      letter-spacing: -0.08em;
    }

    p {
      color: #6b7280;
    }

    a {
      color: #0084ff;
      font-weight: 800;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}

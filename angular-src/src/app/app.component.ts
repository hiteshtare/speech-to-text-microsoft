import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Moderator Screen';

  constructor() {

  }

  navigateToAssitantView() {
    window.location.href = 'http://127.0.0.1:6060/';
  }
}

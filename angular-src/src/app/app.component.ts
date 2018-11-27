import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NoteApiService } from './shared/services/note-api.service';
import { CustomToastService } from './shared/services/custom-toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Moderator Screen';

  constructor(private noteApiService: NoteApiService, private customToastService: CustomToastService) {
    this.noteApiService.notesApiUrl = environment.apiUrl;
  }

  navigateToAssitantView() {
    window.location.href = 'http://127.0.0.1:6060/';
  }

  trainLUIS() {
    this.noteApiService.showLoader = true;
    this.noteApiService.trainLUISForEntities().subscribe((data) => {
      if (data['success'] === true) {
        this.noteApiService.showLoader = false;
        this.customToastService.toastMessage('success', 'LUIS Feeback', data['message']);
      }
    });
  }
}

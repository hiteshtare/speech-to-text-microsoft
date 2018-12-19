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

  constructor(public noteApiService: NoteApiService, private customToastService: CustomToastService) {
    this.noteApiService.notesApiUrl = environment.apiUrl;
  }
}

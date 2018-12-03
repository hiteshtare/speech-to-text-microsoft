import { Note } from './../../shared/models/note.model';
import { NoteApiService } from './../../shared/services/note-api.service';
import { Component, OnInit } from '@angular/core';
import { CustomToastService } from 'src/app/shared/services/custom-toast.service';
import { environment } from 'src/environments/environment';
import { MenuItem } from 'primeng/components/common/menuitem';

@Component({
  selector: 'app-list-note',
  templateUrl: './list-note.component.html',
  styleUrls: ['./list-note.component.css']
})
export class ListNoteComponent implements OnInit {

  notes: Note[];
  tempnote: Note;
  display = false;
  form;

  constructor(private noteApiService: NoteApiService, private customToastService: CustomToastService) {
  }


  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.noteApiService.getNotes().subscribe((data) => {
      this.notes = data['payload'];
    });
  }

  showDialog(note: Note) {
    this.tempnote = note;
    this.display = true;
  }

  saveNote() {


    this.tempnote['entities']['products'].forEach((product) => {
      if (product.is_approve === true) {
        product.status = 'pending for luis training';
      }
    });
    this.tempnote['entities']['keymessages'].forEach((product) => {
      if (product.is_approve === true) {
        product.status = 'pending for luis training';
      }
    });
    this.tempnote['entities']['followups'].forEach((product) => {
      if (product.is_approve === true) {
        product.status = 'pending for luis training';
      }
    });

    this.noteApiService.saveNote(this.tempnote).subscribe((data) => {
      if (data['success'] === true) {
        this.display = false;
        this.customToastService.toastMessage('success', 'Note Update', data['message']);
        this.loadNotes();
      }
    });
  }

  navigateToAssitantView() {
    window.location.href = `${environment.apiUrl}/client`;
  }

  trainLUIS() {
    this.noteApiService.showLoader = true;
    this.noteApiService.loadingMessage = 'LUIS Training';
    this.noteApiService.trainLUISForEntities().subscribe((data) => {
      if (data['success'] === true) {
        this.noteApiService.showLoader = false;
        this.customToastService.toastMessage('success', 'LUIS Feeback', data['message']);
        this.loadNotes();
      }
    });
  }

  publishLUIS() {
    this.noteApiService.showLoader = true;
    this.noteApiService.loadingMessage = 'Publising Changes';
    this.noteApiService.publishChangesOnLUIS().subscribe((data) => {
      if (data['success'] === true) {
        this.noteApiService.showLoader = false;
        this.customToastService.toastMessage('success', 'Published Changes', data['message']);
        this.loadNotes();
      }
    });
  }
}

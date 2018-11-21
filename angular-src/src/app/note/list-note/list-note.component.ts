import { Note } from './../../shared/models/note.model';
import { NoteApiService } from './../../shared/services/note-api.service';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-list-note',
  templateUrl: './list-note.component.html',
  styleUrls: ['./list-note.component.css']
})
export class ListNoteComponent implements OnInit {

  notes: Note[];
  displayedColumns = ['_id'];

  constructor(private noteApiService: NoteApiService) { }

  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.noteApiService.getNotes().subscribe((data) => {
      this.notes = data['payload'];
    });
  }

}

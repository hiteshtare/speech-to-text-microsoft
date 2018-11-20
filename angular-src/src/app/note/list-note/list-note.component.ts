import { Note } from './../../shared/models/note.model';
import { NoteApiService } from './../../shared/services/note-api.service';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material';


@Component({
  selector: 'app-list-note',
  templateUrl: './list-note.component.html',
  styleUrls: ['./list-note.component.css']
})
export class ListNoteComponent implements OnInit {

  notes;
  displayedColumns = ['_id'];

  constructor(private noteApiService: NoteApiService) { }

  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.noteApiService.getNotes().subscribe((data) => {
      this.notes = new MatTableDataSource(data['payload']);
    });
  }

}

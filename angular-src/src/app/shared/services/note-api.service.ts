import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';


import { Note } from '../models/note.model';

@Injectable()
export class NoteApiService {

  headers: HttpHeaders;

  // For Developement
  public notesApiUrl = 'http://localhost:5000';
  // For Developement

  // For Production
  // private notesApiUrl = '';
  // For Production

  constructor(private http: HttpClient) {
  }

  getNotes(): Observable<Response> {
    return this.http.get(`${this.notesApiUrl}/notes`).pipe(map((data: Response) => {
      return data;
    }));
  }

  saveNote(note: Note): Observable<Response> {
    return this.http.put(`${this.notesApiUrl}/notes/${note._id}`, note).pipe(map((data: Response) => {
      return data;
    }));
  }

  trainLUISForEntities(): Observable<Response> {
    return this.http.get(`${this.notesApiUrl}/training`).pipe(map((data: Response) => {
      return data;
    }));
  }
}

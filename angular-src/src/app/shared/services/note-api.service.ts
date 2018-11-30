import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';


import { Note } from '../models/note.model';

@Injectable()
export class NoteApiService {

  headers: HttpHeaders;
  showLoader = false;
  loadingMessage = '';

  // For Developement
  public notesApiUrl = '';
  // For Production
  // private notesApiUrl = '';

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

  publishChangesOnLUIS(): Observable<Response> {
    return this.http.get(`${this.notesApiUrl}/publish`).pipe(map((data: Response) => {
      return data;
    }));
  }
}

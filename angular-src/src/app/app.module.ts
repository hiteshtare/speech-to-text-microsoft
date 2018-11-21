import { NoteApiService } from './shared/services/note-api.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ListNoteComponent } from './note/list-note/list-note.component';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
// PrimeNG Modules

@NgModule({
  declarations: [
    AppComponent,
    ListNoteComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TableModule,
    ButtonModule
  ],
  providers: [NoteApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }

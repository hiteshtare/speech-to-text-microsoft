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
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputSwitchModule,
    PanelModule
  ],
  providers: [NoteApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }

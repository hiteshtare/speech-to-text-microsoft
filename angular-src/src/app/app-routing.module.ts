import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListNoteComponent } from './note/list-note/list-note.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' }, // default
  { path: 'list', component: ListNoteComponent }
  // { path: 'add', component: AddTodoComponent },
  // { path: 'edit/:id', component: EditTodoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

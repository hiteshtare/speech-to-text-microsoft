import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class CustomToastService {

  constructor(public snackBar: MatSnackBar) {
  }

  toastMessage(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }
}

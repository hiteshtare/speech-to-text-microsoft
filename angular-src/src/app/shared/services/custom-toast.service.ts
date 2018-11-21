import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';

@Injectable()
export class CustomToastService {

  constructor(private messageService: MessageService) {
  }

  toastMessage(p_severity: string, p_summary: string, p_detail: string) {
    this.messageService.add({
      life: 2000, severity: p_severity, summary: p_summary, detail: p_detail
    });
  }
}

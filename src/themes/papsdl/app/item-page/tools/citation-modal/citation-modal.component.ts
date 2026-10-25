/**
 * AU-IBAR (25 Oct 2026): "Cite this item" dialog. Ported from the OtCloud KNBS theme (modal-content component).
 */
import { NgClass } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-auibar-citation-modal',
  imports: [NgClass, FormsModule, TranslateModule],
  templateUrl: './citation-modal.component.html',
  styleUrl: './citation-modal.component.scss',
})
export class CitationModalComponent implements OnInit {
  @Input() title!: string;
  @Input() apaCitation!: string;
  @Input() chicagoCitation!: string;
  @Input() mlaCitation!: string;
  @Input() vancouverCitation!: string;
  @Input() harvardCitation!: string;
  @Input() isoCitation!: string;

  selectedCitation = 'APA';
  currentCitation!: string;
  copied = false;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
    this.updateCitation();
  }

  updateCitation(): void {
    switch (this.selectedCitation) {
      case 'MLA':
        this.currentCitation = this.mlaCitation;
        break;
      case 'Chicago':
        this.currentCitation = this.chicagoCitation;
        break;
      case 'Vancouver':
        // the Vancouver style is rendered as text with a leading "1. " entry number
        this.currentCitation = (this.vancouverCitation || '').replace(/^\s*1\.\s*/, '');
        break;
      case 'Harvard':
        this.currentCitation = this.harvardCitation;
        break;
      case 'iso690-2':
        this.currentCitation = this.isoCitation;
        break;
      case 'APA':
      default:
        this.currentCitation = this.apaCitation;
        break;
    }
  }

  copyToClipboard(): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.currentCitation;
    const plainText = (tempDiv.textContent || tempDiv.innerText || '').trim();
    navigator.clipboard?.writeText(plainText).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}

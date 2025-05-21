import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LogicLabService } from './services/logic-lab.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('rendererContainer') rendererContainer: ElementRef;

  constructor(private logicLabService: LogicLabService) {}

  ngOnInit() {
    // Initialize the service after view is ready
    setTimeout(() => {
      this.logicLabService.initialize(this.rendererContainer.nativeElement);
    });
  }

  ngOnDestroy() {
    this.logicLabService.dispose();
  }
}
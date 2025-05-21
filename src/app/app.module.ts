import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ThreeLearningComponent } from './components/three-learning/three-learning.component';

@NgModule({
  declarations: [
    AppComponent,
    ThreeLearningComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
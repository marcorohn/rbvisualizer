import { Component, OnInit } from '@angular/core';
import { Runtime } from '../../model/context2/runtime';
import { WHILE } from '../../model/instructions/while';
import { LET } from '../../model/instructions/let';
import { RUN } from '../../model/instructions/run';
import { queue } from 'rxjs';
import { FORI } from '../../model/instructions/fori';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private iterationCount = 0;
  constructor() {}

  ngOnInit(): void {}
}

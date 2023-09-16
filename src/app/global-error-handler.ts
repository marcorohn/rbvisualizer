import { ErrorHandler, Injectable, NgZone } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone) {}

  handleError(error: any) {
    if (error.stack?.startsWith("TypeError: Cannot read properties of null (reading 'RegExp')")) {
      return;
    }
    console.error(error);
  }
}

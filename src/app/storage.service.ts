import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { deepEquals } from '../util/math/deep-equals';

/**
 * Represents a service to interact with the browser's
 * localStorage.
 */
@Injectable()
export class StorageService {
  private readonly currentUserKey = 'currentUser';
  private readonly sessionId = 'session';

  private static hasItem(key: string): boolean {
    return !!localStorage.getItem(key);
  }

  private static getItem<T>(key: string): T {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }

    return null;
  }

  private static setItem<T>(key: string, value: T): void {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Checks if a user is stored in the browser's localStorage.
   *
   * @return True if a user object exists, false otherwise.
   */
  public hasCurrentUser(): boolean {
    return StorageService.hasItem(this.currentUserKey);
  }

  public getSessionId(): string {
    return StorageService.getItem(this.sessionId);
  }

  public setSessionId(sessionId: string): void {
    StorageService.setItem(this.sessionId, sessionId);
  }
}

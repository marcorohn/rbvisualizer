import { Observable, Subject } from 'rxjs';

export function chooseFirst<T>(o1: Observable<T>, o2: Observable<T>): Observable<T> {
  const ret = new Subject<T>();

  let chose1 = false,
    chose2 = false;

  const sub1 = o1.subscribe((val) => {
    if (chose2) {
      sub1.unsubscribe();
    } else {
      chose1 = true;
      ret.next(val);
    }
  });

  const sub2 = o2.subscribe((val) => {
    if (chose1) {
      sub2.unsubscribe();
    } else {
      chose2 = true;
      ret.next(val);
    }
  });

  return ret;
}

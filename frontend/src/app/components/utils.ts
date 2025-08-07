import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Utils {

  getIcon(name: string) {
    const base = './../../../../assets/icons/';
    return base + name.toLowerCase() + '.svg';
  }

}
import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {

  override format(date: Date, displayFormat: Object): string {
    const day = this._to2Digits(date.getDate());
    const month = this._to2Digits(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private _to2Digits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return super.parse(value);
  }
}
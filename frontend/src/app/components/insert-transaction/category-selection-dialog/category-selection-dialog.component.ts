import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Utils } from '../../utils';

@Component({
  selector: 'app-category-selection-dialog',
  templateUrl: './category-selection-dialog.component.html',
  styleUrls: ['./category-selection-dialog.component.scss']
})
export class CategorySelectionDialogComponent implements OnInit {
  plus: any;
  categories: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<CategorySelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { selectedCategory: string },
    private utils: Utils
  ) { }

  ngOnInit(): void {
    /*const base = './../../../../assets';
    this.categories = [
      { name: 'Shopping', icon: this.getIcon(this.name) },
      { name: 'Food', icon: base + '/icons/food.svg' },
      { name: 'Transport', icon: base + '/icons/transport.svg' },
      { name: 'Subscr', icon: base + '/icons/subscribe.svg' },
      { name: 'Salary', icon: base + '/icons/salary.svg' },
      { name: 'Transfer', icon: base + '/icons/transfer.svg' },
      { name: 'Rent', icon: base + '/icons/rent.svg' },
      { name: 'Health', icon: base + '/icons/' + + '.svg' },
    ];*/

    this.plus = { name: 'Add Other', icon: this.utils.getIcon('plus') };
    this.categories = this.getIconNames().map(name => ({
      name,
      icon: this.utils.getIcon(name)
    }));
  }

  selectCategory(name: string): void {
    this.dialogRef.close(name);
  }

  addNewCategory(): void {
    const newCat = prompt('Nome nuova categoria:');
    if (newCat) {
      this.dialogRef.close(newCat);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getIconNames(): string[] {
    return [
      'Shopping',
      'Smartphone',
      'Spanner',
      'Stadium',
      'Subscribe',
      'Taxi',
      'Ticket',
      'Tooth',
      'Transfer',
      'Washing-machine',
      'Watch',
      'Wifi',
      'Animal',
      'Bank',
      'Barbell',
      'Barber',
      'Bike',
      'Bill',
      'Book',
      'Camera',
      'Car',
      'Card-holder',
      'Car-insurance',
      'Car-wash',
      'Charger',
      'Cigar',
      'Clothes',
      'Cocktail',
      'Coffee',
      'Coin',
      'Diamond',
      'Dices',
      'Flower',
      'Food',
      'Football',
      'Fuel',
      'Games',
      'Gift',
      'Health',
      'Metro',
      'Mic',
      'Money-bag',
      'Motorbike',
      'Parking',
      'Pc',
      'Plane',
      'Plus',
      'Police',
      'Popcorn',
      'Receipt',
      'Salary',
      'Ship',
      'Shoes'
    ];

  }
}
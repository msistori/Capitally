import { Component, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { CategoryModel } from 'src/app/models/category.model';
import { CategoryService } from 'src/app/services/category.service';
import { Utils } from '../../utils';
import { DuplicateCategoryAlertComponent } from 'src/app/alerts/duplicate-category-alert/duplicate-category-alert.component';
import { RefreshService } from 'src/app/services/refresh.service';

type DialogData = {
  categories: CategoryModel[];
  selectedCategoryId?: number | null;
  userId: number;
};

@Component({
  selector: 'app-category-selection-dialog',
  templateUrl: './category-selection-dialog.component.html',
  styleUrls: ['./category-selection-dialog.component.scss']
})
export class CategorySelectionDialogComponent implements OnInit {
  @ViewChild('deleteDialogTemplate') deleteDialogTemplate!: TemplateRef<any>;

  categories: CategoryModel[] = [];
  selectedCategoryId?: number | null;
  userId!: number;
  categoryToDelete?: CategoryModel | null;
  showDeleteDialog: boolean = false;

  grouped: Record<string, CategoryModel[]> = {};
  macros: string[] = [];
  search = '';

  creating = false;
  editing = false;
  deleting = false;
  mode: 'create' | 'edit' | 'delete' = 'create';
  editingCategoryId: number | undefined;

  createForm!: FormGroup;
  editTargetCtrl = new FormControl<number | null>(null);

  filteredMacros: string[] = [];
  iconNames: string[] = [];
  pickedIcon?: string;

  constructor(
    public dialogRef: MatDialogRef<CategorySelectionDialogComponent, CategoryModel | null>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    public utils: Utils,
    private refreshService: RefreshService
  ) { }

  ngOnInit(): void {
    this.categories = [...(this.data?.categories ?? [])];
    this.selectedCategoryId = this.data?.selectedCategoryId ?? null;
    this.userId = this.data?.userId;

    this.buildGroups();

    this.createForm = this.fb.group({
      macroCategory: ['', [Validators.required, Validators.maxLength(40)]],
      category: ['', [Validators.required, Validators.maxLength(40)]],
      iconName: ['']
    });

    this.iconNames = this.getIconNames();

    const allMacros = Array.from(new Set(this.categories.map(c => c.macroCategory)))
      .filter(Boolean)
      .sort();

    this.createForm.get('macroCategory')!.valueChanges.pipe(
      startWith(this.createForm.get('macroCategory')!.value || ''),
      map(v => (v || '').toString().toLowerCase()),
      map(v => allMacros.filter(m => m.toLowerCase().includes(v)))
    ).subscribe(list => this.filteredMacros = list);
  }

  private buildGroups(): void {
    const byMacro: Record<string, CategoryModel[]> = {};
    for (const c of this.categories) {
      const k = c.macroCategory || 'Other';
      if (!byMacro[k]) byMacro[k] = [];
      byMacro[k].push(c);
    }
    Object.keys(byMacro).forEach(k => byMacro[k].sort((a, b) => a.category.localeCompare(b.category)));
    this.grouped = byMacro;
    this.macros = Object.keys(byMacro).sort((a, b) => a.localeCompare(b));
  }

  filter(items: CategoryModel[]): CategoryModel[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(c =>
      c.category.toLowerCase().includes(q) ||
      (c.macroCategory || '').toLowerCase().includes(q)
    );
  }

  getFilteredByMacro(macro: string): CategoryModel[] {
    return this.filter(this.grouped[macro] || []);
  }

  trackById = (_: number, c: CategoryModel) => c.id;

  selectExisting(cat: CategoryModel): void {
    this.dialogRef.close(cat);
  }

  toggleCreate(): void {
    if (this.creating && this.mode === 'create') {
      this.resetFlag();
      return;
    }
    this.switchToCreate();
  }

  switchToCreate(): void {
    this.mode = 'create';
    this.creating = true;
    this.editingCategoryId = undefined;
    this.pickedIcon = undefined;
    this.createForm.reset({ macroCategory: '', category: '', iconName: '' });
  }

  toggleEdit(): void {
    if (this.editing && this.mode === 'edit') {
      this.resetFlag();
      return;
    }
    this.switchToEdit();
  }

  switchToEdit(): void {
    this.mode = 'edit';
    this.editing = true;
    this.creating = true;
    this.editingCategoryId = undefined;
    this.pickedIcon = undefined;
    this.createForm.reset({ macroCategory: '', category: '', iconName: '' });
    this.editTargetCtrl.setValue(null);
  }

  toggleDelete(): void {
    if (this.mode === 'delete') {
      this.mode = 'create';
      this.resetFlag();
      return;
    }
    this.switchToDelete();
  }

  switchToDelete(): void {
    this.mode = 'delete';
    this.deleting = true;
    this.editingCategoryId = undefined;
    this.pickedIcon = undefined;
    this.selectedCategoryId = undefined;
    this.createForm.reset({ macroCategory: '', category: '', iconName: '' });
    this.editTargetCtrl.setValue(null);
  }

  deleteCategory(): void {
    const dialogRef = this.dialog.open(this.deleteDialogTemplate, {
      width: '400px',
      panelClass: 'delete-dialog-template',
      data: { category: this.categoryToDelete }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true && this.categoryToDelete) {
        this.categoryService.deleteCategory(this.categoryToDelete).subscribe({
          next: () => {
            console.log('Categoria eliminata con successo');

            this.categories = this.categories.filter(
              cat => cat.id !== this.categoryToDelete!.id
            );

            this.buildGroups();

            this.categoryToDelete = null;
            this.selectedCategoryId = null;
            this.resetFlag();

            this.refreshService.triggerRefresh();
          },
          error: err => {
            console.error(err);
          }
        });
      }
    });
  }

  considerToDeleteCategory(cat: CategoryModel): void {
    this.selectedCategoryId = cat.id;
    this.categoryToDelete = cat;
  }

  resetFlag(): void {
    this.creating = false;
    this.editing = false;
    this.deleting = false;
  }

  onEditTargetChange(id: number | null): void {
    if (id == null) return;
    const cat = this.categories.find(c => c.id === id);
    if (cat) this.applyEditTarget(cat);
  }

  applyEditTarget(cat: CategoryModel): void {
    if (!cat) return;
    this.editingCategoryId = cat.id;
    this.pickedIcon = cat.iconName || undefined;
    this.createForm.setValue({
      macroCategory: cat.macroCategory,
      category: cat.category,
      iconName: cat.iconName
    });
  }

  pickIcon(name: string): void {
    this.pickedIcon = name;
    this.createForm.get('iconName')!.setValue(name);
  }

  submitForm(): void {
    if (this.createForm.invalid) return;

    const payload: CategoryModel = {
      macroCategory: this.createForm.value.macroCategory.trim(),
      category: this.createForm.value.category.trim(),
      iconName: (this.createForm.value.iconName || '').trim(),
      userId: this.userId
    };

    const duplicate = this.categories.some(c =>
      c.macroCategory.toLowerCase() === payload.macroCategory.toLowerCase() &&
      c.category.toLowerCase() === payload.category.toLowerCase() &&
      c.id !== this.editingCategoryId
    );

    if (duplicate) {
      const ref = this.dialog.open(DuplicateCategoryAlertComponent, {
        data: { macroCategory: payload.macroCategory, category: payload.category }
      });
      ref.afterClosed().subscribe(result => {
        if (result === 'modify') {
          const existing = this.categories.find(c =>
            c.macroCategory.toLowerCase() === payload.macroCategory.toLowerCase() &&
            c.category.toLowerCase() === payload.category.toLowerCase()
          );
          if (existing) {
            this.mode = 'edit';
            this.creating = true;
            this.applyEditTarget(existing);
          }
        }
      });
      return;
    }

    if (this.mode === 'edit' && this.editingCategoryId !== undefined) {
      payload.id = this.editingCategoryId;
      this.categoryService.putCategory(payload, this.editingCategoryId).subscribe({
        next: updated => this.dialogRef.close(updated),
        error: err => console.error('Update error', err)
      });
    } else {
      this.categoryService.postCategory(payload).subscribe({
        next: created => this.dialogRef.close(created),
        error: err => console.error('Create category error', err)
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  private getIconNames(): string[] {
    return [
      'Air-balloon', 'Amazon', 'Animal', 'Bank', 'Barbell', 'Barber', 'Beach',
      'Bike', 'Bill', 'Book', 'Camera', 'Car', 'Car-insurance', 'Car-wash',
      'Card-holder', 'Charger', 'Cigar', 'Clothes', 'Cocktail', 'Coffee', 'Coin',
      'Concert-day', 'Diamond', 'Dices', 'Flower', 'Food', 'Football', 'Fuel',
      'Games', 'Gift', 'Grater-cutting', 'Health', 'Home', 'Hotel', 'Id-card',
      'Mechanic', 'Metro', 'Mic', 'Money-bag', 'Motorbike', 'Music-note', 'Nutrition',
      'Parfume', 'Parking', 'Pc', 'Pharmacy', 'Pharmacy-shopping-cart', 'Pills',
      'Ping-pong', 'Plane', 'Plus', 'Police', 'Popcorn', 'Question-mark', 'Race-car',
      'Receipt', 'Robot', 'Salary', 'Settings', 'Ship', 'Shoes', 'Shopping',
      'Ski', 'Smartphone', 'Spanner', 'Stadium', 'Subscribe', 'Swim',
      'Tax', 'Taxi', 'Ticket', 'Tooth', 'Transfer', 'Washing-machine', 'Watch',
      'Wifi', 'Road'
    ];
  }
}

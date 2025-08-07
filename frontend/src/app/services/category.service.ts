import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategoryModel
} from '../models/category.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = '/category';

  constructor(private http: HttpClient) {}

  getCategories(userId: string): Observable<CategoryModel[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<CategoryModel[]>(`${this.apiUrl}`, { params });
  }

  postCategory(category: CategoryModel): Observable<CategoryModel> {
    //return this.http.post<TransactionModel>(`${this.apiUrl}`, transaction);
    console.log(category);
    return new Observable<CategoryModel>;
  }
}

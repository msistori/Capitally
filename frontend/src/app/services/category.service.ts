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

  getCategories(): Observable<CategoryModel[]> {
    return this.http.get<CategoryModel[]>(`${this.apiUrl}`);
  }

  postCategory(category: CategoryModel): Observable<CategoryModel> {
    const { userId, ...payload } = category;
    return this.http.post<CategoryModel>(`${this.apiUrl}`, payload);
  }

  putCategory(category: CategoryModel, id: number): Observable<CategoryModel> {
    const { userId, ...payload } = category;
    return this.http.put<CategoryModel>(`${this.apiUrl}/${id}`, payload);
  }

  deleteCategory(category: CategoryModel) {
    const params = new HttpParams()
      .set('macroCategory', category.macroCategory)
      .set('category', category.category)
    return this.http.delete<CategoryModel>(`${this.apiUrl}`, { params });
  }

  deleteCategories() {
    return this.http.delete<void>(`${this.apiUrl}`);
  }
}

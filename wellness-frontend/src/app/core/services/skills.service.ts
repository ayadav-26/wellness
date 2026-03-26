import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Skill {
  skillId: number;
  skillName: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/skills`;

  getAll(): Observable<{data: Skill[]}> {
    return this.http.get<{data: Skill[]}>(this.apiUrl);
  }

  getById(id: number): Observable<{data: Skill}> {
    return this.http.get<{data: Skill}>(`${this.apiUrl}/${id}`);
  }

  create(skillName: string): Observable<{data: Skill}> {
    return this.http.post<{data: Skill}>(this.apiUrl, { skillName });
  }

  update(id: number, data: Partial<Skill>): Observable<{data: Skill}> {
    return this.http.put<{data: Skill}>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

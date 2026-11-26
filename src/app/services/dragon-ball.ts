
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

export interface Character {
  id: number;
  name: string;
  ki: string;
  maxKi: string;
  race: string;
  gender: string;
  description: string;
  image: string;
  affiliation: string;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginationLinks {
  first: string;
  previous: string;
  next: string;
  last: string;
}

export interface CharacterResponse {
  items: Character[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface CharacterFilters {
  name?: string;
  race?: string;
  gender?: string;
  affiliation?: string;
}

export interface Planet {
  id: number;
  name: string;
  isDestroyed: boolean;
  description: string;
  image: string;
}

export interface Transformation {
  id: number;
  name: string;
  image: string;
  ki: string;
}

@Injectable({
  providedIn: 'root'
})
export class DragonBallService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'https://dragonball-api.com/api';

  // PERSONAJES

  getCharacters(
    page: number = 1,
    limit: number = 10
  ): Observable<CharacterResponse> {

    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<CharacterResponse>(
      `${this.apiUrl}/characters`,
      { params }
    );
  }


  // Recupera todas las páginas para permitir filtros locales fiables.
  // La API no pagina las búsquedas filtradas y puede devolver un arreglo simple.
  getAllCharacters(): Observable<Character[]> {
    return this.getCharacters(1, 10).pipe(
      switchMap((firstPage) => {
        const totalPages = firstPage.meta?.totalPages ?? 1;
        if (totalPages <= 1) {
          return [firstPage.items ?? []];
        }

        const remainingRequests = Array.from(
          { length: totalPages - 1 },
          (_, index) => this.getCharacters(index + 2, 10)
        );

        return forkJoin(remainingRequests).pipe(
          map((pages) => [
            ...(firstPage.items ?? []),
            ...pages.flatMap((page) => page.items ?? [])
          ])
        );
      })
    );
  }

  getCharacter(id: number): Observable<Character> {
    return this.http.get<Character>(
      `${this.apiUrl}/characters/${id}`
    );
  }

  filterCharacters(
    filters: CharacterFilters
  ): Observable<Character[]> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value?.trim()) {
        params = params.set(key, value.trim());
      }
    });

    return this.http.get<Character[]>(
      `${this.apiUrl}/characters`,
      { params }
    );
  }

  // PLANETAS

  getPlanets(
    page: number = 1,
    limit: number = 10
  ): Observable<any> {

    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get(
      `${this.apiUrl}/planets`,
      { params }
    );
  }

  getPlanet(id: number): Observable<Planet> {
    return this.http.get<Planet>(
      `${this.apiUrl}/planets/${id}`
    );
  }

  // TRANSFORMACIONES

  getTransformations(
    page: number = 1,
    limit: number = 10
  ): Observable<any> {

    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get(
      `${this.apiUrl}/transformations`,
      { params }
    );
  }
}

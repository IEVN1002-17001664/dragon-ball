
import {
  Component,
  OnInit,
  HostListener,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  DragonBallService,
  Character,
  PaginationMeta
} from '../../services/dragon-ball';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './character-list.html',
  styleUrl: './character-list.css'
})
export class CharacterListComponent implements OnInit {

  private dragonBallService = inject(DragonBallService);
  private cdr = inject(ChangeDetectorRef);

  private allCharacters: Character[] = [];
  private allCharactersLoaded = false;

  // DATOS
  characters: Character[] = [];
  pagination: PaginationMeta | null = null;

  // ESTADOS
  loading = false;
  error = '';
  filtered = false;

  // PAGINACIÓN
  currentPage = 1;
  pageSize = 12;
  readonly rowsPerPage = 3;

  // FILTROS
  name = '';
  race = '';
  gender = '';
  affiliation = '';

  // OPCIONES DE FILTROS
  races: string[] = [
    'Saiyan',
    'Human',
    'Namekian',
    'Majin',
    'Frieza Race',
    'Android',
    'Jiren Race',
    'God',
    'Angel',
    'Evil',
    'Nucleico',
    'Nucleico benigno',
    'Unknown'
  ];

  genders: string[] = [
    'Male',
    'Female',
    'Other',
    'Unknown'
  ];

  affiliations: string[] = [
    'Z Fighter',
    'Red Ribbon Army',
    'Namekian Warrior',
    'Freelancer',
    'Army of Frieza',
    'Pride Troopers',
    'Assistant of Vermoud',
    'Assistant of Beerus',
    'God Assistant of Beerus',
    'Villain',
    'Other'
  ];

  ngOnInit(): void {
    this.updatePageSize();
    this.loadCharacters();
  }

  // CALCULAR PERSONAJES SEGÚN LAS COLUMNAS VISIBLES
  private updatePageSize(): boolean {
    const width = window.innerWidth;

    let columns: number;

    if (width >= 1280) {
      columns = 4;
    } else if (width >= 1024) {
      columns = 3;
    } else if (width >= 640) {
      columns = 2;
    } else {
      columns = 1;
    }

    const newPageSize = columns * this.rowsPerPage;

    if (newPageSize === this.pageSize) {
      return false;
    }

    this.pageSize = newPageSize;
    return true;
  }

  // AJUSTAR LA PAGINACIÓN CUANDO CAMBIE EL TAMAÑO DE PANTALLA
  @HostListener('window:resize')
  onWindowResize(): void {
    const changed = this.updatePageSize();

    if (changed && !this.filtered) {
      this.loadCharacters(1);
    }
  }

  // CARGAR PERSONAJES
  loadCharacters(page: number = 1): void {
    this.loading = true;
    this.error = '';
    this.filtered = false;
    this.currentPage = page;

    this.dragonBallService
      .getCharacters(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.characters = response.items;
          this.pagination = response.meta;

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al consultar personajes:', err);

          this.error = 'No fue posible cargar los personajes. Intenta nuevamente.';
          this.characters = [];
          this.pagination = null;

          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // BUSCAR Y FILTRAR
  searchCharacters(): void {
    const name = this.name.trim().toLocaleLowerCase();
    const race = this.race.trim().toLocaleLowerCase();
    const gender = this.gender.trim().toLocaleLowerCase();
    const affiliation = this.affiliation.trim().toLocaleLowerCase();

    const hasFilters = !!(name || race || gender || affiliation);

    if (!hasFilters) {
      this.loadCharacters(1);
      return;
    }

    this.loading = true;
    this.error = '';
    this.filtered = true;
    this.pagination = null;
    this.currentPage = 1;
    this.cdr.markForCheck();

    const applyFilters = (): void => {
      this.characters = this.allCharacters.filter((character) =>
        (!name || character.name.toLocaleLowerCase().includes(name)) &&
        (!race || character.race.toLocaleLowerCase() === race) &&
        (!gender || character.gender.toLocaleLowerCase() === gender) &&
        (!affiliation || character.affiliation.toLocaleLowerCase() === affiliation)
      );

      this.loading = false;
      this.error = '';
      this.cdr.markForCheck();
    };

    if (this.allCharactersLoaded) {
      applyFilters();
      return;
    }

    this.dragonBallService.getAllCharacters().subscribe({
      next: (characters) => {
        this.allCharacters = characters;
        this.allCharactersLoaded = true;
        applyFilters();
      },
      error: (err: unknown) => {
        console.error('Error al obtener todos los personajes:', err);

        this.loading = false;
        this.error = 'No fue posible obtener todos los personajes para realizar la búsqueda. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  // LIMPIAR FILTROS
  clearFilters(): void {
    this.name = '';
    this.race = '';
    this.gender = '';
    this.affiliation = '';

    this.loadCharacters(1);
  }

  // NAVEGACIÓN
  firstPage(): void {
    if (this.pagination && this.currentPage > 1) {
      this.loadCharacters(1);
    }
  }

  previousPage(): void {
    if (this.pagination && this.currentPage > 1) {
      this.loadCharacters(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (
      this.pagination &&
      this.currentPage < this.pagination.totalPages
    ) {
      this.loadCharacters(this.currentPage + 1);
    }
  }

  lastPage(): void {
    if (this.pagination) {
      this.loadCharacters(this.pagination.totalPages);
    }
  }

  // VOLVER AL CATÁLOGO
  showAllCharacters(): void {
    this.clearFilters();
  }
}

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PlaylistService } from './playlist.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Playlist, PlaylistListResponse } from '@shared/models';

describe('PlaylistService', () => {
  let service: PlaylistService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl.slice(0, -1)
    : environment.apiUrl;
  const apiUrl = `${baseUrl}/playlists`;

  const authServiceStub: Partial<AuthService> = {
    getToken: () => of('fake-token'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
      ],
    });

    service = TestBed.inject(PlaylistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() issues GET /playlists with auth header and caches the result', () => {
    const fakeResponse: PlaylistListResponse = {
      items: [{ id: 1, title: 'Mi playlist' } as Playlist],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    service.list({ page: 1, limit: 20, sortBy: 'newest' }).subscribe((res) => {
      expect(res).toEqual(fakeResponse);
    });

    const req = httpMock.expectOne(
      (r) => r.url === apiUrl && r.method === 'GET',
    );
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    expect(req.request.params.get('page')).toBe('1');
    req.flush(fakeResponse);

    expect(service.playlists().length).toBe(1);
    expect(service.playlists()[0].id).toBe(1);
  });

  it('create() posts payload and prepends to cache', () => {
    const created = {
      id: 5,
      title: 'Creada',
      items: [],
      ownerId: 1,
    } as unknown as Playlist;

    service
      .create({ title: 'Creada', visibility: 'PRIVATE' })
      .subscribe((res) => expect(res).toEqual(created));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Creada', visibility: 'PRIVATE' });
    req.flush(created);

    expect(service.selectedPlaylist()?.id).toBe(5);
  });

  it('reorder() posts the items array to the reorder endpoint', () => {
    service
      .reorder(3, { items: [{ itemId: 10, position: 1 }] })
      .subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3/items/reorder`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items: [{ itemId: 10, position: 1 }] });
    req.flush({ items: [] });
  });

  it('delete() removes the playlist from the local cache', () => {
    service['playlistsSignal'].set([
      { id: 1, title: 'A' } as Playlist,
      { id: 2, title: 'B' } as Playlist,
    ]);

    service.delete(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.playlists().map((p) => p.id)).toEqual([2]);
  });
});

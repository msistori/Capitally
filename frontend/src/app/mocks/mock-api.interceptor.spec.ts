import { HTTP_INTERCEPTORS, HttpClient, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { upcomingRecurringMock } from './dashboard.mock';
import { MockApiInterceptor } from './mock-api.interceptor';

describe('MockApiInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let originalMockApi: unknown;

  beforeEach(() => {
    originalMockApi = (environment as any).mockApi;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: MockApiInterceptor, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (environment as any).mockApi = originalMockApi;
    httpMock.verify();
  });

  it('passes requests through without checking endpoint flags when the global mock flag is disabled', () => {
    (environment as any).mockApi = {
      enabled: false,
      endpoints: {
        authLogin: true
      }
    };

    http.post('/auth/login', { usernameOrEmail: 'demo', password: 'demo123!' }).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('returns the mocked guest login when global and endpoint flags are enabled', done => {
    (environment as any).mockApi = {
      enabled: true,
      endpoints: {
        authLogin: true
      }
    };

    http.post<any>('/auth/login', { usernameOrEmail: 'demo', password: 'demo123!' }).subscribe(response => {
      expect(response.username).toBe('demo');
      expect(response.roles).toEqual(['USER', 'DEMO']);
      done();
    });

    httpMock.expectNone('/auth/login');
  });

  it('passes the request through when the single endpoint flag is disabled', () => {
    (environment as any).mockApi = {
      enabled: true,
      endpoints: {
        authLogin: false
      }
    };

    http.post('/auth/login', { usernameOrEmail: 'demo', password: 'demo123!' }).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('returns the mocked dashboard overview for an enabled data endpoint', done => {
    (environment as any).mockApi = {
      enabled: true,
      endpoints: {
        dashboardOverview: true
      }
    };

    http.get<any>('/dashboard/overview?userId=1').subscribe(response => {
      expect(response.totalBalancePerCurrency.EUR).toBe(8534.05);
      expect(response.upcomingRecurringCount).toBe(upcomingRecurringMock.length);
      done();
    });

    httpMock.expectNone('/dashboard/overview?userId=1');
  });
});

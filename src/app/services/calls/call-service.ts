import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Error shape every caller can rely on, regardless of what the backend returned. */
export interface ApiError {
  status: number;
  message: string;
}

export interface CreateCompanyRequest {
  name: string;
  slug: string;
  domain: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  timeZone: string;
  currency: string;
  packageId: string;
  logoUrl: string;
  lat: number | null;
  long: number | null;
  packageStartedOn: string;
  packageExpiresOn: string;
}

export interface CreateCompanyResponse {
  id: string;
  name: string;
}

/** Payload sent when creating a user under a company. */
export interface CreateUserRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  address: string;
  phoneNumber: string;
  gender: string;
  /** ISO timestamp. */
  dateOfBirth: string;
  nationality: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  bloodGroup: string;
  maritalStatus: string;
  aadharNumber: string;
  panNumber: string;
  passportNumber: string;
  employeeCode: string;
  department: string;
  designation: string;
  /** ISO timestamp. */
  dateOfJoining: string;
  /** ISO timestamp, or null while the user is still employed. */
  dateOfLeaving: string | null;
  reportingManager: string;
  workLocation: string;
  workShift: string;
  workPhone: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  bankAccountNumber: string;
  bankName: string;
  bankIfscCode: string;
  bankBranch: string;
  profilePicture: string;
  bankAccountType: string;
}

export interface CreateUserResponse {
  id: string;
  email: string;
}

/** A company as returned by the detail endpoint — the create payload plus its id. */
export interface CompanyDetails extends CreateCompanyRequest {
  id: string;
}

/** A user row as shown in the company's user list. */
export interface CompanyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
  designation: string;
  department: string;
  profilePicture: string;
}

/** A user as returned by the detail endpoint — the create payload minus the password. */
export type UserDetails = Omit<CreateUserRequest, 'password'> & { id: string };

/** A subscription plan offered when creating a company. */
export interface PlanDetails {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  durationInDays?: number;
}

/** A company row as shown on the home list. */
export interface Company {
  id: string;
  name: string;
  /** Optional remote logo; the card falls back to an initials monogram. */
  logoUrl?: string;
  phone: string;
  planType: string;
  /** ISO date — when the current plan expires. */
  validTill: string;
  /** ISO date — when the current plan was bought. */
  purchasedOn: string;
}

/**
 * Single entry point for backend calls: prefixes the API base URL and normalizes
 * failures into `ApiError`. The bearer token is added by `authInterceptor`.
 */
@Injectable({
  providedIn: 'root',
})
export class CallService {
  private readonly http = inject(HttpClient);


  get<T>(path: string): Observable<T> {
    return this.http
      .get<T>(this.url(path), { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(this.url(path), body, { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(this.url(path), body, { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(this.url(path), { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createCompany(company: CreateCompanyRequest): Observable<CreateCompanyResponse> {
    return this.post<CreateCompanyResponse>('/api/SuperAdmin/add-company', company);
  }

  createUser(user: CreateUserRequest): Observable<CreateUserResponse> {
    return this.post<CreateUserResponse>('/api/SuperAdmin/company/add-user', user);
  }

  /** Everything stored about one company, used by the detail and edit screens. */
  get_company_details(companyId: string): Observable<CompanyDetails> {
    return this.get<unknown>(`/api/SuperAdmin/company/${companyId}`).pipe(
      map((response) => this.toCompanyDetails(response)),
    );
  }

  updateCompany(companyId: string, company: CreateCompanyRequest): Observable<CompanyDetails> {
    return this.put<CompanyDetails>(`/api/SuperAdmin/companies/${companyId}`, company);
  }


  deleteCompany(companyId: string): Observable<void> {
    return this.post<void>(`/api/SuperAdmin/delete-company`, { companyId });
  }

  /** Users belonging to one company. */
  get_company_users(companyId: string): Observable<CompanyUser[]> {
    return this.get<unknown>(`/api/SuperAdmin/company/users/${companyId}`).pipe(
      map((response) => this.toUserList(response)),
    );
  }

  get_user_details(userId: string): Observable<UserDetails> {
    return this.get<UserDetails>(`/api/SuperAdmin/company/user/${userId}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.delete<void>(`/api/SuperAdmin/company/delete-user/${userId}`);
  }

  updateUser(userId: string, user: Omit<CreateUserRequest, 'password'>): Observable<UserDetails> {
    return this.put<UserDetails>(`/api/SuperAdmin/users/${userId}`, user);
  }

  /** Plans shown in the subscription section of the create-company form. */
  get_plan_Details(): Observable<PlanDetails[]> {
    return this.get<unknown>('/api/SuperAdmin/packages').pipe(
      map((response) => this.toPlanList(response)),
    );
  }

  /** Companies shown on the home list. */
  get_companyies_list(): Observable<Company[]> {
    return this.get<unknown>('/api/SuperAdmin/companies').pipe(
      map((response) => this.toCompanyList(response)),
    );
  }

  private toPlanList(response: unknown): PlanDetails[] {
    return this.unwrapList(response, 'plans').map((item) => {
      const pick = this.picker(item);
      const name = pick('name', 'planName', 'title');
      const price = pick('price', 'amount');
      const currency = pick('currency');
      const duration = pick('durationInDays', 'duration');

      return {
        id: String(pick('id', 'planId', '_id') ?? name ?? ''),
        name: String(name ?? 'Unnamed plan'),
        price: price === undefined ? undefined : Number(price),
        currency: currency === undefined ? undefined : String(currency),
        durationInDays: duration === undefined ? undefined : Number(duration),
      };
    });
  }

  private toCompanyList(response: unknown): Company[] {
    return this.unwrapList(response, 'companies').map((item) => {
      const pick = this.picker(item);
      const logoUrl = pick('logoUrl', 'logo');

      return {
        id: String(pick('id', 'companyId', '_id') ?? ''),
        name: String(pick('name', 'companyName') ?? 'Unnamed company'),
        logoUrl: logoUrl === undefined ? undefined : String(logoUrl),
        phone: String(pick('phone', 'phoneNumber', 'contactNumber') ?? ''),
        planType: String(pick('planType', 'plan', 'packageName', 'planName') ?? '—'),
        validTill: String(pick('validTill', 'packageExpiresOn', 'expiresOn') ?? ''),
        purchasedOn: String(pick('purchasedOn', 'packageStartedOn', 'startedOn', 'createdAt') ?? ''),
      };
    });
  }

  /** Unwraps a `{ data | company | result: {...} }` envelope around a single company. */
  private toCompanyDetails(response: unknown): CompanyDetails {
    const envelope = (response ?? {}) as Record<string, unknown>;
    const body = (envelope['data'] ?? envelope['company'] ?? envelope['result'] ?? envelope) as Record<
      string,
      unknown
    >;
    const pick = this.picker(body);

    return {
      ...(body as unknown as CompanyDetails),
      id: String(pick('id', 'companyId', '_id') ?? ''),
      // The list and detail endpoints disagree on casing for this one.
      timeZone: String(pick('timeZone', 'timezone') ?? ''),
    };
  }

  private toUserList(response: unknown): CompanyUser[] {
    return this.unwrapList(response, 'users').map((item) => {
      const pick = this.picker(item);

      return {
        id: String(pick('id', 'userId', '_id') ?? ''),
        firstName: String(pick('firstName', 'firstname') ?? ''),
        lastName: String(pick('lastName', 'lastname') ?? ''),
        email: String(pick('email') ?? ''),
        role: String(pick('role', 'roleName') ?? ''),
        phoneNumber: String(pick('phoneNumber', 'phone') ?? ''),
        designation: String(pick('designation') ?? ''),
        department: String(pick('department') ?? ''),
        profilePicture: String(pick('profilePicture', 'avatar') ?? ''),
      };
    });
  }

  /** Accepts a bare array or a `{ data | <key> | result: [...] }` envelope. */
  private unwrapList(response: unknown, key: string): Record<string, unknown>[] {
    const envelope = (response ?? {}) as Record<string, unknown>;
    const list = Array.isArray(response)
      ? response
      : envelope['data'] ?? envelope[key] ?? envelope['result'];

    return Array.isArray(list) ? list.map((entry) => (entry ?? {}) as Record<string, unknown>) : [];
  }

  /** First non-null value among the given keys — backends spell these differently. */
  private picker(item: Record<string, unknown>) {
    return (...keys: string[]): unknown =>
      keys.map((key) => item[key]).find((value) => value !== undefined && value !== null);
  }

  private url(path: string): string {
    return `${environment.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // The session token is added by `authInterceptor`, not here.
  private headers(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => this.toApiError(error));
  }

  private toApiError(error: HttpErrorResponse): ApiError {
    // status 0 means the request never reached the server (offline, CORS, DNS).
    if (error.status === 0) {
      return {
        status: 0,
        message: 'Unable to reach the server. Check your connection and try again.',
      };
    }

    const body = error.error;
    const message =
      (typeof body === 'string' && body) ||
      body?.message ||
      body?.error ||
      error.message ||
      'Something went wrong. Please try again.';

    return { status: error.status, message };
  }
}

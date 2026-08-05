import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(waitForAsync(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }));

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an invalid, empty form', () => {
    expect(component.form.invalid).toBeTrue();
    expect(component.form.getRawValue()).toEqual({ email: '', password: '' });
  });

  it('rejects a malformed email and a short password', () => {
    component.form.setValue({ email: 'not-an-email', password: '123' });

    expect(component.form.controls.email.hasError('email')).toBeTrue();
    expect(component.form.controls.password.hasError('minlength')).toBeTrue();
  });

  it('does not call the API when the form is invalid', () => {
    component.submit();

    expect(component.form.controls.email.touched).toBeTrue();
    httpMock.expectNone(() => true);
  });

  it('stores the session and redirects on success', () => {
    const navigate = spyOn(router, 'navigateByUrl');
    component.form.setValue({ email: 'admin@company.com', password: 'secret123' });

    component.submit();

    const request = httpMock.expectOne((req) => req.url.endsWith('/auth/login'));
    expect(request.request.method).toBe('POST');
    request.flush({
      token: 'jwt-token',
      user: { id: '1', name: 'Admin', email: 'admin@company.com' },
    });

    expect(localStorage.getItem('hrss.token')).toBe('jwt-token');
    expect(navigate).toHaveBeenCalledWith('/home', { replaceUrl: true });
    expect(component.submitting()).toBeFalse();
  });

  it('shows a friendly message when credentials are rejected', () => {
    component.form.setValue({ email: 'admin@company.com', password: 'wrongpass' });

    component.submit();

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/login'))
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.errorMessage()).toBe('Incorrect email or password.');
    expect(component.submitting()).toBeFalse();
    expect(component.form.enabled).toBeTrue();
  });

  it('toggles password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
  });
});

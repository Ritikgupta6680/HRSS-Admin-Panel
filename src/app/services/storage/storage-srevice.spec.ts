import { TestBed } from '@angular/core/testing';

import { StorageSrevice } from './storage-srevice';

describe('StorageSrevice', () => {
  let service: StorageSrevice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageSrevice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

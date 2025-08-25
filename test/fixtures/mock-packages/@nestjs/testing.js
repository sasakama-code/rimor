// Mock @nestjs/testing module for testing
module.exports = {
  Test: {
    createTestingModule: () => ({
      compile: () => Promise.resolve({
        get: () => ({}),
        resolve: () => ({}),
      }),
      overrideProvider: () => ({
        useValue: () => {},
        useClass: () => {},
        useFactory: () => {},
      }),
      overrideGuard: () => ({
        useValue: () => {},
      }),
      overridePipe: () => ({
        useValue: () => {},
      }),
      overrideInterceptor: () => ({
        useValue: () => {},
      }),
    }),
  },
  TestingModule: class TestingModule {},
};
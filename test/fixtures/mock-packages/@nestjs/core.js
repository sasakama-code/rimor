// Mock @nestjs/core module for testing
module.exports = {
  NestFactory: {
    create: () => Promise.resolve({
      listen: () => Promise.resolve(),
      close: () => Promise.resolve(),
      get: () => ({}),
      useGlobalPipes: () => {},
      useGlobalFilters: () => {},
      useGlobalInterceptors: () => {},
      useGlobalGuards: () => {},
      enableCors: () => {},
      setGlobalPrefix: () => {},
    }),
  },
  APP_FILTER: Symbol('APP_FILTER'),
  APP_GUARD: Symbol('APP_GUARD'),
  APP_INTERCEPTOR: Symbol('APP_INTERCEPTOR'),
  APP_PIPE: Symbol('APP_PIPE'),
  ModuleRef: class ModuleRef {},
  HttpAdapterHost: class HttpAdapterHost {},
  Reflector: class Reflector {},
};
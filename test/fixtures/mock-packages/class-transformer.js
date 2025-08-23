// Mock class-transformer module for testing
module.exports = {
  plainToClass: (cls, plain) => plain,
  plainToInstance: (cls, plain) => plain,
  classToPlain: (instance) => instance,
  instanceToPlain: (instance) => instance,
  classToClass: (instance) => instance,
  instanceToInstance: (instance) => instance,
  serialize: (instance) => JSON.stringify(instance),
  deserialize: (cls, json) => JSON.parse(json),
  Exclude: () => () => {},
  Expose: () => () => {},
  Type: () => () => {},
  Transform: () => () => {},
  TransformPlainToClass: () => () => {},
  TransformClassToPlain: () => () => {},
  TransformClassToClass: () => () => {},
};
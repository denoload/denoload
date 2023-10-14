import { Registry } from './registry.ts'

export const globalRegistry = new Registry()

export { type RegistryObj, mergeRegistryObjects } from './registry.ts'
export { trend } from './trend.ts'

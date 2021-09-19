import { Field, FullType } from '../../introspection/types'
import { GeneratorConfig } from '../config'
import { TypesByName } from './types'

export type FakeField = {
  readonly type: FullType
  readonly value: unknown
}

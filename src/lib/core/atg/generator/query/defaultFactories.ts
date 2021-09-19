import _ from 'lodash'
import { GraphQLFactory } from '../config'

export const DEFAULT_FACTORIES: Record<string, GraphQLFactory> = {
  String: (context) => {
    
    // Tries to intelligently generate a string in function of the field name
    switch (context.targetName) {
    }
  },
}

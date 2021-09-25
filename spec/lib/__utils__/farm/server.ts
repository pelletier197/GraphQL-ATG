import { GraphQLIntrospectionResult } from '@lib/core/atg/introspection/types'
import gql from '@lib/core/graphql/gql'
import omitDeep from 'omit-deep-lodash'

import { startTestServer, TestGraphQLServer } from '../server'

enum AnimalNutrition {
  HERBIVORE,
  CARNIVORE,
  OMNIVORE,
}

export type Animal = {
  readonly name: string
  readonly sound: string
  readonly baby: Animal | null
  readonly nutrition: AnimalNutrition
}

enum CookingMode {
  NO_COOKING_TO_KEEP_ALL_NUTRIMENTS = 'NO_COOKING_TO_KEEP_ALL_NUTRIMENTS',
  OVEN = 'OVEN',
  BOILING = 'BOILING',
  MICRO_WAVE = 'MICRO_WAVE',
  FRIED = 'FRIED',
}

export type Vegetable = {
  readonly name: string
  readonly isBestVegetableOnEarth: boolean
  readonly cookingModes: ReadonlyArray<CookingMode>
}

export type Employee = {
  readonly name: string
  readonly salary: number
}

const schema = gql`
  type Query {
    farm: Farm!
  }

  type Mutation {
    farm: FarmMutations!
  }

  type FarmMutations {
    animals: AnimalMutations!
  }

  type AnimalMutations {
    add(name: String!, sound: String!): Boolean!
  }

  type Farm {
    animals: Animals!
    vegetables: [Vegetable!]!
    employees: Employees!
  }

  type Employees {
    fullTime: [Employee!]!
    interns: [Employee!]!
    unpaidInterns: [Employee!]!
      @deprecated(reason: "Pay all your employees. Slavery is illegal.")
  }

  type Employee {
    name: String
    salary: Int
  }

  type Intern {
    name: String
  }

  type Animals {
    all(names: String): [Animal!]!
    herbivore: [Animal!]!
    carnivore: [Animal!]!
    eatable: [Animal!]!
  }

  type Animal {
    name: String!
    sound: String!
    baby: Animal
  }

  type Vegetable {
    name: String!
    isBestVegetableOnEarth: Boolean!
    cookingModes: [CookingMode!]!
  }

  enum CookingMode {
    NO_COOKING_KEEPS_ALL_NUTRIMENTS
    OVEN
    BOILING
    MICRO_WAVE
    FRIED
  }
`

const ALL_FULLTIME_EMPLOYEES: ReadonlyArray<Employee> = [
  {
    name: 'John',
    salary: 75_000,
  },
  {
    name: 'Alice',
    salary: 75_000,
  },
]

const ALL_INTERNS: ReadonlyArray<Employee> = [
  {
    name: 'John',
    salary: 20_000,
  },
  {
    name: 'The poor intern',
    salary: 0,
  },
]

const ALL_ANIMALS: ReadonlyArray<Animal> = [
  {
    name: 'Cow',
    sound: 'Moo',
    nutrition: AnimalNutrition.HERBIVORE,
    baby: {
      name: 'Calf',
      nutrition: AnimalNutrition.HERBIVORE,
      sound: 'Small moo',
      baby: null,
    },
  },
  {
    name: 'Chicken',
    sound: 'Puk Puk Pukaaak',
    nutrition: AnimalNutrition.OMNIVORE,
    baby: {
      name: 'Chick',
      nutrition: AnimalNutrition.OMNIVORE,
      sound: 'Pit pit',
      baby: null,
    },
  },
  {
    name: 'Lion', // Crazy farmer right there
    sound: 'Grraaaauuuu',
    nutrition: AnimalNutrition.CARNIVORE,
    baby: {
      name: 'Cub',
      nutrition: AnimalNutrition.CARNIVORE,
      sound: 'Meow',
      baby: null,
    },
  },
  {
    name: 'Russian doll',
    sound: 'Give me',
    nutrition: AnimalNutrition.OMNIVORE,
    baby: {
      name: 'Smaller russian doll',
      nutrition: AnimalNutrition.OMNIVORE,
      sound: 'Some',
      baby: {
        name: 'Even smaller russian doll',
        nutrition: AnimalNutrition.OMNIVORE,
        sound: 'Recursion',
        baby: null,
      },
    },
  },
]

export const QUERY_ALL_ANIMALS = gql`
  {
    farm {
      animals {
        all {
          name
          sound
          baby {
            name
            sound
            baby {
              name
              sound
              baby {
                name
                sound
              }
            }
          }
        }
      }
    }
  }
`
export const EXPECTED_ALL_ANIMALS_QUERY_RESULT = {
  farm: {
    animals: {
      all: ALL_ANIMALS.map((animal) => omitDeep(animal, 'nutrition')),
    },
  },
}

export const HERBIVORES: ReadonlyArray<Animal> = ALL_ANIMALS.filter(
  (animal) =>
    animal.nutrition === AnimalNutrition.HERBIVORE ||
    animal.nutrition === AnimalNutrition.OMNIVORE
)

export const CARNIVORES: ReadonlyArray<Animal> = ALL_ANIMALS.filter(
  (animal) =>
    animal.nutrition === AnimalNutrition.CARNIVORE ||
    animal.nutrition === AnimalNutrition.OMNIVORE
)

export const ALL_VEGETABLES: ReadonlyArray<Vegetable> = [
  {
    name: 'Potato',
    cookingModes: [
      CookingMode.BOILING,
      CookingMode.FRIED,
      CookingMode.MICRO_WAVE,
      CookingMode.OVEN,
    ],
    isBestVegetableOnEarth: true, // There can be only one
  },
  {
    name: 'Carrot',
    cookingModes: [
      CookingMode.BOILING,
      CookingMode.OVEN,
      CookingMode.NO_COOKING_TO_KEEP_ALL_NUTRIMENTS,
    ],
    isBestVegetableOnEarth: false,
  },
  {
    name: 'Corn',
    cookingModes: [CookingMode.BOILING],
    isBestVegetableOnEarth: false,
  },
]

export const EXPECTED_ALL_VEGETABLES_QUERY_RESULT = {
  farm: {
    vegetables: ALL_VEGETABLES,
  },
}

type AllAnimalArgs = {
  readonly name?: string
}

const resolvers = {
  Query: {
    farm: () => ({}),
  },
  Farm: {
    animals: () => ({}),
    vegetables: () => ALL_VEGETABLES,
    employees: () => ({}),
  },
  Animals: {
    all: (_: unknown, args: AllAnimalArgs) => {
      return ALL_ANIMALS.filter(
        (animal: Animal) => !args.name || animal.name.includes(args.name)
      )
    },
    herbivore: () => HERBIVORES,
    carnivore: () => CARNIVORES,
    eatable: () => [], // No animal eating here
  },
  Employees: {
    fullTime: () => ALL_FULLTIME_EMPLOYEES,
    interns: () => ALL_INTERNS,
    unpaidInterns: () => ALL_INTERNS.filter((intern) => intern.salary === 0),
  },

  Mutation: {
    farm: () => ({}),
  },
  FarmMutations: {
    animals: () => ({}),
  },
  AnimalMutations: {
    add: () => false,
  },
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const INTROSPECTION_SCHEMA: GraphQLIntrospectionResult = require('./schema.json')

export async function startFarmServer(): Promise<TestGraphQLServer> {
  return startTestServer(schema, resolvers)
}

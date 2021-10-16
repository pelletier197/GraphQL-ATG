import gql from '../../../../src/lib/core/graphql/gql';
import omitDeep from 'omit-deep-lodash';
import * as farmSchema from './schema.json';
import { startTestServer } from '../server';
var AnimalNutrition;
(function (AnimalNutrition) {
    AnimalNutrition[AnimalNutrition["HERBIVORE"] = 0] = "HERBIVORE";
    AnimalNutrition[AnimalNutrition["CARNIVORE"] = 1] = "CARNIVORE";
    AnimalNutrition[AnimalNutrition["OMNIVORE"] = 2] = "OMNIVORE";
})(AnimalNutrition || (AnimalNutrition = {}));
var CookingMode;
(function (CookingMode) {
    CookingMode["NO_COOKING_TO_KEEP_ALL_NUTRIMENTS"] = "NO_COOKING_TO_KEEP_ALL_NUTRIMENTS";
    CookingMode["OVEN"] = "OVEN";
    CookingMode["BOILING"] = "BOILING";
    CookingMode["MICRO_WAVE"] = "MICRO_WAVE";
    CookingMode["FRIED"] = "FRIED";
})(CookingMode || (CookingMode = {}));
const schema = gql `
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
`;
const ALL_FULLTIME_EMPLOYEES = [
    {
        name: 'John',
        salary: 75000,
    },
    {
        name: 'Alice',
        salary: 75000,
    },
];
const ALL_INTERNS = [
    {
        name: 'John',
        salary: 20000,
    },
    {
        name: 'The poor intern',
        salary: 0,
    },
];
const ALL_ANIMALS = [
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
        name: 'Lion',
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
];
export const QUERY_ALL_ANIMALS = gql `
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
`;
export const EXPECTED_ALL_ANIMALS_QUERY_RESULT = {
    farm: {
        animals: {
            all: ALL_ANIMALS.map((animal) => omitDeep(animal, 'nutrition')),
        },
    },
};
export const HERBIVORES = ALL_ANIMALS.filter((animal) => animal.nutrition === AnimalNutrition.HERBIVORE ||
    animal.nutrition === AnimalNutrition.OMNIVORE);
export const CARNIVORES = ALL_ANIMALS.filter((animal) => animal.nutrition === AnimalNutrition.CARNIVORE ||
    animal.nutrition === AnimalNutrition.OMNIVORE);
export const ALL_VEGETABLES = [
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
];
export const EXPECTED_ALL_VEGETABLES_QUERY_RESULT = {
    farm: {
        vegetables: ALL_VEGETABLES,
    },
};
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
        all: (_, args) => {
            return ALL_ANIMALS.filter((animal) => !args.name || animal.name.includes(args.name));
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
};
export const INTROSPECTION_SCHEMA = farmSchema;
export async function startFarmServer() {
    return startTestServer(schema, resolvers);
}

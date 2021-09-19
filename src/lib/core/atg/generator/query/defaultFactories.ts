import faker from 'faker'
import _ from 'lodash'

import { GraphQLFactory } from '../config'

export const DEFAULT_FACTORIES: Record<string, GraphQLFactory> = {
  String: (context) => {
    switch (context.targetName.toLowerCase()) {
      case 'email':
      case 'mail':
        return faker.internet.email()
      case 'fullname':
        return `${faker.name.firstName()} ${faker.name.lastName()}`
      case 'firstname':
        return faker.name.firstName()
      case 'lastname':
        return faker.name.lastName()
      case 'job':
      case 'jobtitle':
        return faker.name.jobTitle()
      case 'jobarea':
        return faker.name.jobArea()
      case 'phone':
        return faker.phone.phoneNumber()
      case 'country':
        return faker.address.country()
      case 'address':
        return faker.address.streetAddress(true)
      case 'state':
        return faker.address.state()
      case 'city':
        return faker.address.city()
      case 'zipcode':
        return faker.address.zipCode()
      case 'latitude':
        return faker.address.latitude()
      case 'longitude':
        return faker.address.longitude()
      case 'company':
        return faker.company.companyName()
      case 'department':
        return faker.commerce.department()
      case 'date':
        return faker.date.future()
      case 'price':
        return faker.commerce.price()
      case 'color':
        return faker.commerce.color()
      case 'product':
        return faker.commerce.product()
      case 'material':
        return faker.commerce.productMaterial()
      case 'id':
        return faker.datatype.uuid()
      case 'name':
        return faker.lorem.words()
      case 'description':
        return faker.lorem.sentence()
      default:
        return faker.datatype.string()
    }
  },
  ID: () => faker.datatype.uuid(),
  Boolean: () => faker.datatype.boolean(),
  Int: (context) => {
    switch (context.targetName) {
      case 'salary':
        return faker.datatype.number(200_000)
      default:
        return faker.datatype.number(100)
    }
  },
  Float: () => faker.datatype.float(100),
}

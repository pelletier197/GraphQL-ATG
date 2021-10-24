import { RunnerConfig } from '@lib/core/atg/runner/config.js'
import { RunnerHook } from '@lib/core/atg/runner/hooks/hook.js'
import {
  executeQueries,
  QueryExecutionResults,
} from '@lib/core/atg/runner/runner.js'
import gql from '@lib/core/graphql/gql.js'
import { GraphQLQuery } from '@lib/core/graphql/query/query.js'
import { TaskContext } from '@lib/core/task/task.js'
import { when } from 'jest-when'

const graphqlRequest = jest.fn()
const beforeTestHook = jest.fn()
const onSuccessHook = jest.fn()
const onFailHook = jest.fn()

const query: GraphQLQuery = {
  query: gql`
    query FindAnimalsByName($name: String) {
      farm {
        animals {
          all(names: $name) {
            name
          }
        }
      }
    }
  `,
  variables: { name: 'C' },
}

const queryResults = {
  farm: {
    animals: {
      all: [
        {
          name: 'Cow',
        },
        {
          name: 'Chicken',
        },
      ],
    },
  },
}

describe('executing graphql queries', () => {
  beforeEach(() => {
    graphqlRequest.mockClear()
  })

  async function run(context?: {
    readonly config?: Partial<RunnerConfig>
    readonly queries?: ReadonlyArray<GraphQLQuery>
    readonly hook?: RunnerHook
  }): Promise<QueryExecutionResults> {
    return executeQueries(
      {
        request: graphqlRequest,
      },
      context?.queries ?? [query],
      [
        context?.hook ?? {
          beforeTest: beforeTestHook,
          onSuccess: onSuccessHook,
          onFail: onFailHook,
        },
      ],
      context?.config ?? {
        concurrency: 1,
        failFast: false,
      }
    )
  }

  describe('all queries succeed', () => {
    beforeEach(() => {
      when(graphqlRequest)
        .calledWith(query.query, query.variables)
        .mockReturnValueOnce(
          Promise.resolve({
            data: queryResults,
            errors: [],
          })
        )
    })

    it('should return a result with all queries that succeeded', async () => {
      const result = await run()

      expect(result).toEqual({
        resultDetails: [
          {
            query: query,
            isSuccessful: true,
            executionTimeMilliseconds: expect.toSatisfy(
              (value: number) => value >= 0
            ),
            response: {
              data: queryResults,
              errors: [],
            },
          },
        ],
        executionTimeMilliseconds: expect.toSatisfy(
          (value: number) => value >= 0
        ),
        successful: 1,
        failed: 0,
      })
    })

    it('should call the before test hook and success hook in order', async () => {
      await run()

      const expectedContext = {
        query: query,
        task: expect.anything(),
      }

      expect(beforeTestHook).toHaveBeenCalledWith(expectedContext)
      expect(onSuccessHook).toHaveBeenCalledWith(expectedContext)
      expect(onFailHook).not.toHaveBeenCalled()

      expect(beforeTestHook).toHaveBeenCalledBefore(onSuccessHook)
    })
  })
})

import { RunnerConfig } from '@lib/core/atg/runner/config.js'
import { RunnerHook } from '@lib/core/atg/runner/hooks/hook.js'
import {
  executeQueries,
  QueryExecutionResults,
  QueryExecutionStatus,
} from '@lib/core/atg/runner/runner.js'
import gql from '@lib/core/graphql/gql.js'
import { GraphQLQuery } from '@lib/core/graphql/query/query.js'
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
  variables: { names: 'C' },
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
    beforeTestHook.mockClear()
    onSuccessHook.mockClear()
    onFailHook.mockClear()
  })

  async function run(context?: {
    readonly config?: Partial<RunnerConfig>
    readonly queries?: ReadonlyArray<GraphQLQuery>
    readonly hook?: RunnerHook
  }): Promise<QueryExecutionResults> {
    return await executeQueries(
      {
        request: graphqlRequest,
      },
      context?.queries ?? [query],
      {
        concurrency: 1,
        failFast: false,
        hooks: [
          context?.hook ?? {
            beforeTest: beforeTestHook,
            onSuccess: onSuccessHook,
            onFail: onFailHook,
          },
        ],
        ...context?.config,
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

    it('should return a result with all the query results', async () => {
      const result = await run()

      expect(result).toEqual({
        resultDetails: [
          {
            index: 0,
            query: query,
            status: QueryExecutionStatus.SUCCESSFUL,
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
        skipped: 0,
      })
    })

    it('should call the hooks in order', async () => {
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

  describe('some queries succeed and some queries fail', () => {
    const secondQuery = { ...query, variables: { names: 'second' } }
    const thirdQuery = { ...query, variables: { names: 'third' } }

    const error = {
      message: 'An unknown error occurred',
    }

    beforeEach(() => {
      when(graphqlRequest)
        .calledWith(query.query, query.variables)
        .mockReturnValueOnce(
          Promise.resolve({
            data: queryResults,
            errors: [],
          })
        )

      when(graphqlRequest)
        .calledWith(secondQuery.query, secondQuery.variables)
        .mockReturnValueOnce(
          Promise.resolve({
            data: undefined,
            errors: [error],
          })
        )

      when(graphqlRequest)
        .calledWith(thirdQuery.query, thirdQuery.variables)
        .mockReturnValueOnce(
          Promise.resolve({
            data: queryResults,
            errors: [],
          })
        )
    })

    describe('fail fast mode is not activated', () => {
      const config: Partial<RunnerConfig> = {
        failFast: false,
      }

      it('should return a result with all queries that succeeded', async () => {
        const result = await run({
          queries: [query, secondQuery, thirdQuery],
          config: config,
        })

        expect(result).toEqual({
          resultDetails: [
            {
              index: 0,
              query: query,
              status: QueryExecutionStatus.SUCCESSFUL,
              executionTimeMilliseconds: expect.toSatisfy(
                (value: number) => value >= 0
              ),
              response: {
                data: queryResults,
                errors: [],
              },
            },
            {
              index: 1,
              query: secondQuery,
              status: QueryExecutionStatus.FAILED,
              executionTimeMilliseconds: expect.toSatisfy(
                (value: number) => value >= 0
              ),
              response: {
                data: undefined,
                errors: [error],
              },
            },
            {
              index: 2,
              query: thirdQuery,
              status: QueryExecutionStatus.SUCCESSFUL,
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
          successful: 2,
          failed: 1,
          skipped: 0,
        })
      })

      it('should call the before test hook and success hook in order for all queries', async () => {
        await run({
          queries: [query, secondQuery, thirdQuery],
          config: config,
        })

        const firstContext = {
          query: query,
          task: expect.anything(),
        }

        const secondContext = {
          query: secondQuery,
          task: expect.anything(),
        }

        const thirdContext = {
          query: thirdQuery,
          task: expect.anything(),
        }

        expect(beforeTestHook).toHaveBeenNthCalledWith(1, firstContext)
        expect(onSuccessHook).toHaveBeenNthCalledWith(1, firstContext)
        expect(onFailHook).not.toHaveBeenCalledWith(firstContext)

        expect(beforeTestHook).toHaveBeenNthCalledWith(2, secondContext)
        expect(onSuccessHook).not.toHaveBeenCalledWith(secondContext)
        expect(onFailHook).toHaveBeenNthCalledWith(1, secondContext)

        expect(beforeTestHook).toHaveBeenNthCalledWith(3, thirdContext)
        expect(onSuccessHook).toHaveBeenNthCalledWith(2, thirdContext)
        expect(onFailHook).not.toHaveBeenCalledWith(thirdContext)
      })
    })

    describe('fail fast mode is activated', () => {
      const config: Partial<RunnerConfig> = {
        failFast: true,
      }

      it('should return a result with all queries that succeeded', async () => {
        const result = await run({
          queries: [query, secondQuery, thirdQuery],
          config: config,
        })

        expect(result).toEqual({
          resultDetails: [
            {
              index: 0,
              query: query,
              status: QueryExecutionStatus.SUCCESSFUL,
              executionTimeMilliseconds: expect.toSatisfy(
                (value: number) => value >= 0
              ),
              response: {
                data: queryResults,
                errors: [],
              },
            },
            {
              index: 1,
              query: secondQuery,
              status: QueryExecutionStatus.FAILED,
              executionTimeMilliseconds: expect.toSatisfy(
                (value: number) => value >= 0
              ),
              response: {
                data: undefined,
                errors: [error],
              },
            },
            {
              index: 2,
              query: thirdQuery,
              status: QueryExecutionStatus.SKIPPED,
              executionTimeMilliseconds: undefined,
              response: undefined,
            },
          ],
          executionTimeMilliseconds: expect.toSatisfy(
            (value: number) => value >= 0
          ),
          successful: 1,
          failed: 1,
          skipped: 1,
        })
      })

      it('should call the before test hook and success hook in order for all queries', async () => {
        await run({
          queries: [query, secondQuery, thirdQuery],
          config: config,
        })

        const firstContext = {
          query: query,
          task: expect.anything(),
        }

        const secondContext = {
          query: secondQuery,
          task: expect.anything(),
        }

        const thirdContext = {
          query: thirdQuery,
          task: expect.anything(),
        }

        expect(beforeTestHook).toHaveBeenNthCalledWith(1, firstContext)
        expect(onSuccessHook).toHaveBeenNthCalledWith(1, firstContext)
        expect(onFailHook).not.toHaveBeenCalledWith(firstContext)

        expect(beforeTestHook).toHaveBeenNthCalledWith(2, secondContext)
        expect(onSuccessHook).not.toHaveBeenCalledWith(secondContext)
        expect(onFailHook).toHaveBeenNthCalledWith(1, secondContext)

        expect(beforeTestHook).not.toHaveBeenCalledWith(thirdContext)
        expect(onSuccessHook).not.toHaveBeenCalledWith(thirdContext)
        expect(onFailHook).not.toHaveBeenCalledWith(thirdContext)
      })
    })
  })
})

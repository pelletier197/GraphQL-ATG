/* eslint-disable @typescript-eslint/no-unused-vars */
// import { runGraphQLAtg } from '@lib/core/atg/graphqlAtg'
// import { getAtgConfiguration } from '@lib/core/cli/cli'
import { newMultiTask } from '@lib/core/progress/progressIndicator'

// async function run() {
//   const config = await getAtgConfiguration()

//   try {
//     await runGraphQLAtg(config)
//   } catch (error) {
//     failed()

//     throw error
//   }
// }

async function yeah() {
  //   const task = newTask(
  //     () => {
  //       return new Promise((_, reject) => {
  //         setTimeout(() => reject('potato'), 2000)
  //       })
  //     },
  //     {
  //       exitOnError: true,
  //       name: 'YEAH',
  //     }
  //   )

  //   try {
  //     const result = await task.start()
  //     console.log(result)
  //   } catch (error) {
  //     console.log('error', error)
  //   }

  const multiTask = newMultiTask(
    [
      {
        name: 'Test 1',
        run: () => {
          return new Promise((_, reject) => {
            setTimeout(() => reject('potato'), 4000)
          })
        },
      },
      {
        name: 'Test 2',
        run: () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve('potato'), 4000)
          })
        },
      },
      {
        name: 'Test 3',
        run: (context) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              context.updateName('New test 3 homies')
              setTimeout(() => resolve('YEAH'), 3000)
            }, 4000)
          })
        },
      },
      {
        name: 'Test 4',
        run: () => {
          return new Promise((_, reject) => {
            setTimeout(() => reject('no internet'), 50)
          })
        },
      },
      {
        name: 'Test 5',
        run: () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve('oh now you have internet'), 5000)
          })
        },
      },
    ],
    {
      exitOnError: true,
      name: 'Super multi-tasking',
      concurrency: 3,
    }
  )

  try {
    const result = await multiTask.start()
    console.log('result', result)
  } catch (error) {
    console.log('error', error)
  }
}

yeah()

// run()

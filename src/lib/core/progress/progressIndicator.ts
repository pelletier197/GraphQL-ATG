import ora from 'ora'

const spinner = ora({
  spinner: {
    frames: ['●—○—◯', '◯—●—◯', '◯—◯—●', '◯—●—◯'],
    interval: 250,
  },
  color: 'green',
})

export function start(text: string) {
  console.log() // Skip one line
  spinner.start(text)
}

export function info(text: string) {
  spinner.info(text)
}

export function succeed() {
  spinner.succeed()
}

export function failed(reason?: string) {
  if (reason) {
    spinner.fail(`${spinner.text}\n${reason}`)
  } else {
    spinner.fail(reason)
  }
}

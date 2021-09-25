import ora from 'ora'

const spinner = ora({
  spinner: {
    frames: ['●—○—◯', '◯—●—◯', '◯—◯—●', '◯—●—◯'],
    interval: 250,
  },
  color: 'green',
})

export function start(text: string) {
  spinner.start(text)
}

export function succeed() {
  spinner.succeed()
}

export function failed() {
  spinner.fail()
}

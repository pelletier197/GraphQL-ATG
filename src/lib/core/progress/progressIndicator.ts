import ora from 'ora'

const spinner = ora({
  spinner: {
    frames: ['⬤=◯=◯', '◯=⬤=◯', '◯=◯=⬤', '◯=⬤=◯'],
    interval: 100,
  },
  color: 'white',
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
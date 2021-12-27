import { spawn } from 'child_process'
import * as sync from 'browser-sync'
const bs = sync.create('docs')

const runAntora = () =>
  new Promise((resolve, reject) => {
    spawn('antora antora-playbook-local.yml', {
      stdio: 'inherit',
      shell: true,
    })
      .on('error', (e) => {
        console.error(e)
        reject()
      })
      .on('close', resolve)
  })

const failWithMessage = (message, error) => {
  console.error(message, error)
  process.exit(-1)
}

const browserSync = () => {
  bs.init({
    ui: false,
    server: 'build/site',
    files: [
      {
        match: [
          './antora-playbook-local.yml',
          './docs/ui/**/*',
          './docs/content/**/*',
        ],
        fn: async (evn, file) => {
          await runAntora()
          console.log('Antora build finished')
          bs.reload()
        },
      },
    ],
  })
}

try {
  try {
    runAntora()
      .then(() => browserSync())
      .catch((e) => failWithMessage("Couldn't run antora", e))
  } catch (e) {
    failWithMessage(`Couldn't locate antora.yml under ${pathToAntoraConfig}`, e)
  }
} catch (err) {
  failWithMessage(
    "Couldn't locate antora playbook. Please run in directory containing antora-playbook.yml",
    err
  )
}

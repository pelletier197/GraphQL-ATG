/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-class */

export class Progress {
  private total: number
  private value: number

  constructor(total: number) {
    if (total <= 0) {
      throw new Error('Illegal total value must be greater than 0')
    }

    this.total = total
    this.value = 0
  }

  increment(): string {
    if (this.value < this.total) {
      this.value += 1
    }

    return this.progress
  }

  public get current(): number {
    return this.value
  }

  public get progress(): string {
    return `${this.value}/${this.total} (${Math.round(
      (this.value * 100) / this.total
    )}%)`
  }
}

export function createProgress(total: number): Progress {
  return new Progress(total)
}

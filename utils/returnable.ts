// Typescript:
import type { FailReturnable, SuccessReturnable } from '../types'

// Constants:
const returnable = {
  success: <T>(payload: T): SuccessReturnable<T> => ({
    status: true,
    payload,
  }),
  fail: <T>(payload: T): FailReturnable<T> => ({
    status: false,
    payload,
  }),
}

// Exports:
export default returnable

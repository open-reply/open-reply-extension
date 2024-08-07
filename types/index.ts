// Exports:
export type SuccessReturnable<S> = { status: true, payload: S }

export type FailReturnable<F> = { status: false, payload: F }

export type Returnable<S, F> = SuccessReturnable<S> | FailReturnable<F>

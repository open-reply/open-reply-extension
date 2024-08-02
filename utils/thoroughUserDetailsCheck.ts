// Packages:
import returnable from 'utils/returnable'

// Typescript:
import type { Returnable } from 'types/index'

// Functions:
const thoroughUserDetailsCheck = (user: any | null, name?: string | null, username?: string | null): Returnable<null, string> => {
  if (!user) returnable.fail('Please login to continue!')
  if (!user?.emailVerified) returnable.fail('Your email is unverified!')

  if (!name) returnable.fail('Please fill up your profile details first!')
  if (!username) returnable.fail('Please fill up your profile details first!')

  return returnable.success(null)
}

// Exports:
export default thoroughUserDetailsCheck

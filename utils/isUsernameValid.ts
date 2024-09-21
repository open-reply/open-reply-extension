// Packages:
import returnable from 'utils/returnable'

// Typescript:
import { Returnable } from 'types/index'

// Functions:
export const validateUsername = (username: string): Returnable<null, string[]> => {
  const reasons: string[] = []

  // Check the length.
  if (username.length === 0) reasons.push('Username cannot be empty')
  else if (username.length > 30) reasons.push('Username cannot be longer than 30 characters')

  // Check if the username starts with a lowercase letter.
  if (!/^[a-z]/.test(username)) reasons.push('Username must start with a lowercase letter')

  // Check for invalid characters.
  if (/[^a-z0-9_]/.test(username)) reasons.push('Username can only contain lowercase letters, numbers, and underscores')

  return reasons.length === 0 ? returnable.success(null) : returnable.fail(reasons)
}

const isUsernameValid = (username: string) => validateUsername(username).status

// Exports:
export default isUsernameValid

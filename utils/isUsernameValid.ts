// Typescript:
import { Returnable } from 'types'

// Functions:
const isUsernameValid = (username: string) => /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/.test(username)

export const validateUsername = (username: string): Returnable<null, string[]> => {
  const reasons: string[] = []

  // Check the length.
  if (username.length === 0) reasons.push('Username cannot be empty')
  else if (username.length > 30) reasons.push('Username cannot be longer than 30 characters')

  // Check if the username starts with a lowercase letter.
  if (!/^[a-z]/.test(username)) reasons.push('Username must start with a lowercase letter')

  // Check for invalid characters.
  if (/[^a-z0-9._]/.test(username)) reasons.push('Username can only contain lowercase letters, numbers, periods, and underscores')

  // Check for consecutive periods.
  if (/\.{2,}/.test(username)) reasons.push('Username cannot contain consecutive periods')

  // Check if it ends with a period
  if (/\.$/.test(username)) reasons.push('Username cannot end with a period')

  return reasons.length === 0 ? returnable.success(null) : returnable.fail(reasons)
}

// Exports:
export default isUsernameValid

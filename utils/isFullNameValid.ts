// Packages:
import returnable from 'utils/returnable'

// Typescript:
import { Returnable } from 'types/index'

// Functions:
export const validateFullName = (fullName: string): Returnable<null, string[]> => {
  const reasons: string[] = []

  // Check the length.
  if (fullName.length === 0) reasons.push('Full name cannot be empty')
  else if (fullName.length > 50) reasons.push('Full name cannot be longer than 50 characters')

  // Check for invalid characters.
  if (/[^a-zA-Z\s'-]/.test(fullName)) reasons.push('Full name can only contain letters, spaces, hyphens, and apostrophes')

  // Check for consecutive spaces.
  if (/\s{2,}/.test(fullName)) reasons.push('Full name cannot contain consecutive spaces')

  // Check if it starts or ends with a space, hyphen, or apostrophe.
  if (/^[\s'-]|[\s'-]$/.test(fullName)) reasons.push('Full name cannot start or end with a space, hyphen, or apostrophe')

  // Check for Unicode letters.
  if (!/^[\p{L}\s'-]+$/u.test(fullName)) reasons.push('Full name can only contain valid Unicode letters, spaces, hyphens, and apostrophes')

  return reasons.length === 0 ? returnable.success(null) : returnable.fail(reasons)
}

const isFullNameValid = (fullName: string) => validateFullName(fullName).status

// Exports:
export default isFullNameValid

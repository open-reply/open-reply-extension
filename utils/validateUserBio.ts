// Packages:
import returnable from 'utils/returnable'

// Typescript:
import { Returnable } from 'types/index'

// Functions:
const validateUserBio = (bio: string): Returnable<null, string[]> => {
  const reasons: string[] = []
  const maxLength = 160

  // Check length.
  if (bio.length > maxLength) reasons.push(`Bio cannot be longer than ${maxLength} characters`)

  // Check for excessive line breaks.
  const lineBreaks = (bio.match(/\n/g) || []).length
  if (lineBreaks > 5) reasons.push('Bio cannot contain more than 5 line breaks')

  // Check for excessive consecutive spaces.
  if (/\s{5,}/.test(bio)) reasons.push('Bio cannot contain 5 or more consecutive spaces')

  return reasons.length === 0 ? returnable.success(null) : returnable.fail(reasons)
}

// Exports:
export default validateUserBio

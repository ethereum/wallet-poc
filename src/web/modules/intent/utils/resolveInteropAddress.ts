import { isValidInteropAddress } from '@interop-sdk/addresses'

export const resolveInteropAddress = async (trimmedAddress: string): Promise<string> => {
  const isValid = await isValidInteropAddress(trimmedAddress)
  return isValid ? trimmedAddress : ''
}

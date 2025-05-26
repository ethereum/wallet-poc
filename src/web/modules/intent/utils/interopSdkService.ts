import { isValidInteropAddress, getChainId, humanReadableToBinary } from '@interop-sdk/addresses'

export const resolveInteropAddress = async (trimmedAddress: string): Promise<string> => {
  const isValid = await isValidInteropAddress(trimmedAddress)
  return isValid ? trimmedAddress : ''
}

export const getInteropAddressChain = async (interopAddress: string): Promise<number> => {
  const binaryAddress = await humanReadableToBinary(interopAddress)

  if (binaryAddress) {
    return getChainId(binaryAddress)
  }

  return 0
}

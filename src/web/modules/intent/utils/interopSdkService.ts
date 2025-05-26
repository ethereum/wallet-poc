import {
  isValidInteropAddress,
  getChainId,
  humanReadableToBinary,
  computeChecksum
} from '@interop-sdk/addresses'

export const resolveInteropAddress = async (trimmedAddress: string): Promise<string> => {
  const hasChecksum = trimmedAddress.includes('#')
  let addressToValidate = trimmedAddress

  if (!hasChecksum) {
    const checksum = await computeChecksum(trimmedAddress)
    addressToValidate = `${trimmedAddress}#${checksum}`
  }

  const isValid = await isValidInteropAddress(addressToValidate)
  return isValid ? trimmedAddress : ''
}

export const getInteropAddressChain = async (interopAddress: string): Promise<number> => {
  const binaryAddress = await humanReadableToBinary(interopAddress)

  if (binaryAddress) {
    return getChainId(binaryAddress)
  }

  return 0
}

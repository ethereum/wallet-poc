import { isValidInteropAddress, getChainId, computeChecksum } from '@defi-wonderland/interop'

export const getChecksumAddress = async (address: string): Promise<string> => {
  const checksum = await computeChecksum(address)
  return `${address}#${checksum}`
}

export const toChecksumAddress = async (address: string): Promise<string> => {
  const hasChecksum = address.includes('#')
  return hasChecksum ? address : await getChecksumAddress(address)
}

export const resolveInteropAddress = async (address: string): Promise<string> => {
  const addressToValidate = await toChecksumAddress(address)
  const isValid = await isValidInteropAddress(addressToValidate)
  return isValid ? address : ''
}

export const getInteropAddressChain = async (interopAddress: string): Promise<number> => {
  try {
    const chainId = await getChainId(interopAddress)
    return Number(chainId)
  } catch (error) {
    return 0
  }
}

export const getInteropAddressChainId = async (address: string): Promise<number> => {
  try {
    const interopAddress = await toChecksumAddress(address)
    const chainId = await getChainId(interopAddress)
    return Number(chainId)
  } catch {
    return 0
  }
}

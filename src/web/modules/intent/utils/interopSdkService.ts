import {
  isValidInteropAddress,
  getChainId,
  computeChecksum,
  buildFromPayload,
  humanReadableToBinary,
  binaryToHumanReadable,
  getAddress
} from '@defi-wonderland/interop'

export const getChecksumAddress = async (address: string): Promise<string> => {
  const checksum = await computeChecksum(address)
  return `${address}#${checksum}`
}

export const toChecksumAddress = async (address: string): Promise<string> => {
  if (address.includes('#')) return address
  const checksumAddress = await getChecksumAddress(address)
  return checksumAddress
}

export const resolveInteropAddress = async (address: string): Promise<string> => {
  const addressToValidate = await toChecksumAddress(address)
  const isValid = await isValidInteropAddress(addressToValidate)
  if (!isValid) return ''

  const rawAddress = await getAddress(addressToValidate)
  return rawAddress
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

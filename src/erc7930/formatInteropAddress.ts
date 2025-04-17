import { calculateChecksum } from './calculateChecksum'
import { humanToInteropAddress } from './humanToInteropAddress'

/**
 * Formats an address based on its format and chain namespace
 *
 * @param address - The address to format
 * @param namespace - The chain namespace (e.g. 'eip155', 'solana')
 * @returns The formatted address string
 */
function formatAddressForDisplay(address: string, namespace: string): string {
  // For EVM addresses, ensure they have 0x prefix
  if (namespace === 'eip155') {
    return address.startsWith('0x') ? address : `0x${address}`
  }

  // For Solana addresses, use the original format (likely base58)
  if (namespace === 'solana') {
    return address
  }

  // Default format
  return address
}

/**
 * Address data structure for interoperable addresses
 */
export interface AddressData {
  namespace: string
  version?: number
  chainReference?: string
  address?: string
}

/**
 * Options for formatting an interoperable address
 */
export interface FormatOptions {
  format: 'human' | 'hex'
}

/**
 * Formats address data into an interoperable address per ERC-7930
 *
 * Creates a cross-chain interoperable address from chain-specific address data.
 * Can output in either human-readable or hex format.
 *
 * @param addressData - The address data to format
 * @param options - Formatting options
 * @returns A formatted interoperable address
 *
 * @example
 * ```ts
 * // Format an Ethereum address to human-readable interop format
 * const interopAddress = formatInteropAddress({
 *   namespace: 'eip155',
 *   chainReference: '1',
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * })
 * // '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C'
 *
 * // Format to hex interop format
 * const hexInterop = formatInteropAddress({
 *   namespace: 'eip155',
 *   chainReference: '1',
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * }, { format: 'hex' })
 * // '0x00010000010114D8DA6BF26964AF9D7EED9E03E53415D37AA96045'
 * ```
 *
 * @throws {Error} If chain namespace is missing or format is invalid
 */
export function formatInteropAddress(addressData: AddressData, options?: FormatOptions): string {
  const version = addressData.version || 1
  const format = options?.format || 'human'
  const namespace = addressData.namespace
  const chainReference = addressData.chainReference
  const address = addressData.address

  if (!namespace) {
    throw new Error('Chain namespace is required')
  }

  // Format the address for display (maintains the appropriate format for the chain)
  const displayAddress = address ? formatAddressForDisplay(address, namespace) : ''

  // Format the chain part
  const chainPart = chainReference ? `${namespace}:${chainReference}` : namespace

  // Create a temporary human interop address with a placeholder checksum
  const tempHumanInterop = `${displayAddress}@${chainPart}#00000000`

  // Convert to hex interop address format using the existing function
  const hexInterop = humanToInteropAddress(tempHumanInterop)

  if (!hexInterop) {
    throw new Error('Failed to generate interoperable address')
  }

  const checksum = calculateChecksum(`0x${hexInterop.slice(6)}`)

  const hra = `${displayAddress}@${chainPart}#${checksum}`
  if (format === 'human') {
    return hra
  }

  if (format === 'hex') {
    return humanToInteropAddress(hra, version.toString())
  }

  throw new Error('Invalid format')
}

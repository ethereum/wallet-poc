import bs58 from 'bs58'
import { fromHex, Hex } from 'viem'
import { calculateChecksum } from './calculateChecksum'
import { AddressFormat } from './types'
import { parseInteropAddress } from './parseInteropAddress'

/**
 * Formats a chain for human readability.
 *
 * @param chainNamespace - The chain namespace (e.g., 'eip155', 'solana')
 * @param chainId - The chain ID in hex format
 * @returns Human-readable chain string
 */
function formatChain(chainNamespace: string, chainId: string): string {
  // Handle specific chain namespaces
  if (chainNamespace === 'eip155') {
    return `${chainNamespace}:${fromHex(chainId as Hex, 'number')}`
  }

  if (chainNamespace === 'solana') {
    // For Solana, reference is base58btc-encoded
    return `${chainNamespace}:${bs58.encode(fromHex(chainId as Hex, 'bytes'))}`
  }

  // Default handling for unknown namespaces
  return `${chainNamespace}:${chainId}`
}

/**
 * Formats an address based on chain namespace.
 *
 * @param chainNamespace - The chain namespace (e.g., 'eip155', 'solana')
 * @param address - The address in hex format
 * @returns Formatted address string appropriate for the chain
 */
function formatAddress(chainNamespace: string, address: string): string {
  // Address formatting depends on the chain
  if (chainNamespace === 'eip155') {
    // EVM addresses are displayed as hex
    return address
  }

  if (chainNamespace === 'solana') {
    // Solana addresses are base58btc-encoded
    return bs58.encode(fromHex(address as `0x${string}`, 'bytes'))
  }

  // Default to hex representation
  return address
}

/**
 * Converts an Interoperable Address to a human-readable format.
 *
 * Transforms interoperable address to the format: `<account>@<chain>#<checksum>`
 *
 * @example
 * ```ts
 * import { payloadToHuman } from '@/erc7930'
 *
 * payloadToHuman('0x0001000001011234567890abcdef')
 * // '1234567890abcdef@eip155:1#8F7E6D5C'
 * ```
 *
 * @param address - Interoperable Address in the specified format
 * @param format - Format of the input address ('hex' or 'base58')
 * @returns Human-readable representation of the Interoperable Address
 */
export function payloadToHuman(address: string, format: AddressFormat = 'hex'): string {
  // 1. Parse the address based on the format
  const parsedAddress = parseInteropAddress(address, format)

  // 2. Format the chain part
  const chainPart = formatChain(parsedAddress.chainNamespace, parsedAddress.chainId)

  // 3. Format the address part
  const addressPart = formatAddress(parsedAddress.chainNamespace, parsedAddress.address)

  // 4. Calculate the checksum
  const checksum = calculateChecksum(`0x${address.slice(6)}`)

  // 5. Return the full format
  return `${addressPart}@${chainPart}#${checksum}`
}

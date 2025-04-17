import { parseInteropAddress } from './parseInteropAddress'
import { AddressFormat } from './types'

/**
 * Extracts chain information from an interoperable address.
 *
 * @example
 * ```ts
 * import { getChainFromInteropAddress } from '@/erc7930'
 *
 * getChainFromInteropAddress('0x0001000001011234567890abcdef')
 * // { namespace: 'eip155', id: '1' }
 * ```
 *
 * @param address - Interoperable address
 * @param format - Format of the address
 * @returns Chain information
 */
export function getChainFromInteropAddress(
  address: string,
  format: AddressFormat = 'hex'
): { namespace: string; id: string } | null {
  try {
    const parsed = parseInteropAddress(address, format)
    return {
      namespace: parsed.chainNamespace,
      id: parsed.chainId
    }
  } catch {
    return null
  }
}

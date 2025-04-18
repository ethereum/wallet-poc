import { fromHex } from 'viem'
import { parseInteropAddress } from './parseInteropAddress'
import { AddressFormat, AddressFormatType } from './types'
import { validateAddressFormat } from './validateAddressFormat'

/**
 * Extracts chain information from an hex interoperable address.
 *
 * @example
 * ```ts
 * import { getChainFromInteropAddress } from './erc7930'
 *
 * getChainFromInteropAddress('0x00010000010114D8DA6BF26964AF9D7EED9E03E53415D37AA96045')
 * // { namespace: 'eip155', chainReference: '1' }
 * ```
 *
 * @param address - Interoperable address
 * @param format - Format of the address
 * @returns Chain information
 */
export function getChainFromInteropAddress(
  address: string,
  format: AddressFormat = 'hex'
): { namespace: string; chainReference: string } | null {
  try {
    const parsed = parseInteropAddress(address, format)
    if (parsed.chainNamespace === 'eip155') {
      return {
        namespace: parsed.chainNamespace,
        chainReference: fromHex(
          (parsed.chainReference as `0x${string}`) ?? '0x00',
          'number'
        ).toString()
      }
    }

    return {
      namespace: parsed.chainNamespace ?? '',
      chainReference: parsed.chainReference ?? ''
    }
  } catch {
    return null
  }
}

/**
 * Extracts chain information from a human-readable interoperable address.
 *
 * @example
 * ```ts
 * import { getChainFromHumanAddress } from './erc7930'
 *
 * getChainFromHumanAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C')
 * // { namespace: 'eip155', chainReference: '1' }
 * ```
 *
 * @param humanAddress - Human-readable interoperable address
 * @returns Chain information
 */
export function getChainFromHumanAddress(
  humanAddress: string
): { namespace: string; chainReference: string } | null {
  const parsed = validateAddressFormat(humanAddress)

  if (parsed.type === AddressFormatType.INTEROP_HUMAN) {
    if (parsed.details?.chainNamespace === 'eip155') {
      return {
        namespace: parsed.details?.chainNamespace,
        // Assert type for fromHex compatibility
        chainReference: fromHex(
          (parsed.details?.chainReference as `0x${string}` | undefined) ?? '0x00',
          'number'
        ).toString()
      }
    }
  }
  return null
}

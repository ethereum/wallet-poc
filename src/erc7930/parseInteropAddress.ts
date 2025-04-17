import bs58 from 'bs58'
import { fromBytes, fromHex } from 'viem'
import { AddressFormat, CHAIN_NAMESPACES, ParsedInteroperableAddress } from './types'

/**
 * Converts an address from the specified format to bytes.
 *
 * @param address - The address to convert
 * @param format - Format of the input address ('hex' or 'base58')
 * @returns Address as a Uint8Array
 */
function convertToBytes(address: Uint8Array | string, format: AddressFormat): Uint8Array {
  if (address instanceof Uint8Array) return address

  if (format === 'hex') return fromHex(address as `0x${string}`, 'bytes')
  if (format === 'base58') return bs58.decode(address)
  if (format === 'base64') {
    const binaryString = atob(address)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  throw new Error(`Unsupported address format: ${format}`)
}

/**
 * Parses an Interoperable Address into its components.
 *
 * @example
 * ```ts
 * import { parseInteroperableAddress } from '@/erc7930'
 *
 * parseInteroperableAddress('0x0001000001011234567890abcdef', 'hex')
 * // {
 * //   version: '0001',
 * //   chainIdLength: 1,
 * //   chainId: '01',
 * //   chainType: '0000',
 * //   addressLength: 10,
 * //   address: '1234567890abcdef',
 * //   chainNamespace: 'eip155'
 * // }
 * ```
 *
 * @param serializedAddress - Interoperable Address in the specified format
 * @param format - Format of the input address ('hex' or 'base58')
 * @returns Parsed components of the Interoperable Address
 */
export function parseInteropAddress(
  serializedAddress: Uint8Array | string,
  format: AddressFormat = 'hex'
): ParsedInteroperableAddress {
  // Convert the address to bytes based on the format
  const bytes = convertToBytes(serializedAddress, format)
  let offset = 0

  // Parse version (2 bytes)
  const version = fromBytes(bytes.slice(offset, offset + 2), 'hex')
  offset += 2

  // Parse chainType (2 bytes)
  const chainType = fromBytes(bytes.slice(offset, offset + 2), 'hex')
  offset += 2

  // Parse chainIdLength
  const chainIdLength = fromBytes(bytes.slice(offset, offset + 1), 'hex')
  const chainIdLengthNumber = parseInt(chainIdLength, 16)
  offset += 1

  // Parse chainId
  const chainId = fromBytes(bytes.slice(offset, offset + chainIdLengthNumber), 'hex')
  offset += chainIdLengthNumber

  // Parse addressLength (1 byte)
  const addressLength = fromBytes(bytes.slice(offset, offset + 1), 'hex')
  const addressLengthNumber = parseInt(addressLength, 16)
  offset += 1

  // Parse address
  const address = fromBytes(bytes.slice(offset, offset + addressLengthNumber), 'hex')

  return {
    version,
    chainIdLength: parseInt(chainIdLength, 16),
    chainId,
    chainType,
    addressLength: parseInt(addressLength, 16),
    address,
    chainNamespace: CHAIN_NAMESPACES[chainType.slice(2)] || chainType
  }
}

import { parseInteropAddress } from './parseInteropAddress'
import { AddressFormatResult, AddressFormatType } from './types'
import { validateChecksum } from './validateChecksum'

/**
 * Validates and identifies the format of an address string.
 *
 * Detects and validates various address formats including EVM, ENS, and interoperable formats.
 *
 * @example
 * ```ts
 * import { validateAddressFormat } from '@/erc7930'
 *
 * validateAddressFormat('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')
 * // {
 * //   data: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
 * //   type: AddressFormatType.EVM,
 * //   isValid: true
 * // }
 *
 * validateAddressFormat('0x0001000001011234567890abcdef')
 * // {
 * //   data: '0x0001000001011234567890abcdef',
 * //   type: AddressFormatType.INTEROP_HEX,
 * //   isValid: true,
 * //   details: { ... }
 * // }
 *
 * validateAddressFormat('user.eth')
 * // {
 * //   data: 'user.eth',
 * //   type: AddressFormatType.ENS,
 * //   isValid: true
 * // }
 * ```
 *
 * @param address - The address string to validate
 * @returns The validation result containing the original address and its identified format
 */
export function validateAddressFormat(address: string): AddressFormatResult {
  // Handle empty or invalid input
  if (!address || typeof address !== 'string') {
    return {
      data: address || '',
      type: AddressFormatType.UNKNOWN,
      isValid: false
    }
  }

  // Trim whitespace
  const trimmedAddress = address.trim()

  // TODO: Add support for ENS domains
  // Check for ENS domains
  if (
    /^([a-z0-9-]+\.)+eth$/i.test(trimmedAddress) ||
    /^([a-z0-9-]+\.)+xyz$/i.test(trimmedAddress) ||
    /^([a-z0-9-]+\.)+id$/i.test(trimmedAddress) ||
    /^([a-z0-9-]+\.)+crypto$/i.test(trimmedAddress) ||
    /^([a-z0-9-]+\.)+cb\.id$/i.test(trimmedAddress)
  ) {
    return {
      data: trimmedAddress,
      type: AddressFormatType.ENS,
      isValid: true
    }
  }

  // Check for human-readable interoperable address format: <account>@<chain>#<checksum>
  // Both account and chain parts are optional
  const INTEROP_HUMAN_REGEX = /^([a-zA-Z0-9]*)@([a-zA-Z0-9]*:?[a-zA-Z0-9]*)?#([A-F0-9]{8})$/
  const interopHumanMatch = trimmedAddress.match(INTEROP_HUMAN_REGEX)
  const isValidChecksum = validateChecksum(trimmedAddress)

  if (interopHumanMatch && isValidChecksum) {
    const [, accountPart, chainPart] = interopHumanMatch

    // If chainPart has a colon, extract namespace, otherwise use empty string
    const chainNamespace = chainPart && chainPart.includes(':') ? chainPart.split(':')[0] : ''
    const chainReference = chainPart && chainPart.includes(':') ? chainPart.split(':')[1] : ''
    return {
      data: trimmedAddress,
      type: AddressFormatType.INTEROP_HUMAN,
      isValid: true,
      details: {
        address: accountPart || '',
        chainNamespace,
        version: '1', // Assume version 1 for human-readable format
        chainReferenceLength: 0,
        chainReference,
        chainType: chainPart || '',
        addressLength: accountPart ? accountPart.length : 0
      }
    }
  }

  // Try to detect EVM address format
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress) && trimmedAddress.slice(2, 6) === '0001') {
    return {
      data: trimmedAddress,
      type: AddressFormatType.EVM,
      isValid: true
    }
  }

  // Try to detect interoperable address format
  // First try hex format (most common and easy to detect)
  if (/^0x[a-fA-F0-9]+$/.test(trimmedAddress)) {
    // Try to parse as an interoperable address
    try {
      const parsed = parseInteropAddress(trimmedAddress, 'hex')
      if (parsed && parsed.version) {
        return {
          data: trimmedAddress,
          type: AddressFormatType.INTEROP_HEX,
          isValid: true,
          details: {
            ...parsed
          }
        }
      }
    } catch (error) {
      // Not a valid interoperable address in hex format
      console.debug('Not a valid interoperable address in hex format:', error)
    }
  }

  // Try base58 format for interoperable address
  // Base58 uses characters from the ALPHABET (123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz)
  const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/
  if (BASE58_REGEX.test(trimmedAddress)) {
    try {
      const parsed = parseInteropAddress(trimmedAddress, 'base58')
      if (parsed && parsed.version) {
        return {
          data: trimmedAddress,
          type: AddressFormatType.INTEROP_BASE58,
          isValid: true,
          details: {
            ...parsed
          }
        }
      }
    } catch (error) {
      // Not a valid interoperable address in base58 format
      console.debug('Not a valid interoperable address in base58 format:', error)
    }
  }

  // Try base64 format for interoperable address
  // Base64 uses A-Z, a-z, 0-9, +, /, and sometimes ends with =
  const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/
  if (BASE64_REGEX.test(trimmedAddress)) {
    try {
      // Convert base64 to Uint8Array
      const binaryString = atob(trimmedAddress)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Parse the bytes directly
      const parsed = parseInteropAddress(bytes, 'hex')

      if (parsed && parsed.version) {
        return {
          data: trimmedAddress,
          type: AddressFormatType.INTEROP_BASE64,
          isValid: true,
          details: {
            ...parsed
          }
        }
      }
    } catch (error) {
      // Not a valid interoperable address in base64 format
      console.debug('Not a valid interoperable address in base64 format:', error)
    }
  }

  // If no format matched, return unknown
  return {
    data: trimmedAddress,
    type: AddressFormatType.UNKNOWN,
    isValid: false
  }
}

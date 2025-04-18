import { humanToInteropAddress } from './humanToInteropAddress'
import { calculateChecksum } from './calculateChecksum'

/**
 * Validates if the checksum in a human-readable ERC7930 address is correct.
 *
 * @example
 * ```ts
 * import { validateChecksum } from '@/erc7930'
 *
 * validateChecksum('0x71C7656EC7ab88b098defB751B7401B5f6d8976F@eip155:1#4CA88C9C')
 * // true
 *
 * validateChecksum('0x71C7656EC7ab88b098defB751B7401B5f6d8976F@eip155:1#INVALID')
 * // false
 * ```
 *
 * @param humanAddress - The human-readable interoperable address to validate
 * @returns boolean indicating if the checksum is valid
 */
export function validateChecksum(humanAddress: string): boolean {
  if (!humanAddress || typeof humanAddress !== 'string') {
    return false
  }

  // Validate and parse the human-readable address
  const INTEROP_HUMAN_REGEX = /^([a-zA-Z0-9]*)@([a-zA-Z0-9]*:?[a-zA-Z0-9]*)?#([A-F0-9]{8})$/
  const interopHumanMatch = humanAddress.match(INTEROP_HUMAN_REGEX)

  if (!interopHumanMatch) {
    return false
  }

  const [, , , providedChecksum] = interopHumanMatch

  try {
    // Create a temporary human interop address with a placeholder checksum
    const tempHumanAddress = humanAddress.replace(/#[A-F0-9]{8}$/, '#00000000')

    // Convert to hex interop address format
    const hexInterop = humanToInteropAddress(tempHumanAddress)

    // Calculate the expected checksum from the address data (without version)
    const expectedChecksum = calculateChecksum(`0x${hexInterop.slice(6)}`)

    // Compare the provided checksum with the expected checksum
    return providedChecksum === expectedChecksum
  } catch (error) {
    return false
  }
}

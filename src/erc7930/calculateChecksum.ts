import { Hex, keccak256 } from 'viem'

/**
 * Calculates the checksum for an Interoperable Address.
 * The checksum is the first 4 bytes of the keccak256 hash of the address data (without version).
 *
 * @example
 * ```ts
 * import { calculateChecksum } from '@/erc7930'
 *
 * calculateChecksum('0x00000201020304')
 * // '1A2B3C4D'
 * ```
 *
 * @param addressData - The address data to calculate the checksum for (without version)
 * @returns The 4-byte checksum as an uppercase hex string
 */
export function calculateChecksum(addressData: Hex): string {
  const hash = keccak256(addressData)

  // Take first 4 bytes and convert to uppercase hex
  return hash.slice(2, 10).toUpperCase()
}

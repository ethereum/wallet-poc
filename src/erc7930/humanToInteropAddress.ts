/**
 * Convert human-readable interoperable addresses to hex format
 */
import bs58 from 'bs58'

/**
 * Converts a human-readable interoperable address to a hex interoperable address.
 *
 * Transforms input format `<account>@<chain>#<checksum>` or variations
 * to output format `0x<version><chainType><chainIdLength><chainId><addressLength><address>`
 *
 * @example
 * ```ts
 * import { humanToInteropAddress } from '@/erc7930'
 *
 * humanToInteropAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F@eip155:1#12345678')
 * // '0x00010000010171c7656ec7ab88b098defb751b7401b5f6d8976f'
 * ```
 *
 * @param humanAddress - Human-readable interoperable address
 * @returns Hex interoperable address string or null if invalid
 */
export function humanToInteropAddress(humanAddress: string, version: string = '1'): string {
  if (!humanAddress || typeof humanAddress !== 'string') {
    throw new Error('Invalid human address')
  }

  // Validate and parse the human-readable address
  const INTEROP_HUMAN_REGEX = /^([a-zA-Z0-9]*)@([a-zA-Z0-9]*:?[a-zA-Z0-9]*)?#([A-F0-9]{8})$/
  const interopHumanMatch = humanAddress.match(INTEROP_HUMAN_REGEX)

  if (!interopHumanMatch) {
    throw new Error('Invalid human address')
  }
  const [, address, chainPart] = interopHumanMatch

  const chainNamespace = chainPart && chainPart.includes(':') ? chainPart.split(':')[0] : ''
  const chainId = chainPart && chainPart.includes(':') ? chainPart.split(':')[1] : ''

  let addressHex: string
  let chainIdHex: string
  let chainTypeHex: string

  // Format address based on chain namespace
  if (chainNamespace === 'eip155') {
    // For EVM addresses
    addressHex =
      address && address.startsWith('0x')
        ? address.slice(2).toLowerCase()
        : (address || '').toLowerCase()
    chainTypeHex = '0000' // eip155 chain type

    // Convert chain ID to hex if it exists, otherwise use empty
    chainIdHex = chainId ? parseInt(chainId, 10).toString(16).padStart(2, '0') : ''
  } else if (chainNamespace === 'solana') {
    // For Solana addresses
    try {
      // If address is already in base58 format and not empty
      if (address) {
        const addressBytes = bs58.decode(address)
        addressHex = Buffer.from(addressBytes).toString('hex')
      } else {
        addressHex = ''
      }
    } catch {
      // If not in base58, use as is
      addressHex =
        address && address.startsWith('0x')
          ? address.slice(2).toLowerCase()
          : (address || '').toLowerCase()
    }
    chainTypeHex = '0002' // solana chain type

    // Handle Solana chain ID
    if (chainId) {
      try {
        const chainIdBytes = bs58.decode(chainId)
        chainIdHex = Buffer.from(chainIdBytes).toString('hex')
      } catch {
        chainIdHex = chainId
      }
    } else {
      chainIdHex = ''
    }
  } else {
    // For other chains, use raw values
    addressHex = address.startsWith('0x') ? address.slice(2).toLowerCase() : address.toLowerCase()
    // TODO: Add support for other chains
    chainTypeHex = '0000'
    chainIdHex = chainId || ''
  }

  // Calculate lengths
  const chainIdLength = (chainIdHex.length / 2).toString(16).padStart(2, '0')
  const addressLength = (addressHex.length / 2).toString(16).padStart(2, '0')

  const curatedChainIndex = chainIdLength === '00' ? '' : chainIdHex

  const versionHex = parseInt(version, 10).toString(16).padStart(4, '0')
  // Assemble the interoperable address
  const interopAddress = `0x${versionHex}${chainTypeHex}${chainIdLength}${curatedChainIndex}${addressLength}${addressHex}`

  return interopAddress.toLowerCase()
}

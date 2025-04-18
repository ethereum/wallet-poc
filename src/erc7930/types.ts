/**
 * Known chain namespaces and their human-readable representation.
 *
 * Maps chain type hex codes to their human-readable namespace names.
 */
export const CHAIN_NAMESPACES: Record<string, string> = {
  '0000': 'eip155',
  '0002': 'solana'
}

/**
 * Supported formats for Interoperable Address input.
 */
export type AddressFormat = 'hex' | 'base58' | 'base64'

/**
 * Parsed components of an Interoperable Address.
 *
 * Contains all the decoded elements of an interoperable address.
 */
export interface ParsedInteroperableAddress {
  version: string
  chainReferenceLength: number
  chainReference: string
  chainType: string
  addressLength: number
  address: string
  chainNamespace: string
}

/**
 * Address format type identifiers.
 *
 * Enum of supported address format types for validation and identification.
 */
export enum AddressFormatType {
  EVM = 'evm', // Ethereum/EVM address (0x...)
  SOLANA = 'solana', // Solana address (base58)
  BITCOIN = 'bitcoin', // Bitcoin address (base58)
  ENS = 'ens', // ENS domain (.eth, .xyz, etc.)
  INTEROP_HEX = 'interop_hex', // Interoperable address in hex format
  INTEROP_BASE58 = 'interop_base58', // Interoperable address in base58 format
  INTEROP_BASE64 = 'interop_base64', // Interoperable address in base64 format
  INTEROP_HUMAN = 'interop_human', // Human-readable interoperable address (<account>@<chain>#<checksum>)
  UNKNOWN = 'unknown' // Unknown format
}

/**
 * Result of address format validation.
 *
 * Contains validation results including original data, format type, validity, and optional parsed details.
 */
export interface AddressFormatResult {
  data: string // The original address string
  type: AddressFormatType // The identified format type
  isValid: boolean // Whether the address is valid in its format
  details?: ParsedInteroperableAddress
}

import { validateChecksum } from '../validateChecksum'

describe('validateChecksum', () => {
  it('should return true for valid checksums', () => {
    // Example address with valid checksum
    const validAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C'
    expect(validateChecksum(validAddress)).toBe(true)
  })

  it('should return false for invalid checksums', () => {
    // Same address with incorrect checksum
    const invalidAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#ABCDEF12'
    expect(validateChecksum(invalidAddress)).toBe(false)
  })

  it('should return false for malformed addresses', () => {
    // Malformed address (missing @ symbol)
    const malformedAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045eip155:1#4CA88C9C'
    expect(validateChecksum(malformedAddress)).toBe(false)

    // Malformed address (missing # symbol)
    const malformedAddress2 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:14CA88C9C'
    expect(validateChecksum(malformedAddress2)).toBe(false)
  })

  it('should return false for invalid checksum format', () => {
    // Invalid checksum format (too short)
    const invalidChecksumFormat = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA8'
    expect(validateChecksum(invalidChecksumFormat)).toBe(false)

    // Invalid checksum format (non-hex characters)
    const invalidChecksumChars = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#ZZZZXXXX'
    expect(validateChecksum(invalidChecksumChars)).toBe(false)
  })

  it('should return false for empty or non-string inputs', () => {
    expect(validateChecksum('')).toBe(false)
    expect(validateChecksum(null as any)).toBe(false)
    expect(validateChecksum(undefined as any)).toBe(false)
  })

  it('should handle addresses without chain part correctly', () => {
    // Address with only the account part and checksum
    const noChainAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@#B26DB7CB'
    // This should be a valid checksum that matches the address without chain
    expect(validateChecksum(noChainAddress)).toBe(true)
  })

  it('should handle addresses without account part correctly', () => {
    // Address with only the chain part and checksum
    const noAccountAddress = '@eip155:1#F54D4FBF'
    // This should be a valid checksum that matches the chain without account
    expect(validateChecksum(noAccountAddress)).toBe(true)
  })
})

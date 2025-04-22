import { getChainFromInteropAddress, getChainFromHumanAddress } from '../getChain'

describe('getChain functions', () => {
  describe('getChainFromInteropAddress', () => {
    it('should extract chain information from a valid hex interoperable address', () => {
      // Interoperable address for Ethereum mainnet with a dummy account
      const hexAddress = '0x00010000010114D8DA6BF26964AF9D7EED9E03E53415D37AA96045'

      const result = getChainFromInteropAddress(hexAddress)

      expect(result).toEqual({
        namespace: 'eip155',
        chainReference: '1'
      })
    })

    it('should return null for invalid interoperable addresses', () => {
      // Invalid address that will cause parseInteropAddress to throw
      const invalidAddress = '0xINVALID'

      const result = getChainFromInteropAddress(invalidAddress)

      expect(result).toBeNull()
    })
  })

  describe('getChainFromHumanAddress', () => {
    it('should extract chain information from a valid human-readable address', () => {
      // Valid human-readable address with chain info
      const humanAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C'

      const result = getChainFromHumanAddress(humanAddress)

      expect(result).toEqual({
        namespace: 'eip155',
        chainReference: '1'
      })
    })

    it('should return null for addresses without chain information', () => {
      // Human-readable address with no chain part
      const noChainAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@#4CA88C9C'

      const result = getChainFromHumanAddress(noChainAddress)

      expect(result).toBeNull()
    })

    it('should return null for invalid human-readable addresses', () => {
      // Invalid human-readable address format
      const invalidAddress = 'not-an-address'

      const result = getChainFromHumanAddress(invalidAddress)

      expect(result).toBeNull()
    })
  })
})

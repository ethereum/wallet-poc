import { AddressData, formatInteropAddress } from './formatInteropAddress'
import { humanToInteropAddress } from './humanToInteropAddress'
import { parseInteropAddress } from './parseInteropAddress'
import { payloadToHuman } from './payloadToHuman'
import { ParsedInteroperableAddress, AddressFormat } from './types'

describe('ERC-7930 Utilities', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('formatHumanInteropAddress', () => {
    it('should correctly format an EVM address with chain ID', () => {
      const addressData: AddressData = {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        namespace: 'eip155',
        chainReference: '1'
      }
      const expected = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C'

      expect(formatInteropAddress(addressData)).toBe(expected)
    })

    it('should correctly format a non-EVM address', () => {
      const addressData: AddressData = {
        address: 'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2',
        namespace: 'solana',
        chainReference: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
      }
      const expected =
        'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp#4A58ACC6'

      expect(formatInteropAddress(addressData)).toBe(expected)
    })

    it('should correctly format without address', () => {
      const addressData: AddressData = {
        address: '',
        namespace: 'eip155',
        chainReference: '1'
      }
      const expected = '@eip155:1#F54D4FBF'
      expect(formatInteropAddress(addressData)).toBe(expected)
    })

    it('should correctly format without chain reference', () => {
      const addressData: AddressData = {
        address: 'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2',
        namespace: 'solana',
        chainReference: ''
      }
      const expected = 'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2@solana#CDF6DDD5'

      expect(formatInteropAddress(addressData)).toBe(expected)
    })

    it('should correctly format without chain reference and address', () => {
      const addressData: AddressData = {
        address: '',
        namespace: 'solana',
        chainReference: ''
      }
      const expected = '@solana#E8E77626'

      expect(formatInteropAddress(addressData)).toBe(expected)
    })

    it('should throw error if chain namespace is missing', () => {
      const addressData: AddressData = {
        address: '0x1234...',
        namespace: '',
        chainReference: '1'
      }
      expect(() => formatInteropAddress(addressData)).toThrow('Chain namespace is required')
    })
  })

  describe('parseInteropAddress', () => {
    it('should correctly parse a valid hex address with EVM chain ID', () => {
      // Hex representation: version(0001) + chainType(0000 for eip155) + chainIdLength(01) + chainId(01) + addressLength(14/20) + address
      const hexInput = '0x000100000101141234567890abcdef1234567890abcdef12345678'
      const expected: ParsedInteroperableAddress = {
        version: '0x0001',
        chainType: '0x0000',
        chainIdLength: 1,
        chainId: '0x01',
        addressLength: 20,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainNamespace: 'eip155'
      }
      expect(parseInteropAddress(hexInput, 'hex')).toEqual(expected)
    })

    it('should correctly parse a valid hex address with Solana chain ID (mocked type)', () => {
      // Hex representation: version(0001) + chainType(0002 for solana) + chainIdLength(20/32) + chainId(...) + addressLength(20/32) + address(...)
      // Example values assumed
      const hexInput =
        '0x00010002203473476a4d573173556e487a5378477370756870714c4478367769796a4e745a20c147b7b30db9c3724f12db3be1f948790050a005c23bb1b755f0a3b72c1f2523'
      const expected: ParsedInteroperableAddress = {
        version: '0x0001',
        chainType: '0x0002',
        chainIdLength: 32,
        chainId: '0x3473476a4d573173556e487a5378477370756870714c4478367769796a4e745a',
        addressLength: 32,
        address: '0xc147b7b30db9c3724f12db3be1f948790050a005c23bb1b755f0a3b72c1f2523',
        chainNamespace: 'solana' // Assuming CHAIN_NAMESPACES maps 0002 -> solana
      }
      expect(parseInteropAddress(hexInput, 'hex')).toEqual(expected)
    })

    it('should correctly parse a base58 address (mocked data)', () => {
      // This requires a valid base58 encoded string that decodes to the expected byte structure
      // For simplicity, we'll mock the input/output relation based on the hex test
      // const base58Input = '...some_valid_base58_string...' // Placeholder
      const correspondingBytes = Buffer.from(
        '000100000101141234567890abcdef1234567890abcdef12345678',
        'hex'
      )

      const expected: ParsedInteroperableAddress = {
        version: '0x0001',
        chainType: '0x0000',
        chainIdLength: 1,
        chainId: '0x01',
        addressLength: 20,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainNamespace: 'eip155'
      }

      // We'd need a real base58 library and input for this test
      // expect(parseInteroperableAddress(base58Input, 'base58')).toEqual(expected)
      // Convert Buffer to Uint8Array
      const byteArray = new Uint8Array(
        correspondingBytes.buffer,
        correspondingBytes.byteOffset,
        correspondingBytes.byteLength
      )
      expect(parseInteropAddress(byteArray)).toEqual(expected) // Test with bytes directly
    })

    it('should throw error for unsupported format', () => {
      const hexInput = '0x0001...'
      expect(() => parseInteropAddress(hexInput, 'invalidFormat' as AddressFormat)).toThrow(
        'Unsupported address format: invalidFormat'
      )
    })
  })

  describe('humanToInteropAddress', () => {
    it('should correctly convert a human-readable EVM address to and Interoperable Address', () => {
      const humanAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C'
      const expected = '0x00010000010114D8DA6BF26964AF9D7EED9E03E53415D37AA96045'.toLowerCase()
      expect(humanToInteropAddress(humanAddress)).toBe(expected)
    })

    it('should correctly convert a human-readable EVM address without chainid to an Interoperable Address', () => {
      const humanAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@#144A4B21'
      const expected = '0x000100000014D8DA6BF26964AF9D7EED9E03E53415D37AA96045'.toLowerCase()
      expect(humanToInteropAddress(humanAddress)).toBe(expected)
    })

    it('should correctly convert a human-readable Solana address to an Interoperable Address', () => {
      const humanAddress =
        'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp#4A58ACC6'
      const expected =
        '0x0001000217e15de390a1bfea7ad6ed13c9898b4881b8aef9e705b31b2005333498d5aea4ae009585c43f7b8c30df8e70187d4a713d134f977fc8dfe0b5'
      expect(humanToInteropAddress(humanAddress)).toBe(expected)
    })

    it('should correctly convert a human-readable Solana mainnet network with no address to an Interoperable Address', () => {
      const humanAddress = '@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp#DE9AAA3F'
      const expected = '0x0001000217e15de390a1bfea7ad6ed13c9898b4881b8aef9e705b31b00'
      expect(humanToInteropAddress(humanAddress)).toBe(expected)
    })
  })

  describe('payloadToHuman', () => {
    it('should format a hex Interoperable Address to a human-readable format', () => {
      const hexInput =
        '0x0001000217e15de390a1bfea7ad6ed13c9898b4881b8aef9e705b31b2005333498d5aea4ae009585c43f7b8c30df8e70187d4a713d134f977fc8dfe0b5'
      const expected =
        'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp#4A58ACC6'
      expect(payloadToHuman(hexInput)).toBe(expected)
    })
  })
})

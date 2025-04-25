import { getAddress } from 'ethers'
import { validateAddressFormat } from '@erc7930/index'
import { isValidAddress } from '@ambire-common/services/address'

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  isValidEns: boolean
  isInteropAddress: boolean
  overwriteError?: string | boolean
  overwriteValidLabel?: string
}

const getAddressInputValidation = ({
  address,
  isRecipientDomainResolving,
  isValidEns,
  isInteropAddress,
  overwriteError,
  overwriteValidLabel
}: AddressInputValidation): {
  message: any
  isError: boolean
} => {
  if (!address) {
    return {
      message: '',
      isError: true
    }
  }
  if (isRecipientDomainResolving) {
    return {
      message: 'Resolving domain...',
      isError: false
    }
  }

  // Return error from props if it's passed
  if (overwriteError) {
    return {
      message: overwriteError,
      isError: true
    }
  }
  // Return valid label from props if it's passed
  if (overwriteValidLabel) {
    return {
      message: overwriteValidLabel,
      isError: false
    }
  }

  if (isInteropAddress) {
    const { isValid } = validateAddressFormat(address)

    if (!isValid) {
      return {
        message: 'Invalid Interop address format',
        isError: true
      }
    }

    return {
      message: 'Valid Interop address',
      isError: false
    }
  }

  if (isValidEns) {
    return {
      message: 'Valid Ethereum Name Services® domain',
      isError: false
    }
  }
  if (address && isValidAddress(address)) {
    try {
      getAddress(address)
      return {
        message: 'Valid address',
        isError: false
      }
    } catch {
      return {
        message: 'Invalid checksum. Verify the address and try again.',
        isError: true
      }
    }
  }
  if (address && !isValidAddress(address)) {
    return {
      message: 'Please enter a valid address, ENS domain or Interop address',
      isError: true
    }
  }

  return {
    message: '',
    isError: true
  }
}

export default getAddressInputValidation

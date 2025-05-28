import { getAddress } from 'ethers'
import { isValidAddress } from '@ambire-common/services/address'
import { testnetNetworks } from '@ambire-common/consts/testnetNetworks'
import { getInteropAddressChainId } from '@web/modules/intent/utils/interopSdkService'

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  isValidEns: boolean
  isInteropAddress: boolean
  overwriteError?: string | boolean
  overwriteValidLabel?: string
}

const getAddressInputValidation = async ({
  address,
  isRecipientDomainResolving,
  isValidEns,
  isInteropAddress,
  overwriteError,
  overwriteValidLabel
}: AddressInputValidation): Promise<{
  message: any
  isError: boolean
}> => {
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
    try {
      const chainId = await getInteropAddressChainId(address)
      const isSupportedChain = testnetNetworks.find(
        (network) => Number(network.chainId) === chainId
      )

      if (!isSupportedChain) {
        return {
          message: 'Unsupported chain',
          isError: true
        }
      }

      return {
        message: 'Valid interop address',
        isError: false
      }
    } catch {
      return {
        message: 'Invalid interop address',
        isError: true
      }
    }
  }

  if (isValidEns) {
    return {
      message: 'Valid ENS domain',
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
      message: 'Please enter a valid address, ENS domain, or interop address.',
      isError: true
    }
  }

  return {
    message: '',
    isError: true
  }
}

export default getAddressInputValidation

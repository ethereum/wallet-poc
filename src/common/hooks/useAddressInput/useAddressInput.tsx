import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddressState, AddressStateOptional } from '@temp/domains'
import { resolveENSDomain } from '@ambire-common/services/ensDomains'
import { ToastOptions } from '@common/contexts/toastContext'

import getAddressInputValidation from './utils/validation'

interface Props {
  addressState: AddressState
  setAddressState: (newState: AddressStateOptional) => void
  overwriteError?: string
  overwriteValidLabel?: string
  addToast: (message: string, options?: ToastOptions) => void
  handleCacheResolvedDomain: (address: string, domain: string, type: 'ens') => void
  // handleRevalidate is required when the address input is used
  // together with react-hook-form. It is used to trigger the revalidation of the input.
  // !!! Must be memoized with useCallback
  handleRevalidate?: () => void
}

const useAddressInput = ({
  addressState,
  setAddressState,
  overwriteError,
  overwriteValidLabel,
  addToast,
  handleCacheResolvedDomain,
  handleRevalidate
}: Props) => {
  const fieldValueRef = useRef(addressState.fieldValue)
  const fieldValue = addressState.fieldValue
  const [debouncedValidation, setDebouncedValidation] = useState({
    isError: true,
    message: ''
  })

  const validation = useMemo(
    () =>
      getAddressInputValidation({
        address: addressState.fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        isValidEns: !!addressState.ensAddress,
        isInteropAddress: !!addressState.interopAddress,
        overwriteError,
        overwriteValidLabel
      }),
    [
      addressState.fieldValue,
      addressState.isDomainResolving,
      addressState.ensAddress,
      addressState.interopAddress,
      overwriteError,
      overwriteValidLabel
    ]
  )

  const resolveDomains = useCallback(
    (trimmedAddress: string) => {
      let ensAddress = ''

      // Keep the promise all as we may add more domain resolvers in the future
      Promise.all([
        resolveENSDomain(trimmedAddress)
          .then((newEnsAddress: string) => {
            ensAddress = newEnsAddress

            if (ensAddress) {
              handleCacheResolvedDomain(ensAddress, fieldValue, 'ens')
            }
          })
          .catch(() => {
            ensAddress = ''
            addToast('Something went wrong while resolving Ethereum Name Services® domain.', {
              type: 'error'
            })
          })
      ])
        .catch(() => {
          ensAddress = ''
          addToast('Something went wrong while resolving domain.', { type: 'error' })
        })
        .finally(() => {
          // The promises may resolve after the component is unmounted.
          if (fieldValueRef.current !== fieldValue) return

          setAddressState({
            ensAddress,
            isDomainResolving: false
          })
        })
    },
    [addToast, handleCacheResolvedDomain, fieldValue, setAddressState]
  )

  const canBeInteropAddress = (address: string): boolean => {
    // Format: <address>@<namespace>:<chainId>#<checksum>
    const pattern = /^0x[a-fA-F0-9]{40}@[^:#]+:[^#]+#[a-fA-F0-9]+$/
    return pattern.test(address)
  }

  useEffect(() => {
    const { isError, message: latestMessage } = validation
    const { isError: debouncedIsError, message: debouncedMessage } = debouncedValidation

    if (latestMessage === debouncedMessage) return

    const shouldDebounce =
      // Both validations are errors
      isError === debouncedIsError &&
      // There is no ENS address or Interop address
      !addressState.ensAddress &&
      !addressState.interopAddress &&
      // The message is not empty
      latestMessage

    // If debouncing is not required, instantly update
    if (!shouldDebounce) {
      setDebouncedValidation(validation)
      return
    }

    const timeout = setTimeout(() => {
      setDebouncedValidation(validation)
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    addressState.ensAddress,
    addressState.interopAddress,
    debouncedValidation,
    debouncedValidation.isError,
    debouncedValidation.message,
    validation
  ])

  useEffect(() => {
    const trimmedAddress = fieldValue.trim()

    // This logic should be refactored in the future
    // Interop address could have ens address
    // Workaround to avoid breaking the transfer build => addy.split('@')[0]
    if (canBeInteropAddress(trimmedAddress)) {
      setAddressState({
        ensAddress: '',
        interopAddress: trimmedAddress.split('@')[0],
        isDomainResolving: false
      })
      return
    }

    const dotIndexInAddress = trimmedAddress.indexOf('.')
    // There is a dot and it is not the first or last character
    const canBeDomain =
      dotIndexInAddress !== -1 &&
      dotIndexInAddress !== 0 &&
      dotIndexInAddress !== trimmedAddress.length - 1

    if (!trimmedAddress || !canBeDomain) {
      setAddressState({
        ensAddress: '',
        interopAddress: '',
        isDomainResolving: false
      })
      return
    }

    setAddressState({
      isDomainResolving: true
    })

    // Debounce domain resolving
    const timeout = setTimeout(() => {
      resolveDomains(trimmedAddress)
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [fieldValue, resolveDomains, setAddressState])

  useEffect(() => {
    fieldValueRef.current = addressState.fieldValue
  }, [addressState.fieldValue])

  useEffect(() => {
    if (!handleRevalidate) return

    handleRevalidate()
  }, [handleRevalidate, debouncedValidation])

  const reset = useCallback(() => {
    setAddressState({
      fieldValue: '',
      interopAddress: '',
      ensAddress: '',
      isDomainResolving: false
    })
  }, [setAddressState])

  const RHFValidate = useCallback(() => {
    // Disable the form if the address is not the same as the debounced address
    // This disables the submit button in the delay window
    if (validation.message !== debouncedValidation?.message) return false
    // Disable the form if there is an error
    if (debouncedValidation?.isError) return debouncedValidation.message

    if (addressState.isDomainResolving) return false

    return true
  }, [
    addressState.isDomainResolving,
    debouncedValidation?.isError,
    debouncedValidation.message,
    validation.message
  ])

  return {
    validation: debouncedValidation,
    RHFValidate,
    resetAddressInput: reset,
    address: addressState.ensAddress || fieldValue
  }
}

export default useAddressInput

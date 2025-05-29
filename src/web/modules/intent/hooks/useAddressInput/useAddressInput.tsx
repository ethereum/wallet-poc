import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  ExtendedAddressState,
  ExtendedAddressStateOptional
} from '@ambire-common/interfaces/interop'

import { ToastOptions } from '@common/contexts/toastContext'

import { resolveAddress } from '../../utils/resolvers'

import getAddressInputValidation from './utils/validation'

interface Props {
  addressState: ExtendedAddressState
  setAddressState: (newState: ExtendedAddressStateOptional, forceDispatch?: boolean) => void
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
  const [validation, setValidation] = useState({
    isError: true,
    message: ''
  })

  useEffect(() => {
    const validateAddress = async () => {
      const result = await getAddressInputValidation({
        address: addressState.fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        isValidEns: !!addressState.ensAddress,
        isInteropAddress: !!addressState.interopAddress,
        overwriteError,
        overwriteValidLabel
      })

      setValidation(result)
    }

    validateAddress()
  }, [
    addressState.fieldValue,
    addressState.isDomainResolving,
    addressState.ensAddress,
    addressState.interopAddress,
    overwriteError,
    overwriteValidLabel
  ])

  useEffect(() => {
    const { isError, message: latestMessage } = validation
    const { isError: debouncedIsError, message: debouncedMessage } = debouncedValidation

    if (latestMessage === debouncedMessage) return

    const shouldDebounce =
      // Both validations are errors
      isError === debouncedIsError &&
      // There is no ENS or Interop address
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

    if (!trimmedAddress) {
      setAddressState({
        ensAddress: '',
        interopAddress: '',
        isDomainResolving: false
      })
      return
    }

    // Debounce domain resolving
    const timeout = setTimeout(async () => {
      await resolveAddress(trimmedAddress, {
        fieldValue,
        handleCacheResolvedDomain,
        addToast,
        setAddressState
      })
    }, 300)

    return () => clearTimeout(timeout)
    // Do not add setAddressState as dependency due to infinte loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValue, handleCacheResolvedDomain, addToast])

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
      ensAddress: '',
      interopAddress: '',
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
    address: addressState.ensAddress || addressState.interopAddress || fieldValue
  }
}

export default useAddressInput

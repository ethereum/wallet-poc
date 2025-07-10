import { useCallback, useEffect, useRef, useState } from 'react'

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
  const [validation, setValidation] = useState({
    isError: true,
    message: ''
  })

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const result = await getAddressInputValidation({
        address: addressState.fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        // isValidEns: !!addressState.ensAddress,
        isInteropAddress: !!addressState.interopAddress,
        overwriteError,
        overwriteValidLabel
      })

      console.log('setting validation', result)
      setValidation(result)
    }, 500)

    return () => clearTimeout(timeout)
  }, [
    addressState.fieldValue,
    addressState.isDomainResolving,
    // addressState.ensAddress,
    addressState.interopAddress,
    overwriteError,
    overwriteValidLabel
  ])

  useEffect(() => {
    const trimmedAddress = fieldValue.trim()

    if (!trimmedAddress) {
      setAddressState({
        // ensAddress: '',
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
  }, [handleRevalidate])

  const reset = useCallback(() => {
    setAddressState({
      fieldValue: '',
      // ensAddress: '',
      interopAddress: '',
      isDomainResolving: false
    })
  }, [setAddressState])

  const RHFValidate = useCallback(() => {
    // Disable the form if there is an error
    if (validation.isError) return validation.message

    if (addressState.isDomainResolving) return false

    return true
  }, [addressState.isDomainResolving, validation.isError, validation.message])

  return {
    validation,
    RHFValidate,
    resetAddressInput: reset,
    address: /* addressState.ensAddress || */ addressState.interopAddress || fieldValue
  }
}

export default useAddressInput

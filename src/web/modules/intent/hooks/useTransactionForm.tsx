import { getTokenId } from '@web/utils/token'
import { getUiType } from '@web/utils/uiType'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import usePrevious from '@common/hooks/usePrevious'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { isEqual } from 'lodash'
import { SwapAndBridgeQuote } from '@ambire-common/interfaces/swapAndBridge'
import useAddressInput from './useAddressInput'
import { toTokenList } from '../utils/toTokenList'

type SessionId = ReturnType<typeof nanoid>

const useTransactionForm = () => {
  const { addToast } = useToast()
  const { isPopup, isActionWindow } = getUiType()
  const state = useTransactionControllerState()
  const { setSearchParams } = useNavigation()
  const { formState } = state
  const {
    fromAmount,
    fromAmountFieldMode,
    fromAmountInFiat,
    fromChainId,
    toChainId,
    portfolioTokenList,
    fromSelectedToken,
    toSelectedToken,
    addressState,
    isRecipientAddressUnknown,
    isRecipientAddressUnknownAgreed,
    supportedChainIds,
    maxFromAmount,
    switchTokensStatus
  } = formState

  // Temporary log
  console.log({ state })

  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  const [fromAmountValue, setFromAmountValue] = useState<string>(fromAmount)
  const prevFromAmount = usePrevious(fromAmount)
  const prevFromAmountInFiat = usePrevious(fromAmountInFiat)
  const sessionIdsRequestedToBeInit = useRef<SessionId[]>([])
  const sessionId = useMemo(() => {
    if (isPopup) return 'popup'
    if (isActionWindow) return 'action-window'

    return nanoid()
  }, []) // purposely, so it is unique per hook lifetime

  const {
    options: fromTokenOptions,
    value: fromTokenValue,
    amountSelectDisabled: fromTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: portfolioTokenList,
    token: fromSelectedToken ? getTokenId(fromSelectedToken, networks) : '',
    isLoading: false, // TODO: from the manager
    networks,
    supportedChainIds
  })

  const handleSubmitForm = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_BUILD_TRANSACTION_USER_REQUEST',
      params: {
        transactionType: 'intent'
      }
    })
  }, [dispatch])

  const onFromAmountChange = useCallback(
    (value: string) => {
      setFromAmountValue(value)
      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { fromAmount: value }
      })
    },
    [dispatch, setFromAmountValue]
  )

  const onRecipientAddressChange = useCallback(
    (value: string) => {
      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: {
          addressState: { fieldValue: value, ensAddress: '', isDomainResolving: false }
        }
      })
    },
    [dispatch]
  )

  const handleCacheResolvedDomain = useCallback(
    (address: string, domain: string, type: 'ens') => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP',
        params: {
          type,
          address,
          name: domain
        }
      })
    },
    [dispatch]
  )

  const setAddressState = useCallback(
    (newPartialAddressState: AddressStateOptional) => {
      // Merge the partial update with the current state to ensure a full AddressState object is dispatched
      const nextAddressState: AddressState = {
        fieldValue: newPartialAddressState.fieldValue ?? addressState.fieldValue,
        ensAddress: newPartialAddressState.ensAddress ?? addressState.ensAddress,
        isDomainResolving:
          newPartialAddressState.isDomainResolving ?? addressState.isDomainResolving
      }

      // Prevent dispatching if the state hasn't actually changed
      if (isEqual(addressState, nextAddressState)) return

      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { addressState: nextAddressState }
      })
    },
    [addressState, dispatch]
  )

  const addressInputState = useAddressInput({
    addressState,
    setAddressState,
    overwriteError:
      formState?.isInitialized && !formState.validationFormMsgs.recipientAddress.success
        ? formState.validationFormMsgs.recipientAddress.message
        : '',
    overwriteValidLabel: formState?.validationFormMsgs?.recipientAddress.success
      ? formState.validationFormMsgs.recipientAddress.message
      : '',
    addToast,
    handleCacheResolvedDomain
  })

  const fromTokenOptionsFiltered = useMemo(() => {
    return fromTokenOptions.filter((token: any) => supportedChainIds.includes(token.chainId))
  }, [fromTokenOptions, supportedChainIds])

  // Temporary while the SDK quote is implemented
  const quote = useMemo(() => {
    return {
      fromAsset: fromSelectedToken,
      fromChainId,
      toAsset: toSelectedToken,
      toChainId,
      selectedRouteSteps: [],
      routes: [],
      selectedRoute: {
        toAmount: fromAmount || '0'
      }
    } as unknown as SwapAndBridgeQuote
  }, [fromSelectedToken, toSelectedToken, fromChainId, toChainId, fromAmount])

  useEffect(() => {
    if (fromAmountFieldMode === 'token') setFromAmountValue(fromAmount)
    if (fromAmountFieldMode === 'fiat') setFromAmountValue(fromAmountInFiat)
  }, [fromAmountFieldMode, fromAmount, fromAmountInFiat, setFromAmountValue])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'token' &&
      prevFromAmount !== fromAmount &&
      fromAmount !== fromAmountValue
    ) {
      setFromAmountValue(fromAmount)
    }
  }, [fromAmount, fromAmountValue, prevFromAmount, fromAmountFieldMode])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'fiat' &&
      prevFromAmountInFiat !== fromAmountInFiat &&
      fromAmountInFiat !== fromAmountValue
    ) {
      setFromAmountValue(fromAmountInFiat)
    }
  }, [fromAmountInFiat, fromAmountValue, prevFromAmountInFiat, fromAmountFieldMode])

  useEffect(() => {
    // Init each session only once after the cleanup
    if (sessionIdsRequestedToBeInit.current.includes(sessionId)) return

    dispatch({ type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM', params: { sessionId } })
    sessionIdsRequestedToBeInit.current.push(sessionId)
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
  }, [])

  return {
    handleSubmitForm,
    onFromAmountChange,
    onRecipientAddressChange,
    fromSelectedToken,
    toSelectedToken,
    fromAmountValue,
    fromAmountFieldMode,
    fromAmount,
    fromAmountInFiat,
    fromChainId,
    toChainId,
    fromTokenAmountSelectDisabled,
    fromTokenOptions: fromTokenOptionsFiltered as typeof fromTokenOptions,
    fromTokenValue,
    addressState,
    isRecipientAddressUnknown,
    isRecipientAddressUnknownAgreed,
    addressInputState,
    supportedChainIds,
    maxFromAmount,
    switchTokensStatus,
    toTokenList,
    quote
  }
}

export default useTransactionForm

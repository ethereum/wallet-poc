import { getTokenId } from '@web/utils/token'
import { getUiType } from '@web/utils/uiType'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import usePrevious from '@common/hooks/usePrevious'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import {
  ExtendedAddressState,
  ExtendedAddressStateOptional
} from '@ambire-common/interfaces/interop'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import { isEqual } from 'lodash'
import { testnetNetworks } from '@ambire-common/consts/testnetNetworks'

import { useModalize } from 'react-native-modalize'
import useAddressInput from './useAddressInput'
import { toTokenList } from '../utils/toTokenList'

type SessionId = ReturnType<typeof nanoid>

const { isPopup, isActionWindow } = getUiType()

const useTransactionForm = () => {
  const { addToast } = useToast()
  const { visibleActionsQueue } = useActionsControllerState()
  const state = useTransactionControllerState()
  const { setSearchParams } = useNavigation()
  const { formState, transactionType } = state
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
    switchTokensStatus,
    updateToTokenListStatus,
    recipientAddress,
    sessionIds,
    quote
  } = formState
  const {
    ref: estimationModalRef,
    open: openEstimationModal,
    close: closeEstimationModal
  } = useModalize()
  const [isEstimationOpen, setIsEstimationOpen] = useState(false)

  // Temporary log
  console.log({ state })

  const { dispatch } = useBackgroundService()
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
    tokens: portfolioTokenList.filter((token) => supportedChainIds.includes(token.chainId)),
    token: fromSelectedToken ? getTokenId(fromSelectedToken, testnetNetworks) : '',
    isLoading: false, // TODO: from the manager
    networks: testnetNetworks,
    supportedChainIds
  })

  const handleSubmitForm = useCallback(() => {
    if (!fromAmount || !fromSelectedToken || !recipientAddress) return

    dispatch({
      type: 'TRANSACTION_CONTROLLER_BUILD_TRANSACTION_USER_REQUEST',
      params: {
        fromAmount,
        fromSelectedToken,
        recipientAddress,
        toChainId,
        toSelectedToken
      }
    })
    setIsEstimationOpen(true)
  }, [dispatch, fromAmount, fromSelectedToken, recipientAddress, toChainId, toSelectedToken])

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
          addressState: {
            fieldValue: value,
            ensAddress: '',
            interopAddress: '',
            isDomainResolving: false
          }
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
    (newPartialAddressState: ExtendedAddressStateOptional, forceDispatch = false) => {
      // Merge the partial update with the current state to ensure a full AddressState object is dispatched
      const nextAddressState: ExtendedAddressState = {
        fieldValue: newPartialAddressState.fieldValue ?? addressState.fieldValue,
        ensAddress: newPartialAddressState.ensAddress ?? addressState.ensAddress,
        interopAddress: newPartialAddressState.interopAddress ?? addressState.interopAddress,
        isDomainResolving:
          newPartialAddressState.isDomainResolving ?? addressState.isDomainResolving
      }

      // Prevent dispatching if the state hasn't actually changed
      if (!forceDispatch && isEqual(addressState, nextAddressState)) return

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

  // This is a temporary fix meanwhile the intent logic is implemented
  useEffect(() => {
    const toToken = toTokenList.find(
      (token) => token.chainId === toChainId && token.symbol === fromSelectedToken?.symbol
    )
    if (!toToken) return

    dispatch({
      type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
      params: { toSelectedToken: toToken }
    })
  }, [dispatch, fromChainId, fromSelectedToken?.symbol, toChainId])

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
    const hasIntentAction = visibleActionsQueue.some((action) => action.type === 'intent')

    // Cleanup sessions
    if (hasIntentAction) {
      // If there is an open swap and bridge window
      // 1. Focus it if there is a signAccountOp controller
      // 2. Close it if there isn't as that means the screen is displaying
      // the progress of the operation

      // Forcefully unload the popup session after the action window session is added.
      // Otherwise when the user is done with the operation
      // and closes the window the popup session will remain open and the swap and bridge
      // screen will open on load
      if (isActionWindow && sessionIds.includes('popup') && sessionIds.includes(sessionId)) {
        dispatch({
          type: 'TRANSACTION_CONTROLLER_UNLOAD_SCREEN',
          params: { sessionId: 'popup', forceUnload: true }
        })
      }
    }

    // Init each session only once after the cleanup
    if (sessionIdsRequestedToBeInit.current.includes(sessionId)) return

    dispatch({ type: 'TRANSACTION_CONTROLLER_INIT_FORM', params: { sessionId } })
    sessionIdsRequestedToBeInit.current.push(sessionId)
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
  }, [])

  // remove session - this will be triggered only
  // when navigation to another screen internally in the extension
  // the session removal when the window is forcefully closed is handled
  // in the port.onDisconnect callback in the background
  useEffect(() => {
    return () => {
      dispatch({
        type: 'TRANSACTION_CONTROLLER_UNLOAD_SCREEN',
        params: { sessionId }
      })
      dispatch({
        type: 'TRANSACTION_CONTROLLER_SET_QUOTE',
        params: { quote: [], transactions: [] }
      })
      setIsEstimationOpen(false)
    }
  }, [dispatch, sessionId, setIsEstimationOpen])

  useEffect(() => {
    if (isEstimationOpen) {
      openEstimationModal()
    } else {
      closeEstimationModal()
    }
  }, [isEstimationOpen, openEstimationModal, closeEstimationModal])

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
    fromTokenOptions,
    fromTokenValue,
    addressState,
    isRecipientAddressUnknown,
    isRecipientAddressUnknownAgreed,
    addressInputState,
    supportedChainIds,
    maxFromAmount,
    switchTokensStatus,
    toTokenList,
    updateToTokenListStatus,
    recipientAddress,
    quote,
    transactionType,
    estimationModalRef,
    openEstimationModal,
    closeEstimationModal
  }
}

export default useTransactionForm

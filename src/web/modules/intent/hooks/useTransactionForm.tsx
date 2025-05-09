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

type SessionId = ReturnType<typeof nanoid>

const useTransactionForm = () => {
  const { isPopup, isActionWindow } = getUiType()
  const { formState } = useTransactionControllerState()
  const { setSearchParams } = useNavigation()
  const {
    fromAmount,
    fromAmountFieldMode,
    fromAmountInFiat,
    fromChainId,
    toChainId,
    fromSelectedToken,
    portfolioTokenList,
    supportedChainIds
  } = formState
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
    fromAmountValue,
    fromAmountFieldMode,
    fromAmount,
    fromAmountInFiat,
    fromChainId,
    toChainId,
    fromTokenAmountSelectDisabled,
    fromTokenOptions,
    fromTokenValue
  }
}

export default useTransactionForm

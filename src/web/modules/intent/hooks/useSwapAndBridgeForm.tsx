import { formatUnits, getAddress, parseUnits } from 'ethers'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalize } from 'react-native-modalize'
import { useLocation } from 'react-router-dom'

import { getUsdAmount } from '@ambire-common/controllers/signAccountOp/helper'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { getIsTokenEligibleForSwapAndBridge } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { ROUTES } from '@common/modules/router/constants/common'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import { getTokenId } from '@web/utils/token'
import { getUiType } from '@web/utils/uiType'

type SessionId = ReturnType<typeof nanoid>

const { isPopup, isActionWindow } = getUiType()

const useSwapAndBridgeForm = () => {
  const {
    fromAmount,
    fromSelectedToken,
    fromAmountFieldMode,
    portfolioTokenList,
    isTokenListLoading,
    quote,
    fromAmountInFiat,
    activeRoutes,
    signAccountOpController,
    formStatus,
    supportedChainIds,
    updateQuoteStatus,
    sessionIds,
    toSelectedToken
  } = useSwapAndBridgeControllerState()
  const { statuses: mainCtrlStatuses } = useMainControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const [fromAmountValue, setFromAmountValue] = useState<string>(fromAmount)
  /**
   * @deprecated - the settings menu is not used anymore
   */
  const [settingModalVisible, setSettingsModalVisible] = useState<boolean>(false)
  const [hasBroadcasted, setHasBroadcasted] = useState(false)
  const [showAddedToBatch, setShowAddedToBatch] = useState(false)
  const [isOneClickModeDuringPriceImpact, setIsOneClickModeDuringPriceImpact] =
    useState<boolean>(false)
  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  const currentRoute = useLocation()
  const { setSearchParams, navigate } = useNavigation()
  const prevFromAmount = usePrevious(fromAmount)
  const prevFromAmountInFiat = usePrevious(fromAmountInFiat)
  const { ref: routesModalRef, open: openRoutesModal, close: closeRoutesModal } = useModalize()
  const {
    ref: estimationModalRef,
    open: openEstimationModal,
    close: closeEstimationModal
  } = useModalize()
  const {
    ref: priceImpactModalRef,
    open: openPriceImpactModal,
    close: closePriceImpactModal
  } = useModalize()
  const [isInitialized, setIsInitialized] = useState(false)
  const { visibleActionsQueue } = useActionsControllerState()
  const sessionIdsRequestedToBeInit = useRef<SessionId[]>([])
  const sessionId = useMemo(() => {
    if (isPopup) return 'popup'
    if (isActionWindow) return 'action-window'

    return nanoid()
  }, []) // purposely, so it is unique per hook lifetime

  const setIsAutoSelectRouteDisabled = useCallback(
    (isDisabled: boolean) => {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_IS_AUTO_SELECT_ROUTE_DISABLED',
        params: { isDisabled }
      })
    },
    [dispatch]
  )

  const isBridge = useMemo(() => {
    if (!fromSelectedToken || !toSelectedToken) return false
    return fromSelectedToken.chainId !== BigInt(toSelectedToken.chainId)
  }, [fromSelectedToken, toSelectedToken])

  const handleSetFromAmount = useCallback(
    (val: string) => {
      setFromAmountValue(val)
      setIsAutoSelectRouteDisabled(false)
    },
    [setFromAmountValue, setIsAutoSelectRouteDisabled]
  )

  useEffect(() => {
    if (isInitialized || !portfolio.isReadyToVisualize) return

    if (
      currentRoute &&
      currentRoute.state &&
      currentRoute.state.chainId &&
      currentRoute.state.address
    ) {
      const { address, chainId } = currentRoute.state as {
        address: string
        chainId: string
      }

      if (
        fromSelectedToken?.address === address &&
        String(fromSelectedToken?.chainId) === chainId
      ) {
        setIsInitialized(true)
        return
      }
      const tokenToSelectOnInit = portfolio.tokens.find(
        (t) =>
          t.address === address &&
          t.chainId.toString() === chainId &&
          getIsTokenEligibleForSwapAndBridge(t)
      )

      if (tokenToSelectOnInit) {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
          params: { fromSelectedToken: tokenToSelectOnInit }
        })
      }
    } else {
      setIsInitialized(true)
    }
  }, [
    currentRoute,
    dispatch,
    fromSelectedToken?.address,
    fromSelectedToken?.chainId,
    isInitialized,
    portfolio?.isReadyToVisualize,
    portfolio.tokens
  ])

  useEffect(() => {
    const hasSwapAndBridgeAction = visibleActionsQueue.some(
      (action) => action.type === 'swapAndBridge'
    )

    // Cleanup sessions
    if (hasSwapAndBridgeAction) {
      // If there is an open swap and bridge window
      // 1. Focus it if there is a signAccountOp controller
      // 2. Close it if there isn't as that means the screen is displaying
      // the progress of the operation
      if (isPopup) {
        if (signAccountOpController) {
          window.close()
          dispatch({
            type: 'ACTIONS_CONTROLLER_FOCUS_ACTION_WINDOW'
          })
          return
        }

        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_CLOSE_SIGNING_ACTION_WINDOW'
        })
        navigate(ROUTES.dashboard)

        return
      }
      // Forcefully unload the popup session after the action window session is added.
      // Otherwise when the user is done with the operation
      // and closes the window the popup session will remain open and the swap and bridge
      // screen will open on load
      if (isActionWindow && sessionIds.includes('popup') && sessionIds.includes(sessionId)) {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN',
          params: { sessionId: 'popup', forceUnload: true }
        })
      }
    }

    // Init each session only once after the cleanup
    if (sessionIdsRequestedToBeInit.current.includes(sessionId)) return

    dispatch({ type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM', params: { sessionId } })
    sessionIdsRequestedToBeInit.current.push(sessionId)
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
  }, [
    dispatch,
    navigate,
    sessionId,
    sessionIds,
    setSearchParams,
    signAccountOpController,
    visibleActionsQueue
  ])

  // remove session - this will be triggered only
  // when navigation to another screen internally in the extension
  // the session removal when the window is forcefully closed is handled
  // in the port.onDisconnect callback in the background
  useEffect(() => {
    return () => {
      dispatch({ type: 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN', params: { sessionId } })
    }
  }, [dispatch, sessionId])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'fiat' &&
      prevFromAmountInFiat !== fromAmountInFiat &&
      fromAmountInFiat !== fromAmountValue
    ) {
      handleSetFromAmount(fromAmountInFiat)
    }
  }, [
    fromAmountInFiat,
    fromAmountValue,
    prevFromAmountInFiat,
    fromAmountFieldMode,
    handleSetFromAmount
  ])

  useEffect(() => {
    if (fromAmountFieldMode === 'token') handleSetFromAmount(fromAmount)
    if (fromAmountFieldMode === 'fiat') handleSetFromAmount(fromAmountInFiat)
  }, [fromAmountFieldMode, fromAmount, fromAmountInFiat, handleSetFromAmount])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'token' &&
      prevFromAmount !== fromAmount &&
      fromAmount !== fromAmountValue
    ) {
      handleSetFromAmount(fromAmount)
    }
  }, [fromAmount, fromAmountValue, prevFromAmount, fromAmountFieldMode, handleSetFromAmount])

  const onFromAmountChange = useCallback(
    (value: string) => {
      handleSetFromAmount(value)
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: { fromAmount: value }
      })
    },
    [dispatch, handleSetFromAmount]
  )

  const {
    options: fromTokenOptions,
    value: fromTokenValue,
    amountSelectDisabled: fromTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: portfolioTokenList,
    token: fromSelectedToken ? getTokenId(fromSelectedToken, networks) : '',
    isLoading: isTokenListLoading,
    networks,
    supportedChainIds
  })

  const highPriceImpactOrSlippageWarning:
    | { type: 'highPriceImpact'; percentageDiff: number }
    | {
        type: 'slippageImpact'
        possibleSlippage: number
        minInUsd: number
        minInToken: string
        symbol: string
      }
    | null = useMemo(() => {
    if (updateQuoteStatus === 'LOADING') return null

    if (formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit) return null

    if (!quote || !quote.selectedRoute) return null

    let inputValueInUsd = 0

    try {
      inputValueInUsd = Number(fromAmountInFiat)
    } catch (error) {
      // silent fail
    }
    if (!inputValueInUsd) return null

    if (inputValueInUsd <= quote.selectedRoute.outputValueInUsd) return null

    if (!fromSelectedToken) return null

    try {
      const sanitizedFromAmount = getSanitizedAmount(fromAmount, fromSelectedToken!.decimals)

      const bigintFromAmount = parseUnits(sanitizedFromAmount, fromSelectedToken!.decimals)

      if (bigintFromAmount !== BigInt(quote.selectedRoute.fromAmount)) return null

      const difference = Math.abs(inputValueInUsd - quote.selectedRoute.outputValueInUsd)

      const percentageDiff = (difference / inputValueInUsd) * 100

      if (percentageDiff >= 5) {
        return {
          type: 'highPriceImpact',
          percentageDiff
        }
      }

      // try to calculate the slippage
      const minAmountOutInWei = BigInt(
        quote.selectedRoute.userTxs[quote.selectedRoute.userTxs.length - 1].minAmountOut
      )
      const minInUsd = getUsdAmount(
        Number(quote.selectedRoute.toToken.priceUSD),
        quote.selectedRoute.toToken.decimals,
        minAmountOutInWei
      )
      const allowedSlippage = inputValueInUsd <= 400 ? 1.05 : 0.55
      const possibleSlippage = (1 - Number(minInUsd) / quote.selectedRoute.outputValueInUsd) * 100
      if (possibleSlippage > allowedSlippage) {
        return {
          type: 'slippageImpact',
          possibleSlippage,
          minInUsd: Number(minInUsd),
          minInToken: formatUnits(minAmountOutInWei, quote.selectedRoute.toToken.decimals),
          symbol: quote.selectedRoute.toToken.symbol
        }
      }

      return null
    } catch (error) {
      return null
    }
  }, [quote, formStatus, fromAmount, fromAmountInFiat, fromSelectedToken, updateQuoteStatus])

  const openEstimationModalAndDispatch = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_HAS_USER_PROCEEDED',
      params: {
        proceeded: true
      }
    })
    openEstimationModal()
  }, [openEstimationModal, dispatch])

  const acknowledgeHighPriceImpact = useCallback(() => {
    closePriceImpactModal()

    if (isOneClickModeDuringPriceImpact) {
      openEstimationModalAndDispatch()
    } else {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_BUILD_USER_REQUEST'
      })
      setShowAddedToBatch(true)
    }
  }, [
    closePriceImpactModal,
    openEstimationModalAndDispatch,
    dispatch,
    isOneClickModeDuringPriceImpact,
    setShowAddedToBatch
  ])

  const handleSubmitForm = useCallback(
    (isOneClickMode: boolean) => {
      setIsOneClickModeDuringPriceImpact(isOneClickMode)
      if (highPriceImpactOrSlippageWarning) {
        openPriceImpactModal()
        return
      }
      if (!quote || !quote.selectedRoute) return

      // open the estimation modal on one click method;
      // build/add a swap user request on batch
      if (isOneClickMode) {
        openEstimationModalAndDispatch()
      } else {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_BUILD_USER_REQUEST'
        })
        setShowAddedToBatch(true)
      }
    },
    [
      dispatch,
      highPriceImpactOrSlippageWarning,
      openEstimationModalAndDispatch,
      openPriceImpactModal,
      quote
    ]
  )

  const closeEstimationModalWrapped = useCallback(() => {
    // Destroy the existing signAccountOp if the form was cleared
    // Example: The user clicks on sign and is using a hardware wallet
    // The form is cleared and the user decides to reject the txn.
    // The signAccountOp must be destroyed
    if (formStatus === SwapAndBridgeFormStatus.Empty) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_DESTROY_SIGN_ACCOUNT_OP'
      })
    } else {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_HAS_USER_PROCEEDED',
        params: {
          proceeded: false
        }
      })
    }
    closeEstimationModal()
  }, [closeEstimationModal, dispatch, formStatus])
  /**
   * @deprecated - the settings menu is not used anymore
   */
  const handleToggleSettingsMenu = useCallback(() => {
    setSettingsModalVisible((p) => !p)
  }, [])

  const pendingRoutes = useMemo(() => {
    return (
      (activeRoutes || [])
        .filter((r) => r.route && getAddress(r.route.userAddress) === account?.addr)
        .reverse() || []
    )
  }, [activeRoutes, account])

  const displayedView: 'estimate' | 'batch' | 'track' = useMemo(() => {
    if (showAddedToBatch) return 'batch'

    if (hasBroadcasted) return 'track'

    return 'estimate'
  }, [hasBroadcasted, showAddedToBatch])

  useEffect(() => {
    const broadcastStatus = mainCtrlStatuses.broadcastSignedAccountOp

    if (broadcastStatus === 'SUCCESS' && activeRoutes.length) {
      setHasBroadcasted(true)
    }
  }, [activeRoutes.length, mainCtrlStatuses.broadcastSignedAccountOp])

  useEffect(() => {
    if (!signAccountOpController) {
      closeEstimationModalWrapped()
    }
  }, [closeEstimationModalWrapped, signAccountOpController])

  return {
    sessionId,
    isInitialized,
    fromAmountValue,
    onFromAmountChange,
    fromTokenAmountSelectDisabled,
    fromTokenOptions,
    fromTokenValue,
    closeEstimationModalWrapped,
    handleSubmitForm,
    highPriceImpactOrSlippageWarning,
    priceImpactModalRef,
    closePriceImpactModal,
    acknowledgeHighPriceImpact,
    settingModalVisible,
    handleToggleSettingsMenu,
    pendingRoutes,
    routesModalRef,
    displayedView,
    hasBroadcasted,
    setHasBroadcasted,
    openRoutesModal,
    closeRoutesModal,
    estimationModalRef,
    setIsAutoSelectRouteDisabled,
    isBridge,
    setShowAddedToBatch
  }
}

export default useSwapAndBridgeForm

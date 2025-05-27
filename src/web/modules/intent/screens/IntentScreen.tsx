import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Form, Wrapper } from '@web/components/TransactionsScreen'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import SwapAndBridgeEstimation from '@web/modules/intent/components/Estimation'
import RoutesModal from '@web/modules/intent/components/RoutesModal'
import useSwapAndBridgeForm from '@web/modules/intent/hooks/useSwapAndBridgeForm'
import { getUiType } from '@web/utils/uiType'

import BatchAdded from '../components/BatchModal/BatchAdded'
import Buttons from '../components/Buttons'
import TrackProgress from '../components/Estimation/TrackProgress'
import FromToken from '../components/FromToken'
import PriceImpactWarningModal from '../components/PriceImpactWarningModal'
import RouteInfo from '../components/RouteInfo'
import ToToken from '../components/ToToken'
import useTransactionForm from '../hooks/useTransactionForm'
import Recipient from '../components/Recipient'

const { isTab, isActionWindow } = getUiType()

const IntentScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    handleSubmitForm,
    onFromAmountChange,
    onRecipientAddressChange,
    fromAmountValue,
    fromTokenOptions,
    fromTokenValue,
    fromTokenAmountSelectDisabled,
    addressState,
    addressInputState
  } = useTransactionForm()

  const {
    sessionId,
    highPriceImpactOrSlippageWarning,
    priceImpactModalRef,
    closePriceImpactModal,
    acknowledgeHighPriceImpact,
    pendingRoutes,
    routesModalRef,
    openRoutesModal,
    closeRoutesModal,
    estimationModalRef,
    setHasBroadcasted,
    displayedView,
    closeEstimationModalWrapped,
    setIsAutoSelectRouteDisabled,
    isBridge,
    setShowAddedToBatch
  } = useSwapAndBridgeForm()
  const {
    sessionIds,
    formStatus,
    isHealthy,
    shouldEnableRoutesSelection,
    updateQuoteStatus,
    signAccountOpController,
    isAutoSelectRouteDisabled
  } = useSwapAndBridgeControllerState()
  const { portfolio } = useSelectedAccountControllerState()

  const { statuses: mainCtrlStatuses } = useMainControllerState()
  const prevPendingRoutes: any[] | undefined = usePrevious(pendingRoutes)
  const scrollViewRef: any = useRef(null)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (!signAccountOpController || isAutoSelectRouteDisabled) return
    if (signAccountOpController.estimation.status === EstimationStatus.Error) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_ON_ESTIMATION_FAILURE'
      })
    }
  })

  const handleBackButtonPress = useCallback(() => {
    navigate(ROUTES.dashboard)
  }, [navigate])

  useEffect(() => {
    if (!pendingRoutes || !prevPendingRoutes) return
    if (!pendingRoutes.length) return
    if (prevPendingRoutes.length < pendingRoutes.length) {
      // scroll to top when there is a new item in the active routes list
      scrollViewRef.current?.scrollTo({ y: 0 })
    }
  }, [pendingRoutes, prevPendingRoutes])

  // TODO: Disable tokens that are NOT supported
  // (not in the `fromTokenList` of the SwapAndBridge controller)

  // TODO: Confirmation modal (warn) if the diff in dollar amount between the
  // FROM and TO tokens is too high (therefore, user will lose money).

  const isEstimatingRoute =
    formStatus === SwapAndBridgeFormStatus.ReadyToEstimate &&
    (!signAccountOpController ||
      signAccountOpController.estimation.status === EstimationStatus.Loading)

  const isNotReadyToProceed = useMemo(() => {
    return (
      formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit ||
      mainCtrlStatuses.buildSwapAndBridgeUserRequest !== 'INITIAL' ||
      updateQuoteStatus === 'LOADING' ||
      isEstimatingRoute
    )
  }, [
    isEstimatingRoute,
    formStatus,
    mainCtrlStatuses.buildSwapAndBridgeUserRequest,
    updateQuoteStatus
  ])

  const onBatchAddedPrimaryButtonPress = useCallback(() => {
    navigate(WEB_ROUTES.dashboard)
  }, [navigate])

  const onBatchAddedSecondaryButtonPress = useCallback(() => {
    setShowAddedToBatch(false)
  }, [setShowAddedToBatch])

  const onBackButtonPress = useCallback(() => {
    dispatch({
      type: 'TRANSACTION_CONTROLLER_UNLOAD_SCREEN',
      params: { sessionId, forceUnload: true }
    })
    if (isActionWindow) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_CLOSE_SIGNING_ACTION_WINDOW'
      })
    } else {
      navigate(ROUTES.dashboard)
    }
  }, [dispatch, navigate, sessionId])

  const buttons = useMemo(() => {
    return (
      <>
        {isTab && <BackButton onPress={handleBackButtonPress} />}
        <Buttons
          isNotReadyToProceed={isNotReadyToProceed}
          handleSubmitForm={handleSubmitForm}
          isBridge={isBridge}
        />
      </>
    )
  }, [handleBackButtonPress, handleSubmitForm, isBridge, isNotReadyToProceed])

  if (!sessionIds.includes(sessionId)) {
    // If the portfolio has loaded we can skip the spinner as initializing the screen
    // takes a short time and the spinner will only flash.
    if (portfolio.isReadyToVisualize) return null

    return (
      <View style={[flexbox.flex1, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Spinner />
      </View>
    )
  }

  if (displayedView === 'track') {
    return (
      <TrackProgress
        handleClose={() => {
          setHasBroadcasted(false)
        }}
      />
    )
  }

  if (displayedView === 'batch') {
    return (
      <BatchAdded
        onPrimaryButtonPress={onBatchAddedPrimaryButtonPress}
        onSecondaryButtonPress={onBatchAddedSecondaryButtonPress}
      />
    )
  }

  const disableForm = false
  const { validation } = addressInputState

  return (
    <Wrapper title={t('Transfer')} handleGoBack={onBackButtonPress} buttons={buttons}>
      <Content scrollViewRef={scrollViewRef} buttons={buttons}>
        {isHealthy === false && (
          <Alert
            type="error"
            title={t('Temporarily unavailable.')}
            text={t(
              "We're currently unable to initiate a swap or bridge request because our service provider's API is temporarily unavailable. Please try again later. If the issue persists, check for updates or contact support."
            )}
            style={spacings.mb}
          />
        )}
        <Form>
          <Recipient
            disabled={disableForm}
            address={addressState.fieldValue}
            setAddress={onRecipientAddressChange}
            validation={validation}
            ensAddress={addressState.ensAddress}
            isRecipientDomainResolving={addressState.isDomainResolving}
          />
          <FromToken
            fromTokenOptions={fromTokenOptions}
            fromTokenValue={fromTokenValue}
            fromAmountValue={fromAmountValue}
            fromTokenAmountSelectDisabled={fromTokenAmountSelectDisabled}
            onFromAmountChange={onFromAmountChange}
            setIsAutoSelectRouteDisabled={setIsAutoSelectRouteDisabled}
          />
          <ToToken
            isAutoSelectRouteDisabled={isAutoSelectRouteDisabled}
            setIsAutoSelectRouteDisabled={setIsAutoSelectRouteDisabled}
          />
        </Form>
        <RouteInfo
          isEstimatingRoute={isEstimatingRoute}
          openRoutesModal={openRoutesModal}
          shouldEnableRoutesSelection={shouldEnableRoutesSelection}
          isAutoSelectRouteDisabled={isAutoSelectRouteDisabled}
        />
      </Content>
      <RoutesModal sheetRef={routesModalRef} closeBottomSheet={closeRoutesModal} />
      <SwapAndBridgeEstimation
        closeEstimationModal={closeEstimationModalWrapped}
        estimationModalRef={estimationModalRef}
      />
      <PriceImpactWarningModal
        sheetRef={priceImpactModalRef}
        closeBottomSheet={closePriceImpactModal}
        acknowledgeHighPriceImpact={acknowledgeHighPriceImpact}
        highPriceImpactOrSlippageWarning={highPriceImpactOrSlippageWarning}
      />
    </Wrapper>
  )
}

export default React.memo(IntentScreen)

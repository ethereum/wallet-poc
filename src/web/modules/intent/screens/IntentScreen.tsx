/* eslint-disable no-console */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
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
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import SwapAndBridgeEstimation from '@web/modules/intent/components/Estimation'
import RoutesModal from '@web/modules/intent/components/RoutesModal'
import useSwapAndBridgeForm from '@web/modules/intent/hooks/useSwapAndBridgeForm'
import { getUiType } from '@web/utils/uiType'

import {
  createCrossChainProvider,
  createProviderExecutor,
  InteropAddressParamsParser,
  buildFromPayload,
  binaryToHumanReadable
} from '@defi-wonderland/interop'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import { parseUnits, ZeroAddress } from 'ethers'
import BatchAdded from '../components/BatchModal/BatchAdded'
import Buttons from '../components/Buttons'
import TrackProgress from '../components/Estimation/TrackProgress'
import FromToken from '../components/FromToken'
import PriceImpactWarningModal from '../components/PriceImpactWarningModal'
import RouteInfo from '../components/RouteInfo'
import ToToken from '../components/ToToken'
import useTransactionForm from '../hooks/useTransactionForm'
import Recipient from '../components/Recipient'
import { SUPPORTED_ETH_BY_CHAIN_ID } from '../utils/tokenAddresses'

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
    closeRoutesModal,
    estimationModalRef,
    setHasBroadcasted,
    displayedView,
    closeEstimationModalWrapped,
    setIsAutoSelectRouteDisabled,
    isBridge,
    setShowAddedToBatch
  } = useSwapAndBridgeForm()
  const { sessionIds, isHealthy, signAccountOpController, isAutoSelectRouteDisabled } =
    useSwapAndBridgeControllerState()
  const { portfolio } = useSelectedAccountControllerState()

  const prevPendingRoutes: any[] | undefined = usePrevious(pendingRoutes)
  const scrollViewRef: any = useRef(null)
  const { dispatch } = useBackgroundService()
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [outputAmount, setOutputAmount] = useState<string | undefined>(undefined)
  const [recipientAddress, setRecipientAddress] = useState<string>(addressState.fieldValue)

  const handleRecipientAddressChange = useCallback(
    (address: string) => {
      setRecipientAddress(address)
      onRecipientAddressChange(address)
    },
    [onRecipientAddressChange]
  )

  const state = useTransactionControllerState()
  const { transactionType, intent } = state
  const {
    sender,
    recipient,
    inputTokenAddress: pInputTokenAddress,
    outputTokenAddress: pOutputTokenAddress,
    inputAmount,
    inputChainId,
    outputChainId
  } = (intent?.params || {}) as {
    sender?: string
    recipient?: string
    inputTokenAddress?: string
    outputTokenAddress?: string
    inputAmount?: string
    inputChainId?: number
    outputChainId?: number
  }

  const allParamsAvailable =
    sender &&
    recipient &&
    pInputTokenAddress &&
    pOutputTokenAddress &&
    inputAmount &&
    inputChainId !== undefined &&
    outputChainId !== undefined

  const getQuotes = useCallback(async () => {
    if (
      !sender ||
      !recipient ||
      !pInputTokenAddress ||
      !pOutputTokenAddress ||
      !inputAmount ||
      inputChainId === undefined ||
      outputChainId === undefined
    ) {
      console.warn('Insufficient params for getQuotes')
      return
    }

    setIsLoading(true)

    try {
      const paramParser = new InteropAddressParamsParser()
      const acrossProvider = createCrossChainProvider('across')

      const executor = createProviderExecutor([acrossProvider], {
        paramParser
      })

      const fromNumberToHex = (number: number) => `0x${number.toString(16)}`

      const senderPayload = buildFromPayload({
        version: 1,
        chainType: 'eip155',
        chainReference: fromNumberToHex(inputChainId),
        address: sender || ''
      })

      const recipientPayload = buildFromPayload({
        version: 1,
        chainType: 'eip155',
        chainReference: fromNumberToHex(outputChainId),
        address: recipient || ''
      })

      const isInputEth = pInputTokenAddress === ZeroAddress
      const resolvedInputTokenAddress = isInputEth
        ? SUPPORTED_ETH_BY_CHAIN_ID[inputChainId]
        : pInputTokenAddress
      const resolvedOutputTokenAddress = isInputEth
        ? SUPPORTED_ETH_BY_CHAIN_ID[outputChainId]
        : pOutputTokenAddress

      const newParams = {
        sender: await binaryToHumanReadable(senderPayload),
        recipient: await binaryToHumanReadable(recipientPayload),
        inputTokenAddress: resolvedInputTokenAddress,
        outputTokenAddress: resolvedOutputTokenAddress,
        amount: inputAmount
      }

      console.log({ newParams })
      const quotes = await executor.getQuotes('crossChainTransfer', newParams)

      console.log({ quotes })

      if (!quotes || quotes.length === 0) {
        console.error('No quotes received from provider')
        return
      }

      const transactions = await executor.execute(quotes[0] as any)

      if (isInputEth) {
        transactions.unshift({
          value: parseUnits(inputAmount, 18),
          to: SUPPORTED_ETH_BY_CHAIN_ID[inputChainId] as `0x${string}`,
          data: '0x'
        })
      }

      console.log({ transactions })
      dispatch({
        type: 'TRANSACTION_CONTROLLER_SET_QUOTE',
        params: { quote: quotes[0], transactions }
      })
      setOutputAmount((quotes[0] as any)?.output?.outputAmount)
      setIsError(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Error in getQuotes:', error)
      setIsError(true)
      throw new Error('No selected account')
    }
  }, [
    sender,
    recipient,
    pInputTokenAddress,
    pOutputTokenAddress,
    inputAmount,
    inputChainId,
    outputChainId,
    dispatch,
    setOutputAmount
  ])

  useEffect(() => {
    if (transactionType === 'intent') {
      if (allParamsAvailable) {
        getQuotes().catch(console.error)
        return
      }

      setOutputAmount(0)
    }

    dispatch({
      type: 'TRANSACTION_CONTROLLER_SET_QUOTE',
      params: { quote: [], transactions: [] }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getQuotes, transactionType, dispatch])

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
      scrollViewRef.current?.scrollTo({ y: 0 })
    }
  }, [pendingRoutes, prevPendingRoutes])

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
          isNotReadyToProceed={isLoading || (isError && transactionType === 'intent')}
          handleSubmitForm={handleSubmitForm}
          isBridge={isBridge}
        />
      </>
    )
  }, [handleBackButtonPress, handleSubmitForm, isBridge, isLoading, isError, transactionType])

  if (!sessionIds.includes(sessionId)) {
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
            address={recipientAddress}
            setAddress={handleRecipientAddressChange}
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
            setIsAutoSelectRouteDisabled={setIsAutoSelectRouteDisabled}
            isLoading={isLoading && transactionType === 'intent'}
            outputAmount={outputAmount}
          />
        </Form>

        <RouteInfo />
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

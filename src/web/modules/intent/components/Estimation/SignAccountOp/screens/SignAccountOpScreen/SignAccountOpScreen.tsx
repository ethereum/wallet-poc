import * as Clipboard from 'expo-clipboard'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

import { AccountOpAction } from '@ambire-common/controllers/actions/actions'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { getErrorCodeStringFromReason } from '@ambire-common/libs/errorDecoder/helpers'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Alert from '@common/components/Alert'
import AlertVertical from '@common/components/AlertVertical'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import useSign from '@common/hooks/useSign'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import PendingTransactions from '@web/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksOverlay from '@web/modules/sign-account-op/components/SafetyChecksOverlay'
import SignAccountOpHardwareWalletSigningModal from '@web/modules/sign-account-op/components/SignAccountOpHardwareWalletSigningModal'
import Simulation from '@web/modules/sign-account-op/components/Simulation'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'

import getStyles from './styles'

const SignAccountOpScreen = () => {
  const actionsState = useActionsControllerState()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_STATUS',
        params: {
          status
        }
      })
    },
    [dispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: string; signingKeyType?: string }) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params
      })
    },
    [dispatch]
  )

  const handleBroadcast = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_HANDLE_SIGN_AND_BROADCAST_ACCOUNT_OP'
    })
  }, [dispatch])
  const {
    renderedButNotNecessarilyVisibleModal,
    isViewOnly,
    dismissWarning,
    acknowledgeWarning,
    isChooseSignerShown,
    setIsChooseSignerShown,
    onSignButtonClick,
    handleChangeSigningKey,
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
    signingKeyType,
    feePayerKeyType,
    shouldDisplayLedgerConnectModal,
    network,
    actionLoaded,
    setActionLoaded,
    isSignDisabled
  } = useSign({
    handleUpdateStatus,
    signAccountOpState,
    handleUpdate: updateController,
    handleBroadcast
  })

  const accountOpAction = useMemo(() => {
    if (actionsState.currentAction?.type !== 'accountOp') return undefined
    return actionsState.currentAction as AccountOpAction
  }, [actionsState.currentAction])

  useEffect(() => {
    // we're checking for actionLoaded as we're closing the current and
    // opening a new window each time a new action comes. If we're not
    // checking for actionLoaded, two dispatches occur for the same id:
    // - one from the current window before it gets closed
    // - one from the new window
    // leading into two threads trying to initialize the same signAccountOp
    // object which is a waste of resources + signAccountOp has an inner
    // gasPrice controller that sets an interval for fetching gas price
    // each 12s and that interval gets persisted into memory, causing double
    // fetching
    if (accountOpAction?.id && !actionLoaded) {
      setActionLoaded(true)
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_INIT',
        params: { actionId: accountOpAction.id }
      })
    }
  }, [accountOpAction?.id, actionLoaded, dispatch, setActionLoaded])

  const handleRejectAccountOp = useCallback(() => {
    if (!accountOpAction) return

    dispatch({
      type: 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP',
      params: {
        err: 'User rejected the transaction request.',
        actionId: accountOpAction.id,
        shouldOpenNextAction: true
      }
    })
  }, [dispatch, accountOpAction])

  const handleAddToCart = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeCurrentWindow()
  }, [])

  useEffect(() => {
    return () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_DESTROY' })
    }
  }, [dispatch])

  const copySignAccountOpError = useCallback(async () => {
    if (!signAccountOpState?.errors?.length) return

    const errorCode = signAccountOpState.errors[0].code

    if (!errorCode) return

    await Clipboard.setStringAsync(errorCode)
    addToast(t('Error code copied to clipboard'))
  }, [addToast, signAccountOpState?.errors, t])

  if (mainState.signAccOpInitError) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Alert type="error" title={mainState.signAccOpInitError} />
      </View>
    )
  }

  const isAddToCartDisabled = useMemo(() => {
    const readyToSign = signAccountOpState?.readyToSign

    return isSignLoading || (!readyToSign && !isViewOnly)
  }, [isSignLoading, isViewOnly, signAccountOpState?.readyToSign])

  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError

  return (
    <SmallNotificationWindowWrapper>
      {renderedButNotNecessarilyVisibleModal === 'warnings' && (
        <BottomSheet
          id="warning-modal"
          closeBottomSheet={!slowPaymasterRequest ? dismissWarning : undefined}
          sheetRef={warningModalRef}
          style={styles.warningsModal}
          type="bottom-sheet"
          withBackdropBlur={false}
          shouldBeClosableOnDrag={false}
        >
          {warningToPromptBeforeSign && (
            <DualChoiceWarningModal
              title={t(warningToPromptBeforeSign.title)}
              description={t(warningToPromptBeforeSign.text || '')}
              primaryButtonText={t('Proceed')}
              secondaryButtonText={t('Cancel')}
              onPrimaryButtonPress={acknowledgeWarning}
              onSecondaryButtonPress={dismissWarning}
            />
          )}
          {slowPaymasterRequest && (
            <DualChoiceWarningModal.Wrapper>
              <DualChoiceWarningModal.ContentWrapper>
                <DualChoiceWarningModal.TitleAndIcon
                  title={t('Sending transaction is taking longer than expected')}
                  style={spacings.mbTy}
                />
                <DualChoiceWarningModal.Text
                  style={{ ...text.center, ...spacings.mbLg }}
                  text={t('Please wait...')}
                  weight="medium"
                />
                <DualChoiceWarningModal.Text
                  style={{ ...text.center, fontSize: 14, ...spacings.mb }}
                  text={t('(Reason: paymaster is taking longer than expected)')}
                />
              </DualChoiceWarningModal.ContentWrapper>
            </DualChoiceWarningModal.Wrapper>
          )}
        </BottomSheet>
      )}
      <SafetyChecksOverlay
        shouldBeVisible={
          !signAccountOpState?.estimation.estimation || !signAccountOpState?.isInitialized
        }
      />
      <TabLayoutContainer
        width="full"
        backgroundColor="#F7F8FC"
        withHorizontalPadding={false}
        style={spacings.phLg}
        header={<HeaderAccountAndNetworkInfo backgroundColor={theme.primaryBackground as string} />}
        renderDirectChildren={() => (
          <View style={styles.footer}>
            {!estimationFailed ? (
              <>
                <Estimation
                  signAccountOpState={signAccountOpState}
                  disabled={isSignLoading}
                  hasEstimation={!!hasEstimation}
                  slowRequest={slowRequest}
                  isViewOnly={isViewOnly}
                  isSponsored={signAccountOpState ? signAccountOpState.isSponsored : false}
                  sponsor={signAccountOpState ? signAccountOpState.sponsor : undefined}
                  updateType="Main"
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.secondaryBorder,
                    ...spacings.mvLg
                  }}
                />
              </>
            ) : null}

            <Footer
              onReject={handleRejectAccountOp}
              onAddToCart={handleAddToCart}
              isAddToCartDisplayed={!!signAccountOpState && !!network}
              isSignLoading={isSignLoading}
              isSignDisabled={isSignDisabled}
              // Allow view only accounts or if no funds for gas to add to cart even if the txn is not ready to sign
              // because they can't sign it anyway

              isAddToCartDisabled={isAddToCartDisabled}
              onSign={onSignButtonClick}
              inProgressButtonText={
                signAccountOpState?.status?.type === SigningStatus.WaitingForPaymaster
                  ? t('Sending...')
                  : t('Signing...')
              }
            />
          </View>
        )}
      >
        {signAccountOpState ? (
          <SigningKeySelect
            isVisible={isChooseSignerShown}
            isSigning={isSignLoading || !signAccountOpState.readyToSign}
            handleClose={() => setIsChooseSignerShown(false)}
            selectedAccountKeyStoreKeys={signAccountOpState.accountKeyStoreKeys}
            handleChooseSigningKey={handleChangeSigningKey}
            account={signAccountOpState.account}
          />
        ) : null}
        <TabLayoutWrapperMainContent>
          <PendingTransactions network={network} />
          {/* Display errors only if the user is not in view-only mode */}
          {signAccountOpState?.errors?.length && !isViewOnly ? (
            <AlertVertical
              type="warning"
              title={signAccountOpState.errors[0].title}
              text={
                getErrorCodeStringFromReason(signAccountOpState.errors[0].code) ? (
                  <AlertVertical.Text
                    type="warning"
                    size="md"
                    style={{
                      ...flexbox.flex1,
                      ...flexbox.directionRow,
                      ...flexbox.alignCenter,
                      ...flexbox.wrap,
                      maxWidth: '100%'
                    }}
                  >
                    {getErrorCodeStringFromReason(signAccountOpState.errors[0].code || '', false)}
                    <Pressable
                      // @ts-ignore web style
                      style={{ verticalAlign: 'middle', ...spacings.mlMi, ...spacings.mbMi }}
                      onPress={copySignAccountOpError}
                    >
                      <CopyIcon
                        strokeWidth={1.5}
                        width={20}
                        height={20}
                        color={theme.warningText}
                      />
                    </Pressable>
                  </AlertVertical.Text>
                ) : undefined
              }
            />
          ) : (
            <Simulation
              network={network}
              isViewOnly={isViewOnly}
              isEstimationComplete={!!signAccountOpState?.isInitialized && !!network}
            />
          )}
          {isViewOnly && <NoKeysToSignAlert style={spacings.ptTy} />}

          {renderedButNotNecessarilyVisibleModal === 'hw-sign' && signAccountOpState && (
            <SignAccountOpHardwareWalletSigningModal
              signingKeyType={signingKeyType}
              feePayerKeyType={feePayerKeyType}
              broadcastSignedAccountOpStatus={mainState.statuses.broadcastSignedAccountOp}
              signAccountOpStatusType={signAccountOpState.status?.type}
              shouldSignAuth={signAccountOpState.shouldSignAuth}
              signedTransactionsCount={signAccountOpState.signedTransactionsCount}
              accountOp={signAccountOpState.accountOp}
            />
          )}

          {renderedButNotNecessarilyVisibleModal === 'ledger-connect' && (
            <LedgerConnectModal
              isVisible={shouldDisplayLedgerConnectModal}
              handleClose={handleDismissLedgerConnectModal}
              displayOptionToAuthorize={false}
            />
          )}
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignAccountOpScreen)

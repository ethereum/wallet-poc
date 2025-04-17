import React, { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { FEE_COLLECTOR } from '@ambire-common/consts/addresses'
import { ActionExecutionType } from '@ambire-common/controllers/actions/actions'
import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { isSmartAccount as getIsSmartAccount } from '@ambire-common/libs/account/account'
import CartIcon from '@common/assets/svg/CartIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Panel from '@common/components/Panel'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getAddressFromAddressState } from '@common/utils/domains'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import GasTankInfoModal from '@web/modules/transfer/components/GasTankInfoModal'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'

import getStyles from './styles'

const TransferScreen = () => {
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const { maxWidthSize } = useWindowSize()
  const { state, transferCtrl } = useTransferControllerState()
  const {
    isTopUp,
    validationFormMsgs,
    addressState,
    isRecipientHumanizerKnownTokenOrSmartContract,
    isSWWarningVisible,
    isRecipientAddressUnknown,
    isFormValid
  } = state
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { account, portfolio } = useSelectedAccountControllerState()
  const isSmartAccount = account ? getIsSmartAccount(account) : false
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const {
    ref: gasTankSheetRef,
    open: openGasTankInfoBottomSheet,
    close: closeGasTankInfoBottomSheet
  } = useModalize()
  const { userRequests } = useMainControllerState()
  const actionsState = useActionsControllerState()

  const hasFocusedActionWindow = useMemo(
    () => actionsState.actionWindow.windowProps?.focused,
    [actionsState.actionWindow.windowProps]
  )

  const transactionUserRequests = useMemo(() => {
    return userRequests.filter((r) => {
      const isSelectedAccountAccountOp =
        r.action.kind === 'calls' && r.meta.accountAddr === account?.addr

      if (!isSelectedAccountAccountOp) return false

      const isMatchingSelectedTokenNetwork = r.meta.chainId === state.selectedToken?.chainId

      return !state.selectedToken || isMatchingSelectedTokenNetwork
    })
  }, [account?.addr, state.selectedToken, userRequests])

  const doesUserMeetMinimumBalanceForGasTank = useMemo(() => {
    return portfolio.totalBalance >= 10
  }, [portfolio.totalBalance])

  const setAddressState = useCallback(
    (newPartialAddressState: AddressStateOptional) => {
      transferCtrl.update({ addressState: newPartialAddressState })
    },
    [transferCtrl]
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

  const addressInputState = useAddressInput({
    addressState,
    setAddressState,
    overwriteError:
      state?.isInitialized && !validationFormMsgs.recipientAddress.success
        ? validationFormMsgs.recipientAddress.message
        : '',
    overwriteValidLabel: validationFormMsgs?.recipientAddress.success
      ? validationFormMsgs.recipientAddress.message
      : '',
    addToast,
    handleCacheResolvedDomain
  })

  const isFormEmpty = useMemo(() => {
    return (!transferCtrl.amount && !transferCtrl.recipientAddress) || !transferCtrl.selectedToken
  }, [transferCtrl.amount, transferCtrl.recipientAddress, transferCtrl.selectedToken])

  const submitButtonText = useMemo(() => {
    if (hasFocusedActionWindow) return isTopUp ? t('Top Up') : t('Send')

    let numOfRequests = transactionUserRequests.length

    if (numOfRequests) {
      if (isTopUp ? isFormValid : isFormValid && !addressInputState.validation.isError) {
        numOfRequests++ // the queued txns + the one from the form
      }

      if (isFormEmpty) return t('Sign All Pending ({{count}})', { count: numOfRequests })
      return isTopUp
        ? t('Top Up ({{count}})', { count: numOfRequests })
        : t('Send ({{count}})', { count: numOfRequests })
    }

    return isTopUp ? t('Top Up') : t('Send')
  }, [
    isTopUp,
    transactionUserRequests,
    addressInputState.validation.isError,
    isFormValid,
    isFormEmpty,
    hasFocusedActionWindow,
    t
  ])

  const isTransferFormValid = useMemo(
    () => (isTopUp ? isFormValid : isFormValid && !addressInputState.validation.isError),
    [addressInputState.validation.isError, isFormValid, isTopUp]
  )

  const isSendButtonDisabled = useMemo(() => {
    if (transactionUserRequests.length && !hasFocusedActionWindow) {
      return !isFormEmpty && !isTransferFormValid
    }
    return !isTransferFormValid
  }, [isFormEmpty, isTransferFormValid, transactionUserRequests.length, hasFocusedActionWindow])

  const onBack = useCallback(() => {
    navigate(ROUTES.dashboard)
  }, [navigate])

  const addTransaction = useCallback(
    (actionExecutionType: ActionExecutionType) => {
      if (isFormValid && state.selectedToken) {
        if (actionExecutionType === 'queue' && !transferCtrl.shouldSkipTransactionQueuedModal) {
          openBottomSheet()
        }

        dispatch({
          type: 'MAIN_CONTROLLER_BUILD_TRANSFER_USER_REQUEST',
          params: {
            amount: state.amount,
            selectedToken: state.selectedToken,
            recipientAddress: isTopUp ? FEE_COLLECTOR : getAddressFromAddressState(addressState),
            actionExecutionType
          }
        })

        transferCtrl.resetForm()
        return
      }

      if (
        actionExecutionType === 'open-action-window' &&
        transactionUserRequests.length &&
        isFormEmpty
      ) {
        const firstAccountOpAction = actionsState.visibleActionsQueue
          .reverse()
          .find((a) => a.type === 'accountOp')
        if (!firstAccountOpAction) return
        dispatch({
          type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID',
          params: { actionId: firstAccountOpAction?.id }
        })
      }
    },
    [
      transferCtrl,
      addressState,
      isTopUp,
      state.amount,
      state.selectedToken,
      isFormEmpty,
      transactionUserRequests.length,
      actionsState,
      isFormValid,
      dispatch,
      openBottomSheet
    ]
  )

  const handleGasTankInfoPressed = useCallback(
    () => openGasTankInfoBottomSheet(),
    [openGasTankInfoBottomSheet]
  )

  const gasTankLabelWithInfo = useMemo(() => {
    const fontSize = maxWidthSize('xl') ? 20 : 18

    return (
      <View style={flexbox.directionRow}>
        <Text
          fontSize={fontSize}
          weight="medium"
          appearance="primaryText"
          numberOfLines={1}
          style={spacings.mrMi}
        >
          {t('Top Up Gas Tank')}
        </Text>
        <Pressable style={[flexbox.center]} onPress={handleGasTankInfoPressed}>
          <InfoIcon width={fontSize} height={fontSize} />
        </Pressable>
      </View>
    )
  }, [handleGasTankInfoPressed, maxWidthSize, t])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="xl"
      header={<HeaderAccountAndNetworkInfo withOG />}
      footer={
        <>
          <BackButton onPress={onBack} />
          <View
            style={[flexbox.directionRow, !isSmartAccount && flexbox.flex1, flexbox.justifyEnd]}
          >
            <Button
              testID="transfer-queue-and-add-more-button"
              type="outline"
              accentColor={theme.primary}
              text={t('Queue and Add More')}
              onPress={() => addTransaction('queue')}
              disabled={!isFormValid || (!isTopUp && addressInputState.validation.isError)}
              hasBottomSpacing={false}
              style={spacings.mr}
              size="large"
            >
              <View style={[spacings.plSm, flexbox.directionRow, flexbox.alignCenter]}>
                <CartIcon color={theme.primary} />
                {!!transactionUserRequests.length && !hasFocusedActionWindow && (
                  <Text
                    fontSize={16}
                    weight="medium"
                    color={theme.primary}
                  >{` (${transactionUserRequests.length})`}</Text>
                )}
              </View>
            </Button>
            <Button
              testID="transfer-button-confirm"
              type="primary"
              text={submitButtonText}
              onPress={() => addTransaction('open-action-window')}
              hasBottomSpacing={false}
              size="large"
              disabled={isSendButtonDisabled}
            >
              <View style={spacings.plTy}>
                {isTopUp ? (
                  <TopUpIcon
                    strokeWidth={1}
                    width={24}
                    height={24}
                    color={theme.primaryBackground}
                  />
                ) : (
                  <SendIcon width={24} height={24} color={theme.primaryBackground} />
                )}
              </View>
            </Button>
          </View>
        </>
      }
    >
      <TabLayoutWrapperMainContent contentContainerStyle={spacings.pt2Xl}>
        {state?.isInitialized ? (
          <Panel
            style={[styles.panel]}
            forceContainerSmallSpacings
            title={state.isTopUp ? gasTankLabelWithInfo : 'Send'}
          >
            <SendForm
              addressInputState={addressInputState}
              isSmartAccount={isSmartAccount}
              amountErrorMessage={validationFormMsgs.amount.message || ''}
              isRecipientAddressUnknown={isRecipientAddressUnknown}
              isRecipientHumanizerKnownTokenOrSmartContract={
                isRecipientHumanizerKnownTokenOrSmartContract
              }
              isSWWarningVisible={isSWWarningVisible}
            />
            {isTopUp && !isSmartAccount && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  title={
                    <Trans>
                      The Gas Tank is exclusively available for Smart Accounts. It lets you pre-pay
                      for network fees using stable coins and other tokens and use the funds on any
                      chain.{' '}
                      <Pressable
                        onPress={async () => {
                          try {
                            await createTab(
                              'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                            )
                          } catch {
                            addToast("Couldn't open link", { type: 'error' })
                          }
                        }}
                      >
                        <Text appearance="warningText" underline>
                          {t('Learn more')}
                        </Text>
                      </Pressable>
                      .
                    </Trans>
                  }
                  isTypeLabelHidden
                />
              </View>
            )}
            {isTopUp && isSmartAccount && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  title={t('Gas Tank deposits cannot be withdrawn')}
                  text={
                    !doesUserMeetMinimumBalanceForGasTank
                      ? t(
                          'Note: A minimum overall balance of $10 is required to pay for gas via the Gas Tank'
                        )
                      : false
                  }
                  isTypeLabelHidden
                />
              </View>
            )}
          </Panel>
        ) : (
          <SkeletonLoader
            width={640}
            height={420}
            appearance="primaryBackground"
            style={{ marginLeft: 'auto', marginRight: 'auto' }}
          />
        )}
      </TabLayoutWrapperMainContent>
      <BottomSheet
        id="import-seed-phrase"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        backgroundColor="secondaryBackground"
        style={{ overflow: 'hidden', width: 496, ...spacings.ph0, ...spacings.pv0 }}
        type="modal"
      >
        <DualChoiceModal
          title={t('Transaction queued')}
          description={
            <View>
              <Text style={spacings.mbTy} appearance="secondaryText">
                {t(
                  'You can now add more transactions on this network and send them batched all together for signing.'
                )}
              </Text>
              <Text appearance="secondaryText" style={spacings.mbLg}>
                {t('The queued pending transactions are available on your Dashboard.')}
              </Text>
              <Checkbox
                value={transferCtrl.shouldSkipTransactionQueuedModal}
                onValueChange={() => {
                  transferCtrl.shouldSkipTransactionQueuedModal =
                    !transferCtrl.shouldSkipTransactionQueuedModal
                }}
                uncheckedBorderColor={theme.secondaryText}
                label={t("Don't show this modal again")}
                labelProps={{
                  style: {
                    color: theme.secondaryText
                  },
                  weight: 'medium'
                }}
                style={spacings.mb0}
              />
            </View>
          }
          onPrimaryButtonPress={closeBottomSheet}
          primaryButtonText={t('Got it')}
          primaryButtonTestID="queue-modal-got-it-button"
        />
      </BottomSheet>
      <GasTankInfoModal
        id="gas-tank-info"
        sheetRef={gasTankSheetRef}
        closeBottomSheet={closeGasTankInfoBottomSheet}
        onPrimaryButtonPress={closeGasTankInfoBottomSheet}
        portfolio={portfolio}
        account={account}
      />
    </TabLayoutContainer>
  )
}

export default React.memo(TransferScreen)

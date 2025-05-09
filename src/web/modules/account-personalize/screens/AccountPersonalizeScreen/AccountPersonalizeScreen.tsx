/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Pressable, ScrollView, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import wait from '@ambire-common/utils/wait'
import CheckIcon from '@common/assets/svg/CheckIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useWalletStateController from '@web/hooks/useWalletStateController'
import AccountPersonalizeCard from '@web/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@web/modules/account-personalize/components/AccountsLoadingAnimation'
import AccountsLoadingDotsAnimation from '@web/modules/account-personalize/components/AccountsLoadingDotsAnimation'

import getStyles from './styles'

export const CARD_WIDTH = 400

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { styles, theme } = useTheme(getStyles)
  const { dispatch } = useBackgroundService()
  const accountPickerState = useAccountPickerControllerState()
  const { accounts } = useAccountsControllerState()
  const { isSetupComplete } = useWalletStateController()
  const { addToast } = useToast()

  const newlyAddedAccounts = useMemo(() => accounts.filter((a) => a.newlyAdded) || [], [accounts])

  const { handleSubmit, control, setValue, getValues } = useForm({
    defaultValues: {
      accounts: accountPickerState.addedAccountsFromCurrentSession || newlyAddedAccounts
    }
  })

  const [accountsToPersonalize, setAccountsToPersonalize] = useState<Account[]>([])
  const personalizeReady = useRef(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (accountPickerState.isInitialized) return
    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT' })
  }, [dispatch, accountPickerState.isInitialized])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      await wait(1000)
      if (
        accountPickerState.isInitialized &&
        accountPickerState.selectNextAccountStatus === 'INITIAL' &&
        !accountPickerState.selectedAccountsFromCurrentSession.length &&
        accountPickerState.addAccountsStatus === 'INITIAL'
      ) {
        setIsLoading(false)
      }

      if (!accountPickerState.isInitialized && accountsToPersonalize.length) {
        setIsLoading(false)
      }
    })()
  }, [
    accountPickerState.isInitialized,
    accountPickerState.readyToRemoveAccounts.length,
    accountPickerState.selectNextAccountStatus,
    accountPickerState.selectedAccountsFromCurrentSession.length,
    accountsToPersonalize,
    accountPickerState.addAccountsStatus
  ])

  useEffect(() => {
    if (accountPickerState.isInitialized && !accountsToPersonalize.length && !isLoading) {
      goToNextRoute()
    }
  }, [goToNextRoute, accountPickerState.isInitialized, accountsToPersonalize.length, isLoading])

  useEffect(() => {
    if (accountPickerState.isInitialized) {
      setAccountsToPersonalize(accountPickerState.addedAccountsFromCurrentSession)
    } else if (!accountPickerState.isInitialized && newlyAddedAccounts.length) {
      setAccountsToPersonalize(newlyAddedAccounts)
    }
  }, [
    accountPickerState.isInitialized,
    accountPickerState.addedAccountsFromCurrentSession,
    newlyAddedAccounts
  ])

  useEffect(() => {
    setValue('accounts', accountsToPersonalize)
  }, [accountsToPersonalize, setValue])

  const { fields } = useFieldArray({ control, name: 'accounts' })

  const handleSave = useCallback(
    (data?: { accounts: Account[] }) => {
      const newAccounts = data?.accounts || getValues('accounts')
      dispatch({
        type: 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_PREFERENCES',
        params: newAccounts.map((a) => ({ addr: a.addr, preferences: a.preferences }))
      })
    },
    [dispatch, getValues]
  )

  useEffect(() => {
    if (newlyAddedAccounts.length && accountPickerState.isInitialized) {
      dispatch({ type: 'ACCOUNTS_CONTROLLER_RESET_ACCOUNTS_NEWLY_ADDED_STATE' })
    }
  }, [newlyAddedAccounts.length, accountPickerState.isInitialized, dispatch])

  const handleGetStarted = useCallback(async () => {
    await handleSubmit(handleSave)()
    dispatch({ type: 'ACCOUNTS_CONTROLLER_RESET_ACCOUNTS_NEWLY_ADDED_STATE' })
    personalizeReady.current = true
  }, [dispatch, handleSave, handleSubmit])

  useEffect(() => {
    if (!personalizeReady.current) return

    if (accounts.length) {
      goToNextRoute()
    }
  }, [goToNextRoute, accounts])

  const handleContactSupport = useCallback(async () => {
    try {
      await createTab('https://help.ambire.com/hc/en-us/requests/new')
    } catch {
      addToast("Couldn't open link", { type: 'error' })
    }
  }, [addToast])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          style={!accountPickerState.pageError && spacings.ptMd}
          withBackButton={!!accountPickerState.pageError}
          onBackButtonPress={() => {
            goToPrevRoute()
          }}
          title={accountPickerState.pageError ? t('Accounts') : undefined}
        >
          {isLoading && !accountPickerState.pageError ? (
            <View style={[flexbox.alignCenter]}>
              <View style={spacings.mbLg}>
                <AccountsLoadingAnimation />
              </View>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <View style={flexbox.flex1} />
                <Text fontSize={20} weight="semiBold" style={[text.center, spacings.phMi]}>
                  {t('Loading accounts')}
                </Text>
                <View style={[flexbox.flex1, flexbox.justifyEnd, { height: '75%' }]}>
                  <AccountsLoadingDotsAnimation />
                </View>
              </View>
            </View>
          ) : accountPickerState.pageError ? (
            <View style={flexbox.alignCenter}>
              <Alert
                type="warning"
                title={accountPickerState.pageError}
                text={
                  <Trans>
                    <Alert.Text type="warning">
                      Please go back and start the account-adding process again. If the problem
                      persists, please{' '}
                      <Pressable onPress={handleContactSupport}>
                        <Alert.Text type="warning" style={text.underline}>
                          contact our support team
                        </Alert.Text>
                      </Pressable>
                      .
                    </Alert.Text>
                  </Trans>
                }
              />
            </View>
          ) : (
            <>
              <View style={[flexbox.alignCenter, spacings.mbXl]}>
                <View style={styles.checkIconOuterWrapper}>
                  <View style={styles.checkIconInnerWrapper}>
                    <CheckIcon color={theme.successDecorative} width={28} height={28} />
                  </View>
                </View>
                <Text weight="semiBold" fontSize={20}>
                  {t('Added successfully')}
                </Text>
              </View>
              <ScrollView style={spacings.mbLg}>
                {accountsToPersonalize.map((acc, index) => (
                  <AccountPersonalizeCard
                    key={acc.addr}
                    control={control}
                    index={index}
                    account={acc}
                    hasBottomSpacing={index !== fields.length - 1}
                    onSave={handleSave as any}
                  />
                ))}
              </ScrollView>
              <Button
                testID="button-save-and-continue"
                size="large"
                onPress={handleGetStarted}
                hasBottomSpacing={false}
                text={isSetupComplete ? t('Open dashboard') : t('Complete')}
              />
              {['seed', 'hw'].includes(accountPickerState.subType as any) && (
                <View style={spacings.ptLg}>
                  <Button
                    testID="add-more-accounts-btn"
                    type="ghost"
                    text={t('Add more accounts from this {{source}}', {
                      source:
                        accountPickerState.subType === 'hw' ? 'hardware wallet' : 'recovery phrase'
                    })}
                    onPress={() => {
                      handleSave()
                      goToNextRoute(WEB_ROUTES.accountPicker)
                    }}
                    textStyle={{ fontSize: 14, color: theme.primary, letterSpacing: -0.1 }}
                    style={{ ...spacings.ph0, height: 22 }}
                    hasBottomSpacing={false}
                    childrenPosition="left"
                  >
                    <Text fontSize={24} weight="light" style={spacings.mrTy} color={theme.primary}>
                      +
                    </Text>
                  </Button>
                </View>
              )}
            </>
          )}
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(AccountPersonalizeScreen)

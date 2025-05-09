import React, { createContext, useEffect, useMemo, useState } from 'react'

import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useExtensionUpdateControllerState from '@web/hooks/useExtensionUpdateControllerState'
import useFeatureFlagsControllerState from '@web/hooks/useFeatureFlagsControllerState'
import useInviteControllerState from '@web/hooks/useInviteControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState/useMainControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePhishingControllerState from '@web/hooks/usePhishingControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useProvidersControllerState from '@web/hooks/useProvidersControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import useStorageControllerState from '@web/hooks/useStorageControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import { getUiType } from '@web/utils/uiType'

const ControllersStateLoadedContext = createContext<{
  areControllerStatesLoaded: boolean
  isStatesLoadingTakingTooLong: boolean
}>({
  areControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

const { isPopup } = getUiType()

const ControllersStateLoadedProvider: React.FC<any> = ({ children }) => {
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)
  const { dispatch } = useBackgroundService()
  const accountPickerState = useAccountPickerControllerState()
  const keystoreState = useKeystoreControllerState()
  const mainState = useMainControllerState()
  const storageCtrl = useStorageControllerState()
  const networksState = useNetworksControllerState()
  const providersState = useProvidersControllerState()
  const accountsState = useAccountsControllerState()
  const selectedAccountState = useSelectedAccountControllerState()
  const walletState = useWalletStateController()
  const signMessageState = useSignMessageControllerState()
  const actionsState = useActionsControllerState()
  const activityState = useActivityControllerState()
  const portfolioState = usePortfolioControllerState()
  const emailVaultState = useEmailVaultControllerState()
  const phishingState = usePhishingControllerState()
  const { state: dappsState } = useDappsControllerState()
  const addressBookState = useAddressBookControllerState()
  const domainsControllerState = useDomainsControllerState()
  const inviteControllerState = useInviteControllerState()
  const swapAndBridgeControllerState = useSwapAndBridgeControllerState()
  const extensionUpdateControllerState = useExtensionUpdateControllerState()
  const featureFlagsControllerState = useFeatureFlagsControllerState()
  const transactionManagerControllerState = useTransactionControllerState()

  const hasMainState: boolean = useMemo(
    () => !!Object.keys(mainState).length && !!mainState?.isReady,
    [mainState]
  )
  const hasStorageState: boolean = useMemo(() => !!Object.keys(storageCtrl).length, [storageCtrl])
  const hasNetworksState: boolean = useMemo(
    () => !!Object.keys(networksState).length,
    [networksState]
  )
  const hasProvidersState: boolean = useMemo(
    () => !!Object.keys(providersState).length,
    [providersState]
  )
  const hasAccountsState: boolean = useMemo(
    () => !!Object.keys(accountsState).length,
    [accountsState]
  )
  const hasSelectedAccountState: boolean = useMemo(
    () => !!Object.keys(selectedAccountState).length,
    [selectedAccountState]
  )
  const hasWalletState: boolean = useMemo(
    () => !!Object.keys(walletState).length && !!walletState?.isReady,
    [walletState]
  )
  const hasAccountPickerState: boolean = useMemo(
    () => !!Object.keys(accountPickerState).length,
    [accountPickerState]
  )
  const hasKeystoreState: boolean = useMemo(
    () => !!Object.keys(keystoreState).length,
    [keystoreState]
  )
  const hasSignMessageState: boolean = useMemo(
    () => !!Object.keys(signMessageState).length,
    [signMessageState]
  )
  const hasActionsState: boolean = useMemo(() => !!Object.keys(actionsState).length, [actionsState])
  const hasPortfolioState: boolean = useMemo(
    () => !!Object.keys(portfolioState).length,
    [portfolioState]
  )
  const hasActivityState: boolean = useMemo(
    () => !!Object.keys(activityState).length,
    [activityState]
  )
  const hasEmailVaultState: boolean = useMemo(
    () => !!Object.keys(emailVaultState).length && !!emailVaultState?.isReady,
    [emailVaultState]
  )
  const hasPhishingState: boolean = useMemo(
    () => !!Object.keys(phishingState).length,
    [phishingState]
  )
  const hasDappsState: boolean = useMemo(
    () => !!Object.keys(dappsState).length && dappsState.isReady,
    [dappsState]
  )
  const hasDomainsState: boolean = useMemo(
    () => !!Object.keys(domainsControllerState).length,
    [domainsControllerState]
  )
  const hasAddressBookState: boolean = useMemo(
    () => !!Object.keys(addressBookState).length,
    [addressBookState]
  )
  const hasInviteState: boolean = useMemo(
    () => !!Object.keys(inviteControllerState).length,
    [inviteControllerState]
  )
  const hasSwapAndBridgeState: boolean = useMemo(
    () => !!Object.keys(swapAndBridgeControllerState).length,
    [swapAndBridgeControllerState]
  )
  const hasTransactionManagerState: boolean = useMemo(
    () => !!Object.keys(transactionManagerControllerState).length,
    [transactionManagerControllerState]
  )
  const hasExtensionUpdateState: boolean = useMemo(
    () => !!Object.keys(extensionUpdateControllerState).length,
    [extensionUpdateControllerState]
  )
  const hasFeatureFlagsControllerState: boolean = useMemo(
    () => !!Object.keys(featureFlagsControllerState).length,
    [featureFlagsControllerState]
  )

  useEffect(() => {
    if (areControllerStatesLoaded) return
    // Safeguard against a potential race condition where one of the controller
    // states might not update properly and the `areControllerStatesLoaded`
    // might get stuck in `false` state forever. If the timeout gets reached,
    // the app displays feedback to the user (via the
    // `isStatesLoadingTakingTooLong` flag).
    const timeout = setTimeout(() => setIsStatesLoadingTakingTooLong(true), 10000)
    if (
      hasMainState &&
      hasStorageState &&
      hasNetworksState &&
      hasProvidersState &&
      hasAccountsState &&
      hasSelectedAccountState &&
      hasWalletState &&
      hasAccountPickerState &&
      hasKeystoreState &&
      hasSignMessageState &&
      hasActionsState &&
      hasPortfolioState &&
      hasActivityState &&
      hasEmailVaultState &&
      hasPhishingState &&
      hasDappsState &&
      hasDomainsState &&
      hasAddressBookState &&
      hasInviteState &&
      hasSwapAndBridgeState &&
      hasExtensionUpdateState &&
      hasFeatureFlagsControllerState &&
      hasTransactionManagerState
    ) {
      clearTimeout(timeout)
      if (isPopup) dispatch({ type: 'MAIN_CONTROLLER_ON_POPUP_OPEN' })
      setAreControllerStatesLoaded(true)
    }

    return () => clearTimeout(timeout)
  }, [
    hasMainState,
    hasStorageState,
    hasNetworksState,
    hasProvidersState,
    hasAccountsState,
    hasSelectedAccountState,
    hasWalletState,
    hasAccountPickerState,
    hasKeystoreState,
    hasSignMessageState,
    hasActionsState,
    hasPortfolioState,
    hasActivityState,
    hasEmailVaultState,
    hasPhishingState,
    hasDappsState,
    areControllerStatesLoaded,
    hasDomainsState,
    hasAddressBookState,
    hasInviteState,
    hasSwapAndBridgeState,
    hasExtensionUpdateState,
    hasFeatureFlagsControllerState,
    hasTransactionManagerState,
    dispatch
  ])

  return (
    <ControllersStateLoadedContext.Provider
      value={useMemo(
        () => ({ areControllerStatesLoaded, isStatesLoadingTakingTooLong }),
        [areControllerStatesLoaded, isStatesLoadingTakingTooLong]
      )}
    >
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }

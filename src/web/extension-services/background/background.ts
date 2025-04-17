/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
import 'setimmediate'

import { nanoid } from 'nanoid'

import EmittableError from '@ambire-common/classes/EmittableError'
import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ACCOUNT_STATE_PENDING_INTERVAL,
  ACCOUNT_STATE_STAND_BY_INTERVAL,
  ACTIVE_EXTENSION_DEFI_POSITIONS_UPDATE_INTERVAL,
  ACTIVE_EXTENSION_PORTFOLIO_UPDATE_INTERVAL,
  ACTIVITY_REFRESH_INTERVAL,
  INACTIVE_EXTENSION_DEFI_POSITION_UPDATE_INTERVAL,
  INACTIVE_EXTENSION_PORTFOLIO_UPDATE_INTERVAL,
  UPDATE_SWAP_AND_BRIDGE_QUOTE_INTERVAL
} from '@ambire-common/consts/intervals'
import { MainController } from '@ambire-common/controllers/main/main'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { Fetch } from '@ambire-common/interfaces/fetch'
import { ActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import { getAccountKeysCount } from '@ambire-common/libs/keys/keys'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { getNetworksWithFailedRPC } from '@ambire-common/libs/networks/networks'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import {
  getActiveRoutesLowestServiceTime,
  getActiveRoutesUpdateInterval
} from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import { createRecurringTimeout } from '@ambire-common/utils/timeout'
import wait from '@ambire-common/utils/wait'
import { isProd } from '@common/config/env'
import {
  BROWSER_EXTENSION_LOG_UPDATED_CONTROLLER_STATE_ONLY,
  RELAYER_URL,
  SOCKET_API_KEY,
  VELCRO_URL
} from '@env'
import { browser } from '@web/constants/browserapi'
import { Action } from '@web/extension-services/background/actions'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { BadgesController } from '@web/extension-services/background/controllers/badges'
import ExtensionUpdateController from '@web/extension-services/background/controllers/extension-update'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { handleActions } from '@web/extension-services/background/handlers/handleActions'
import { handleCleanUpOnPortDisconnect } from '@web/extension-services/background/handlers/handleCleanUpOnPortDisconnect'
import { handleKeepAlive } from '@web/extension-services/background/handlers/handleKeepAlive'
import {
  handleKeepBridgeContentScriptAcrossSessions,
  handleRegisterScripts
} from '@web/extension-services/background/handlers/handleScripting'
import handleProviderRequests from '@web/extension-services/background/provider/handleProviderRequests'
import { providerRequestTransport } from '@web/extension-services/background/provider/providerRequestTransport'
import { controllersNestedInMainMapping } from '@web/extension-services/background/types'
import { notificationManager } from '@web/extension-services/background/webapi/notification'
import { storage } from '@web/extension-services/background/webapi/storage'
import windowManager from '@web/extension-services/background/webapi/window'
import { initializeMessenger, Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeController from '@web/modules/hardware-wallet/controllers/LatticeController'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import TrezorController from '@web/modules/hardware-wallet/controllers/TrezorController'
import LatticeSigner from '@web/modules/hardware-wallet/libs/LatticeSigner'
import LedgerSigner from '@web/modules/hardware-wallet/libs/LedgerSigner'
import TrezorSigner from '@web/modules/hardware-wallet/libs/TrezorSigner'
import { getExtensionInstanceId } from '@web/utils/analytics'
import getOriginFromUrl from '@web/utils/getOriginFromUrl'
import { logInfoWithPrefix } from '@web/utils/logger'

function stateDebug(event: string, stateToLog: object, ctrlName: string) {
  // Send the controller's state from the background to the Puppeteer testing environment for E2E test debugging.
  // Puppeteer listens for console.log events and will output the message to the CI console.
  // 💡 We need to send it as a string because Puppeteer can't parse console.log message objects.
  // 💡 `logInfoWithPrefix` wraps console.log, and we can't add a listener to it from the Puppeteer configuration.
  // That's why we use the native `console.log` method here to send the state to Puppeteer.
  if (process.env.E2E_DEBUG === 'true') {
    console.log(stringify(stateToLog))
  }

  // In production, we avoid logging the complete state because `parse(stringify(stateToLog))` can be CPU-intensive.
  // This is especially true for the main controller, which includes all sub-controller states.
  // For example, the portfolio state for a single account can exceed 2.0MB, and `parse(stringify(portfolio))`
  // can take over 100ms to execute. With multiple consecutive updates, this can add up to over a second,
  // causing the extension to slow down or freeze.
  // Instead of logging with `logInfoWithPrefix` in production, we rely on EventEmitter.emitError() to log individual errors
  // (instead of the entire state) to the user console, which aids in debugging without significant performance costs.
  if (process.env.APP_ENV === 'production') return

  const args = parse(stringify(stateToLog))
  const ctrlState = ctrlName === 'main' ? args : args[ctrlName]

  const logData =
    BROWSER_EXTENSION_LOG_UPDATED_CONTROLLER_STATE_ONLY === 'true' ? ctrlState : { ...args }

  logInfoWithPrefix(event, logData)
}

const bridgeMessenger = initializeMessenger({ connect: 'inpage' })
let mainCtrl: MainController

// eslint-disable-next-line @typescript-eslint/no-floating-promises
handleRegisterScripts()
handleKeepAlive()

// eslint-disable-next-line @typescript-eslint/no-floating-promises
providerRequestTransport.reply(async ({ method, id, params }, meta) => {
  // wait for mainCtrl to be initialized before handling dapp requests
  while (!mainCtrl) await wait(200)

  const tabId = meta.sender?.tab?.id
  if (tabId === undefined || !meta.sender?.url) {
    return
  }

  const origin = getOriginFromUrl(meta.sender.url)
  const session = mainCtrl.dapps.getOrCreateDappSession({ tabId, origin })

  await mainCtrl.dapps.initialLoadPromise
  mainCtrl.dapps.setSessionMessenger(session.sessionId, bridgeMessenger)

  try {
    const res = await handleProviderRequests(
      {
        method,
        params,
        session,
        origin
      },
      mainCtrl,
      id
    )
    return { id, result: res }
  } catch (error: any) {
    let errorRes
    try {
      errorRes = error.serialize()
    } catch (e) {
      errorRes = error
    }
    return { id, error: errorRes }
  }
})

handleKeepBridgeContentScriptAcrossSessions()

function getIntervalRefreshTime(constUpdateInterval: number, newestOpTimestamp: number): number {
  // 5s + new Date().getTime() - timestamp of newest op / 10
  // here are some example of what this means:
  // 1s diff between now and newestOpTimestamp: 5.1s
  // 10s diff between now and newestOpTimestamp: 6s
  // 60s diff between now and newestOpTimestamp: 11s
  // 5m diff between now and newestOpTimestamp: 35s
  // 10m diff between now and newestOpTimestamp: 65s
  return newestOpTimestamp === 0
    ? constUpdateInterval
    : constUpdateInterval + (new Date().getTime() - newestOpTimestamp) / 10
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  // In the testing environment, we need to slow down app initialization.
  // This is necessary to predefine the chrome.storage testing values in our Puppeteer tests,
  // ensuring that the Controllers are initialized with the storage correctly.
  // Once the storage is configured in Puppeteer, we set the `isE2EStorageSet` flag to true.
  // Here, we are waiting for its value to be set.
  if (process.env.IS_TESTING === 'true') {
    const checkE2EStorage = async (): Promise<void> => {
      const isE2EStorageSet = !!(await storage.get('isE2EStorageSet', false))

      if (isE2EStorageSet) {
        return
      }

      await wait(100)
      await checkE2EStorage()
    }

    await checkE2EStorage()
  }

  const backgroundState: {
    isUnlocked: boolean
    ctrlOnUpdateIsDirtyFlags: { [key: string]: boolean }
    accountStateIntervals: {
      pending: number
      standBy: number
      retriedFastAccountStateReFetchForNetworks: string[]
      fastAccountStateReFetchTimeout?: ReturnType<typeof setTimeout>
    }
    activityRefreshInterval: number
    hasSignAccountOpCtrlInitialized: boolean
    portfolioLastUpdatedByIntervalAt: number
    updatePortfolioInterval?: ReturnType<typeof setTimeout>
    updateDefiPositionsInterval?: ReturnType<typeof setTimeout>
    autoLockIntervalId?: ReturnType<typeof setInterval>
    accountsOpsStatusesInterval?: ReturnType<typeof setTimeout>
    updateActiveRoutesInterval?: ReturnType<typeof setTimeout>
    updateSwapAndBridgeQuoteInterval?: ReturnType<typeof setTimeout>
    swapAndBridgeQuoteStatus: 'INITIAL' | 'LOADING'
    estimateTimeout?: { start: any; stop: any }
    accountStateLatestInterval?: ReturnType<typeof setTimeout>
    accountStatePendingInterval?: ReturnType<typeof setTimeout>
    selectedAccountStateInterval?: number
    networksLastUpdatedByIntervalAt: number
    updateNetworksInterval?: ReturnType<typeof setTimeout>
  } = {
    /**
      ctrlOnUpdateIsDirtyFlags will be set to true for a given ctrl when it receives an update in the ctrl.onUpdate callback.
      While the flag is truthy and there are new updates coming for that ctrl in the same tick, they will be debounced and only one event will be executed at the end
    */
    isUnlocked: false,
    ctrlOnUpdateIsDirtyFlags: {},
    accountStateIntervals: {
      pending: ACCOUNT_STATE_PENDING_INTERVAL,
      standBy: ACCOUNT_STATE_STAND_BY_INTERVAL,
      retriedFastAccountStateReFetchForNetworks: []
    },
    activityRefreshInterval: ACTIVITY_REFRESH_INTERVAL,
    hasSignAccountOpCtrlInitialized: false,
    swapAndBridgeQuoteStatus: 'INITIAL',
    portfolioLastUpdatedByIntervalAt: Date.now(), // Because the first update is immediate
    networksLastUpdatedByIntervalAt: Date.now()
  }

  const pm = new PortMessenger()
  const ledgerCtrl = new LedgerController()
  const trezorCtrl = new TrezorController()
  const latticeCtrl = new LatticeController()

  // Extension-specific additional trackings
  const fetchWithAnalytics: Fetch = (url, init) => {
    // As of v4.26.0, custom extension-specific headers. TBD for the other apps.
    const initWithCustomHeaders = init || { headers: { 'x-app-source': '' } }
    initWithCustomHeaders.headers = initWithCustomHeaders.headers || {}

    // if the fetch method is called while the keystore is constructing the keyStoreUid won't be defined yet
    // in that case we can still fetch but without our custom header
    if (mainCtrl?.keystore?.keyStoreUid) {
      const instanceId = getExtensionInstanceId(mainCtrl.keystore.keyStoreUid)
      const inviteVerifiedCode = mainCtrl.invite.verifiedCode || ''
      initWithCustomHeaders.headers['x-app-source'] = instanceId + inviteVerifiedCode
    }

    // As of v4.36.0, for metric purposes, pass the account keys count as an
    // additional param for the batched velcro discovery requests.
    const shouldAttachKeyCountParam = url.toString().startsWith(`${VELCRO_URL}/multi-hints?`)
    if (shouldAttachKeyCountParam) {
      const urlObj = new URL(url.toString())
      const accounts = urlObj.searchParams.get('accounts')

      if (accounts) {
        const accountKeysCount = accounts.split(',').map((accountAddr) => {
          return getAccountKeysCount({
            accountAddr,
            keys: mainCtrl.keystore.keys,
            accounts: mainCtrl.accounts.accounts
          })
        })

        urlObj.searchParams.append('sigs', accountKeysCount.join(','))
        // Override the URL and replace encoded commas (%2C) with actual commas
        // eslint-disable-next-line no-param-reassign
        url = urlObj.toString().replace(/%2C/g, ',')
      }
    }

    // Use the native fetch (instead of node-fetch or whatever else) since
    // browser extensions are designed to run within the web environment,
    // which already provides a native and well-optimized fetch API.
    return fetch(url, initWithCustomHeaders)
  }

  mainCtrl = new MainController({
    storage,
    fetch: fetchWithAnalytics,
    relayerUrl: RELAYER_URL,
    velcroUrl: VELCRO_URL,
    socketApiKey: SOCKET_API_KEY,
    keystoreSigners: {
      internal: KeystoreSigner,
      // TODO: there is a mismatch in hw signer types, it's not a big deal
      ledger: LedgerSigner,
      trezor: TrezorSigner,
      lattice: LatticeSigner
    } as any,
    externalSignerControllers: {
      ledger: ledgerCtrl,
      trezor: trezorCtrl,
      lattice: latticeCtrl
    } as any,
    windowManager: {
      ...windowManager,
      sendWindowToastMessage: (text, options) => {
        pm.send('> ui-toast', { method: 'addToast', params: { text, options } })
      },
      sendWindowUiMessage: (params) => {
        pm.send('> ui', { method: 'receiveOneTimeData', params })
      }
    },
    notificationManager
  })

  const walletStateCtrl = new WalletStateController()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const badgesCtrl = new BadgesController(mainCtrl)
  const autoLockCtrl = new AutoLockController(() => {
    // Prevents sending multiple notifications if the event is triggered multiple times
    if (mainCtrl.keystore.isUnlocked) {
      notificationManager
        .create({
          title: 'Ambire locked',
          message: 'Your wallet has been locked due to inactivity.'
        })
        .catch((err) => {
          console.error('Failed to create notification', err)
        })
    }
    mainCtrl.keystore.lock()
  })
  const extensionUpdateCtrl = new ExtensionUpdateController()

  /**
   * Schedules periodic network synchronization.
   *
   * This function ensures that the `synchronizeNetworks` method runs every 8 hours
   * to periodically refetch networks in case there are updates,
   * since the extension relies on the config from relayer.
   *
   * Networks are also updated on NetworksController load and background process refresh,
   * but this ensures they stay refreshed.
   * Because of this, tt does **not** execute immediately at startup, only after the first interval.
   */
  function scheduleNetworkSync() {
    if (backgroundState.updateNetworksInterval) {
      clearTimeout(backgroundState.updateNetworksInterval)
    }

    backgroundState.updateNetworksInterval = setTimeout(async () => {
      try {
        await mainCtrl.networks.synchronizeNetworks()
        backgroundState.networksLastUpdatedByIntervalAt = Date.now()
      } catch (error) {
        console.error('Failed to synchronize networks:', error)
      }

      scheduleNetworkSync()
    }, 8 * 60 * 60 * 1000)
  }

  scheduleNetworkSync()

  async function initPortfolioContinuousUpdate() {
    if (backgroundState.updatePortfolioInterval)
      clearTimeout(backgroundState.updatePortfolioInterval)

    const isExtensionActive = pm.ports.length > 0 // (opened tab, popup, action-window)
    const updateInterval = isExtensionActive
      ? ACTIVE_EXTENSION_PORTFOLIO_UPDATE_INTERVAL
      : INACTIVE_EXTENSION_PORTFOLIO_UPDATE_INTERVAL

    async function updatePortfolio() {
      // Postpone the portfolio update for the next interval
      // if we have broadcasted but not yet confirmed acc op.
      // Here's why:
      // 1. On the Dashboard, we show a pending-to-be-confirmed token badge
      //    if an acc op has been broadcasted but is still unconfirmed.
      // 2. To display the expected balance change, we calculate it from the portfolio's pending simulation state.
      // 3. When we sign and broadcast the acc op, we remove it from the Main controller.
      // 4. If we trigger a portfolio update at this point, we will lose the pending simulation state.
      // 5. Therefore, to ensure the badge is displayed, we pause the portfolio update temporarily.
      //    Once the acc op is confirmed or failed, the portfolio interval will resume as normal.
      // 6. Gotcha: If the user forcefully updates the portfolio, we will also lose the simulation.
      //    However, this is not a frequent case, and we can make a compromise here.
      if (mainCtrl.activity.broadcastedButNotConfirmed.length) {
        backgroundState.updatePortfolioInterval = setTimeout(updatePortfolio, updateInterval)
        return
      }

      await mainCtrl.updateSelectedAccountPortfolio()

      backgroundState.portfolioLastUpdatedByIntervalAt = Date.now()
      // Schedule the next update only when the previous one completes
      backgroundState.updatePortfolioInterval = setTimeout(updatePortfolio, updateInterval)
    }

    const isAtLeastOnePortfolioUpdateMissed =
      Date.now() - backgroundState.portfolioLastUpdatedByIntervalAt >
      INACTIVE_EXTENSION_PORTFOLIO_UPDATE_INTERVAL

    // If the extension is inactive and the last update was missed, update the portfolio immediately
    if (isAtLeastOnePortfolioUpdateMissed) {
      clearTimeout(backgroundState.updatePortfolioInterval)
      await updatePortfolio()
    } else {
      // Start the first update
      backgroundState.updatePortfolioInterval = setTimeout(updatePortfolio, updateInterval)
    }
  }

  async function initDefiPositionsContinuousUpdate() {
    if (backgroundState.updateDefiPositionsInterval)
      clearTimeout(backgroundState.updateDefiPositionsInterval)

    const isExtensionActive = pm.ports.length > 0 // (opened tab, popup, action-window)
    const updateInterval = isExtensionActive
      ? ACTIVE_EXTENSION_DEFI_POSITIONS_UPDATE_INTERVAL
      : INACTIVE_EXTENSION_DEFI_POSITION_UPDATE_INTERVAL

    async function updateDefiPositions() {
      await mainCtrl.defiPositions.updatePositions()
      // Schedule the next update only when the previous one completes
      backgroundState.updateDefiPositionsInterval = setTimeout(updateDefiPositions, updateInterval)
    }

    backgroundState.updateDefiPositionsInterval = setTimeout(updateDefiPositions, updateInterval)
  }

  function initAccountsOpsStatusesContinuousUpdate(updateInterval: number) {
    if (backgroundState.accountsOpsStatusesInterval)
      clearTimeout(backgroundState.accountsOpsStatusesInterval)

    async function updateStatuses() {
      const { newestOpTimestamp } = await mainCtrl.updateAccountsOpsStatuses()

      // Schedule the next update only when the previous one completes
      const interval = getIntervalRefreshTime(updateInterval, newestOpTimestamp)
      backgroundState.accountsOpsStatusesInterval = setTimeout(updateStatuses, interval)
    }

    backgroundState.accountsOpsStatusesInterval = setTimeout(updateStatuses, updateInterval)
  }

  function initActiveRoutesContinuousUpdate(activeRoutesInProgress?: ActiveRoute[]) {
    if (!activeRoutesInProgress || !activeRoutesInProgress.length) {
      !!backgroundState.updateActiveRoutesInterval &&
        clearTimeout(backgroundState.updateActiveRoutesInterval)
      delete backgroundState.updateActiveRoutesInterval
      return
    }
    if (backgroundState.updateActiveRoutesInterval) return

    let minServiceTime = getActiveRoutesLowestServiceTime(activeRoutesInProgress)

    async function updateActiveRoutes() {
      minServiceTime = getActiveRoutesLowestServiceTime(activeRoutesInProgress!)
      await mainCtrl.swapAndBridge.checkForNextUserTxForActiveRoutes()

      // Schedule the next update only when the previous one completes
      backgroundState.updateActiveRoutesInterval = setTimeout(
        updateActiveRoutes,
        getActiveRoutesUpdateInterval(minServiceTime)
      )
    }

    backgroundState.updateActiveRoutesInterval = setTimeout(
      updateActiveRoutes,
      getActiveRoutesUpdateInterval(minServiceTime)
    )
  }

  function initSwapAndBridgeQuoteContinuousUpdate() {
    if (mainCtrl.swapAndBridge.formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit) {
      !!backgroundState.updateSwapAndBridgeQuoteInterval &&
        clearTimeout(backgroundState.updateSwapAndBridgeQuoteInterval)
      delete backgroundState.updateSwapAndBridgeQuoteInterval
      return
    }

    // This logic is triggered when the user manually refreshes the quotes,
    // resetting the interval to synchronize with the UI.
    if (
      backgroundState.updateSwapAndBridgeQuoteInterval &&
      backgroundState.swapAndBridgeQuoteStatus === 'LOADING' &&
      mainCtrl.swapAndBridge.updateQuoteStatus === 'INITIAL'
    ) {
      clearTimeout(backgroundState.updateSwapAndBridgeQuoteInterval)
      delete backgroundState.updateSwapAndBridgeQuoteInterval
    }

    if (backgroundState.updateSwapAndBridgeQuoteInterval) return

    async function updateSwapAndBridgeQuote() {
      if (mainCtrl.swapAndBridge.formStatus === SwapAndBridgeFormStatus.ReadyToSubmit)
        await mainCtrl.swapAndBridge.updateQuote({
          skipPreviousQuoteRemoval: true,
          skipQuoteUpdateOnSameValues: false,
          skipStatusUpdate: false
        })

      // Schedule the next update only when the previous one completes
      backgroundState.updateSwapAndBridgeQuoteInterval = setTimeout(
        updateSwapAndBridgeQuote,
        UPDATE_SWAP_AND_BRIDGE_QUOTE_INTERVAL
      )
    }

    backgroundState.updateSwapAndBridgeQuoteInterval = setTimeout(
      updateSwapAndBridgeQuote,
      UPDATE_SWAP_AND_BRIDGE_QUOTE_INTERVAL
    )
  }

  /**
   * Updates the account state for the selected account. Doesn't update the state for networks with failed RPC as this is handled by a different interval.
   */
  async function initLatestAccountStateContinuousUpdate(intervalLength: number) {
    if (backgroundState.accountStateLatestInterval)
      clearTimeout(backgroundState.accountStateLatestInterval)

    const updateAccountState = async () => {
      if (!mainCtrl.selectedAccount.account) {
        console.error('No selected account to latest state')
        return
      }
      const failedChainIds = getNetworksWithFailedRPC({
        providers: mainCtrl.providers.providers
      })
      const networksToUpdate = mainCtrl.networks.networks
        .filter(({ chainId }) => !failedChainIds.includes(chainId.toString()))
        .map(({ chainId }) => chainId)

      await mainCtrl.accounts.updateAccountState(
        mainCtrl.selectedAccount.account.addr,
        'latest',
        networksToUpdate
      )
      backgroundState.accountStateLatestInterval = setTimeout(updateAccountState, intervalLength)
    }

    // Start the first update
    backgroundState.accountStateLatestInterval = setTimeout(updateAccountState, intervalLength)
  }

  async function initPendingAccountStateContinuousUpdate(intervalLength: number) {
    if (!mainCtrl.selectedAccount.account) {
      console.error('No selected account to update pending state')
      return
    }

    if (backgroundState.accountStatePendingInterval)
      clearTimeout(backgroundState.accountStatePendingInterval)

    const networksToUpdate = mainCtrl.activity.broadcastedButNotConfirmed
      .map((op) => op.chainId)
      .filter((chainId, index, self) => self.indexOf(chainId) === index)
    await mainCtrl.accounts.updateAccountState(
      mainCtrl.selectedAccount.account.addr,
      'pending',
      networksToUpdate
    )

    const updateAccountState = async (chainIds: bigint[]) => {
      if (!mainCtrl.selectedAccount.account) {
        console.error('No selected account to update pending state')
        return
      }

      await mainCtrl.accounts.updateAccountState(
        mainCtrl.selectedAccount.account.addr,
        'pending',
        chainIds
      )

      // if there are no more broadcastedButNotConfirmed ops for the network,
      // remove the timeout
      const networksToUpdate = mainCtrl.activity.broadcastedButNotConfirmed
        .map((op) => op.chainId)
        .filter((chainId, index, self) => self.indexOf(chainId) === index)
      if (!networksToUpdate.length) {
        clearTimeout(backgroundState.accountStatePendingInterval)
      } else {
        // Schedule the next update
        const newestOpTimestamp = mainCtrl.activity.broadcastedButNotConfirmed.reduce(
          (newestTimestamp, accOp) => {
            return accOp.timestamp > newestTimestamp ? accOp.timestamp : newestTimestamp
          },
          0
        )
        const interval = getIntervalRefreshTime(intervalLength, newestOpTimestamp)
        backgroundState.accountStatePendingInterval = setTimeout(
          () => updateAccountState(networksToUpdate),
          interval
        )
      }
    }

    // Start the first update
    backgroundState.accountStatePendingInterval = setTimeout(
      () => updateAccountState(networksToUpdate),
      intervalLength / 2
    )
  }

  /** Update failed network states more often. If a network's first failed
   *  update is just now, retry in 8s. If it's a repeated failure, retry in 20s.
   */
  function initFrequentLatestAccountStateContinuousUpdateIfNeeded() {
    const isExtensionActive = pm.ports.length > 0

    if (backgroundState.accountStateIntervals.fastAccountStateReFetchTimeout) {
      clearTimeout(backgroundState.accountStateIntervals.fastAccountStateReFetchTimeout)
    }

    // If there are no open ports the account state will be updated
    // automatically when the extension is opened.
    if (!isExtensionActive) return

    const updateAccountState = async () => {
      const failedChainIds = getNetworksWithFailedRPC({
        providers: mainCtrl.providers.providers
      })

      if (!failedChainIds.length) return

      const retriedFastAccountStateReFetchForNetworks =
        backgroundState.accountStateIntervals.retriedFastAccountStateReFetchForNetworks

      // Delete the network ids that have been successfully re-fetched so the logic can be re-applied
      // if the RPC goes down again
      if (retriedFastAccountStateReFetchForNetworks.length) {
        retriedFastAccountStateReFetchForNetworks.forEach((chainId, index) => {
          if (!failedChainIds.includes(chainId)) {
            delete retriedFastAccountStateReFetchForNetworks[index]
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            mainCtrl.updateSelectedAccountPortfolio(
              false,
              mainCtrl.networks.networks.find((n) => n.chainId.toString() === chainId)
            )
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            mainCtrl.defiPositions.updatePositions({ chainId: BigInt(chainId) })
          }
        })
      }

      // Filter out the network ids that have already been retried
      const recentlyFailedNetworks = failedChainIds.filter(
        (id) =>
          !backgroundState.accountStateIntervals.retriedFastAccountStateReFetchForNetworks.find(
            (chainId) => chainId === id
          )
      )

      const updateTime = recentlyFailedNetworks.length ? 8000 : 20000

      await mainCtrl.accounts.updateAccountStates(
        'latest',
        failedChainIds.map((id) => BigInt(id))
      )
      // Add the network ids that have been retried to the list
      failedChainIds.forEach((id) => {
        if (retriedFastAccountStateReFetchForNetworks.includes(id)) return

        retriedFastAccountStateReFetchForNetworks.push(id)
      })

      if (!failedChainIds.length) return

      backgroundState.accountStateIntervals.fastAccountStateReFetchTimeout = setTimeout(
        updateAccountState,
        updateTime
      )
    }

    backgroundState.accountStateIntervals.fastAccountStateReFetchTimeout = setTimeout(
      updateAccountState,
      8000
    )
  }

  function createEstimateRecurringTimeout() {
    return createRecurringTimeout(() => {
      if (mainCtrl.signAccountOp) return mainCtrl.signAccountOp.simulate()
      return new Promise((resolve) => {
        resolve()
      })
    }, 30000)
  }

  function debounceFrontEndEventUpdatesOnSameTick(
    ctrlName: string,
    ctrl: any,
    stateToLog: any,
    forceEmit?: boolean
  ): 'DEBOUNCED' | 'EMITTED' {
    const sendUpdate = () => {
      let stateToSendToFE

      if (ctrlName === 'main') {
        const state = { ...ctrl.toJSON() }
        // We are removing the state of the nested controllers in main to avoid the CPU-intensive task of parsing + stringifying.
        // We should access the state of the nested controllers directly from their context instead of accessing them through the main ctrl state on the FE.
        // Keep in mind: if we just spread `ctrl` instead of calling `ctrl.toJSON()`, the getters won't be included.
        Object.keys(controllersNestedInMainMapping).forEach((nestedCtrlName) => {
          delete state[nestedCtrlName]
        })

        stateToSendToFE = state
      } else {
        stateToSendToFE = ctrl
      }

      pm.send('> ui', { method: ctrlName, params: stateToSendToFE, forceEmit })
      stateDebug(`onUpdate (${ctrlName} ctrl)`, stateToLog, ctrlName)
    }

    /**
     * Bypasses both background and React batching,
     * ensuring that the state update is immediately applied at the application level (React/Extension).
     *
     * For more info, please refer to:
     * EventEmitter.forceEmitUpdate() or useControllerState().
     */
    if (forceEmit) {
      sendUpdate()
      return 'EMITTED'
    }

    if (backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName]) return 'DEBOUNCED'
    backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName] = true

    // Debounce multiple emits in the same tick and only execute one of them
    setTimeout(() => {
      if (backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName]) {
        sendUpdate()
      }
      backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName] = false
    }, 0)

    return 'EMITTED'
  }

  /**
    Initialize the onUpdate callback for the MainController. Once the mainCtrl load is ready,
    initialize the rest of the onUpdate callbacks for the nested controllers of the main controller.
   */
  mainCtrl.onUpdate((forceEmit) => {
    const res = debounceFrontEndEventUpdatesOnSameTick('main', mainCtrl, mainCtrl, forceEmit)
    if (res === 'DEBOUNCED') return

    // if the signAccountOp controller is active, reestimate at a set period of time
    if (backgroundState.hasSignAccountOpCtrlInitialized !== !!mainCtrl.signAccountOp) {
      if (mainCtrl.signAccountOp) {
        backgroundState.estimateTimeout && backgroundState.estimateTimeout.stop()

        backgroundState.estimateTimeout = createEstimateRecurringTimeout()
        backgroundState.estimateTimeout.start()
      } else {
        backgroundState.estimateTimeout && backgroundState.estimateTimeout.stop()
      }

      backgroundState.hasSignAccountOpCtrlInitialized = !!mainCtrl.signAccountOp
    }

    if (mainCtrl.statuses.broadcastSignedAccountOp === 'SUCCESS') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initPendingAccountStateContinuousUpdate(backgroundState.accountStateIntervals.pending)
      initAccountsOpsStatusesContinuousUpdate(backgroundState.activityRefreshInterval)
    }

    Object.keys(controllersNestedInMainMapping).forEach((ctrlName) => {
      const controller = (mainCtrl as any)[ctrlName]
      if (Array.isArray(controller?.onUpdateIds)) {
        /**
         * We have the capability to incorporate multiple onUpdate callbacks for a specific controller, allowing multiple listeners for updates in different files.
         * However, in the context of this background service, we only need a single instance of the onUpdate callback for each controller.
         */
        const hasOnUpdateInitialized = controller.onUpdateIds.includes('background')

        if (!hasOnUpdateInitialized) {
          controller?.onUpdate(async (forceEmit?: boolean) => {
            const res = debounceFrontEndEventUpdatesOnSameTick(
              ctrlName,
              controller,
              mainCtrl,
              forceEmit
            )
            if (res === 'DEBOUNCED') return

            if (ctrlName === 'keystore') {
              if (controller.isReadyToStoreKeys) {
                if (backgroundState.isUnlocked && !controller.isUnlocked) {
                  await mainCtrl.dapps.broadcastDappSessionEvent('lock')
                } else if (!backgroundState.isUnlocked && controller.isUnlocked) {
                  await mainCtrl.dapps.broadcastDappSessionEvent('unlock', [
                    mainCtrl.selectedAccount.account?.addr
                  ])
                }
                backgroundState.isUnlocked = controller.isUnlocked
              }
            }

            if (ctrlName === 'activity') {
              // Start the interval for updating the accounts ops statuses, only if there are broadcasted but not confirmed accounts ops
              if (controller?.broadcastedButNotConfirmed.length) {
                // If the interval is already set, then do nothing.
                if (!backgroundState.accountsOpsStatusesInterval) {
                  initAccountsOpsStatusesContinuousUpdate(backgroundState.activityRefreshInterval)
                }
              } else {
                !!backgroundState.accountsOpsStatusesInterval &&
                  clearTimeout(backgroundState.accountsOpsStatusesInterval)
                delete backgroundState.accountsOpsStatusesInterval
              }
            }
            if (ctrlName === 'providers') {
              initFrequentLatestAccountStateContinuousUpdateIfNeeded()
            }
            if (ctrlName === 'swapAndBridge') {
              initActiveRoutesContinuousUpdate(controller?.activeRoutesInProgress)
              initSwapAndBridgeQuoteContinuousUpdate()
              backgroundState.swapAndBridgeQuoteStatus = controller.updateQuoteStatus
            }
          }, 'background')
        }
      }

      if (Array.isArray(controller?.onErrorIds)) {
        const hasOnErrorInitialized = controller.onErrorIds.includes('background')

        if (!hasOnErrorInitialized) {
          ;(mainCtrl as any)[ctrlName]?.onError(() => {
            stateDebug(`onError (${ctrlName} ctrl)`, mainCtrl, ctrlName)
            pm.send('> ui-error', {
              method: ctrlName,
              params: { errors: (mainCtrl as any)[ctrlName].emittedErrors, controller: ctrlName }
            })
          }, 'background')
        }
      }
    })
  }, 'background')
  mainCtrl.onError(() => {
    stateDebug('onError (main ctrl)', mainCtrl, 'main')
    pm.send('> ui-error', {
      method: 'main',
      params: { errors: mainCtrl.emittedErrors, controller: 'main' }
    })
  })

  // Broadcast onUpdate for the wallet state controller
  walletStateCtrl.onUpdate((forceEmit) => {
    debounceFrontEndEventUpdatesOnSameTick(
      'walletState',
      walletStateCtrl,
      walletStateCtrl,
      forceEmit
    )
  })
  walletStateCtrl.onError(() => {
    pm.send('> ui-error', {
      method: 'walletState',
      params: { errors: walletStateCtrl.emittedErrors, controller: 'walletState' }
    })
  })

  // Broadcast onUpdate for the auto-lock controller
  autoLockCtrl.onUpdate((forceEmit) => {
    debounceFrontEndEventUpdatesOnSameTick('autoLock', autoLockCtrl, autoLockCtrl, forceEmit)
  })
  autoLockCtrl.onError(() => {
    pm.send('> ui-error', {
      method: 'autoLock',
      params: { errors: autoLockCtrl.emittedErrors, controller: 'autoLock' }
    })
  })

  // Broadcast onUpdate for the extension-update controller
  extensionUpdateCtrl.onUpdate((forceEmit) => {
    debounceFrontEndEventUpdatesOnSameTick(
      'extensionUpdate',
      extensionUpdateCtrl,
      extensionUpdateCtrl,
      forceEmit
    )
  })
  extensionUpdateCtrl.onError(() => {
    pm.send('> ui-error', {
      method: 'extensionUpdate',
      params: { errors: extensionUpdateCtrl.emittedErrors, controller: 'extensionUpdate' }
    })
  })

  // listen for messages from UI
  browser.runtime.onConnect.addListener(async (port: Port) => {
    if (['popup', 'tab', 'action-window'].includes(port.name)) {
      // eslint-disable-next-line no-param-reassign
      port.id = nanoid()
      pm.addPort(port)

      // Reset the selected account portfolio when the extension is opened
      // in a popup as the portfolio isn't updated in other cases
      if (port.name === 'popup' && !mainCtrl.activity.broadcastedButNotConfirmed.length) {
        mainCtrl.selectedAccount.resetSelectedAccountPortfolio()
      }

      initPortfolioContinuousUpdate()
      initDefiPositionsContinuousUpdate()
      mainCtrl.phishing.updateIfNeeded()

      // @ts-ignore
      pm.addListener(port.id, async (messageType, action: Action) => {
        const { type } = action
        try {
          if (messageType === '> background' && type) {
            await handleActions(action, {
              pm,
              port,
              mainCtrl,
              ledgerCtrl,
              trezorCtrl,
              latticeCtrl,
              walletStateCtrl,
              autoLockCtrl,
              extensionUpdateCtrl
            })
          }
        } catch (err: any) {
          console.error(`${type} action failed:`, err)
          const shortenedError =
            err.message.length > 150 ? `${err.message.slice(0, 150)}...` : err.message

          let message = `Something went wrong! Please contact support. Error: ${shortenedError}`
          // Emit the raw error only if it's a custom error
          if (err instanceof EmittableError || err instanceof ExternalSignerError) {
            message = err.message
          }

          pm.send('> ui-error', {
            method: type,
            params: {
              errors: [
                {
                  message,
                  level: 'major',
                  error: err
                }
              ]
            }
          })
        }
      })

      port.onDisconnect.addListener(() => {
        pm.dispose(port.id)
        pm.removePort(port.id)
        initPortfolioContinuousUpdate()
        initDefiPositionsContinuousUpdate()
        handleCleanUpOnPortDisconnect({ port, mainCtrl })

        // The selectedAccount portfolio is reset onLoad of the popup
        // (from the background) while the portfolio update is triggered
        // by a useEffect. If that useEffect doesn't trigger, the portfolio
        // state will remain reset until an automatic update is triggered.
        // Example: the user has the dashboard opened in tab, opens the popup
        // and closes it immediately.
        if (port.name === 'popup') {
          mainCtrl.portfolio.forceEmitUpdate()
        }
        if (port.name === 'tab' || port.name === 'action-window') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          ledgerCtrl.cleanUp()
          trezorCtrl.cleanUp()
        }
      })
    }
  })

  initPortfolioContinuousUpdate()
  initDefiPositionsContinuousUpdate()
  await initLatestAccountStateContinuousUpdate(backgroundState.accountStateIntervals.standBy)
})()

try {
  browser.tabs.onRemoved.addListener(async (tabId: number) => {
    // wait for mainCtrl to be initialized before handling dapp requests
    while (!mainCtrl) {
      // eslint-disable-next-line no-await-in-loop
      await wait(200)
    }
    const sessionKeys = Object.keys(mainCtrl.dapps.dappSessions || {})
    // eslint-disable-next-line no-restricted-syntax
    for (const key of sessionKeys.filter((k) => k.startsWith(`${tabId}-`))) {
      mainCtrl.dapps.deleteDappSession(key)
    }
  })
} catch (error) {
  console.error('Failed to register browser.tabs.onRemoved.addListener', error)
}

// Open the get-started screen in a new tab right after the extension is installed.
browser.runtime.onInstalled.addListener(({ reason }: any) => {
  // It makes Puppeteer tests a bit slow (waiting the get-started tab to be loaded, switching back to the tab under the tests),
  // and we prefer to skip opening it for the testing.
  if (process.env.IS_TESTING === 'true') return
  if (isProd) {
    browser.runtime.setUninstallURL('https://www.ambire.com/uninstall')
  }
  if (reason === 'install') {
    setTimeout(() => {
      const extensionURL = browser.runtime.getURL('tab.html')
      browser.tabs.create({ url: extensionURL })
    }, 500)
  }
})

// FIXME: Without attaching an event listener (synchronous) here, the other `navigator.hid`
// listeners that attach when the user interacts with Ledger, are not getting triggered for manifest v3.
if ('hid' in navigator) navigator.hid.addEventListener('disconnect', () => {})

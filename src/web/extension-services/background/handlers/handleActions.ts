/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/return-await */
import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { MainController } from '@ambire-common/controllers/main/main'
import {
  SIGN_ACCOUNT_OP_MAIN,
  SIGN_ACCOUNT_OP_SWAP
} from '@ambire-common/controllers/signAccountOp/helper'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { browser } from '@web/constants/browserapi'
import { Action } from '@web/extension-services/background/actions'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { controllersNestedInMainMapping } from '@web/extension-services/background/types'
import { Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@web/modules/hardware-wallet/libs/trezorKeyIterator'

export const handleActions = async (
  action: Action,
  {
    pm,
    port,
    mainCtrl,
    walletStateCtrl,
    autoLockCtrl,
    extensionUpdateCtrl
  }: {
    pm: PortMessenger
    port: Port
    mainCtrl: MainController
    walletStateCtrl: WalletStateController
    autoLockCtrl: AutoLockController
    extensionUpdateCtrl: ExtensionUpdateController
  }
) => {
  // @ts-ignore
  const { type, params } = action
  switch (type) {
    case 'UPDATE_PORT_URL': {
      if (port.sender) {
        port.sender.url = params.url
        if (port.sender.tab) port.sender.tab.url = params.url
      }
      break
    }
    case 'INIT_CONTROLLER_STATE': {
      if (params.controller === ('main' as any)) {
        const mainCtrlState: any = { ...mainCtrl.toJSON() }
        // We are removing the state of the nested controllers in main to avoid the CPU-intensive task of parsing + stringifying.
        // We should access the state of the nested controllers directly from their context instead of accessing them through the main ctrl state on the FE.
        // Keep in mind: if we just spread `ctrl` instead of calling `ctrl.toJSON()`, the getters won't be included.
        Object.keys(controllersNestedInMainMapping).forEach((nestedCtrlName) => {
          delete mainCtrlState[nestedCtrlName]
        })
        pm.send('> ui', { method: 'main', params: mainCtrlState })
      } else if (params.controller === ('walletState' as any)) {
        pm.send('> ui', { method: 'walletState', params: walletStateCtrl })
      } else if (params.controller === ('autoLock' as any)) {
        pm.send('> ui', { method: 'autoLock', params: autoLockCtrl })
      } else if (params.controller === ('extensionUpdate' as any)) {
        pm.send('> ui', { method: 'extensionUpdate', params: extensionUpdateCtrl })
      } else {
        pm.send('> ui', {
          method: params.controller,
          params: (mainCtrl as any)[params.controller]
        })
      }
      break
    }
    case 'MAIN_CONTROLLER_ON_POPUP_OPEN':
      return mainCtrl.onPopupOpen()
    case 'MAIN_CONTROLLER_LOCK':
      return mainCtrl.lock()
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER': {
      return await mainCtrl.handleAccountPickerInitLedger(LedgerKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR': {
      return await mainCtrl.handleAccountPickerInitTrezor(TrezorKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE': {
      return await mainCtrl.handleAccountPickerInitLattice(LatticeKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_PRIVATE_KEY_OR_SEED_PHRASE': {
      const hdPathTemplate = BIP44_STANDARD_DERIVATION_TEMPLATE
      const keyIterator = new KeyIterator(params.privKeyOrSeed, params.seedPassphrase)
      await mainCtrl.accountPicker.setInitParams({ keyIterator, hdPathTemplate })
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_FROM_SAVED_SEED_PHRASE': {
      const keystoreSavedSeed = await mainCtrl.keystore.getSavedSeed(params.id)
      if (!keystoreSavedSeed) return

      const keyIterator = new KeyIterator(keystoreSavedSeed.seed, keystoreSavedSeed.seedPassphrase)
      await mainCtrl.accountPicker.setInitParams({
        keyIterator,
        hdPathTemplate: keystoreSavedSeed.hdPathTemplate
      })
      break
    }
    case 'MAIN_CONTROLLER_ADD_NETWORK': {
      return await mainCtrl.addNetwork(params)
    }
    case 'MAIN_CONTROLLER_REMOVE_NETWORK': {
      return await mainCtrl.removeNetwork(params.chainId)
    }
    case 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_PREFERENCES': {
      return await mainCtrl.accounts.updateAccountPreferences(params)
    }
    case 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_STATE': {
      return await mainCtrl.accounts.updateAccountState(params.addr, 'latest', params.chainIds)
    }
    case 'ACCOUNTS_CONTROLLER_RESET_ACCOUNTS_NEWLY_ADDED_STATE': {
      return await mainCtrl.accounts.resetAccountsNewlyAddedState()
    }
    case 'SETTINGS_CONTROLLER_SET_NETWORK_TO_ADD_OR_UPDATE': {
      return await mainCtrl.networks.setNetworkToAddOrUpdate(params)
    }
    case 'SETTINGS_CONTROLLER_RESET_NETWORK_TO_ADD_OR_UPDATE': {
      return await mainCtrl.networks.setNetworkToAddOrUpdate(null)
    }
    case 'KEYSTORE_CONTROLLER_UPDATE_KEY_PREFERENCES': {
      return await mainCtrl.keystore.updateKeyPreferences(params)
    }
    case 'MAIN_CONTROLLER_UPDATE_NETWORK': {
      return await mainCtrl.networks.updateNetwork(params.network, params.chainId)
    }
    case 'MAIN_CONTROLLER_SELECT_ACCOUNT': {
      return await mainCtrl.selectAccount(params.accountAddr)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SELECT_ACCOUNT': {
      return mainCtrl.accountPicker.selectAccount(params.account)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_DESELECT_ACCOUNT': {
      return mainCtrl.accountPicker.deselectAccount(params.account)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_RESET': {
      await mainCtrl.accountPicker.reset()
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT': {
      mainCtrl.accountPicker.init()
      break
    }
    case 'RESET_ACCOUNT_ADDING_ON_PAGE_ERROR': {
      await mainCtrl.accountPicker.reset()
      const accounts = [...mainCtrl.accounts.accounts]
      // eslint-disable-next-line no-restricted-syntax
      for (const account of accounts) {
        if (account.newlyAdded) {
          // eslint-disable-next-line no-await-in-loop
          await mainCtrl.removeAccount(account.addr)
        }
      }

      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_RESET_ACCOUNTS_SELECTION': {
      mainCtrl.accountPicker.resetAccountsSelection()
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_PAGE':
      return await mainCtrl.accountPicker.setPage(params)
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_HD_PATH_TEMPLATE': {
      return await mainCtrl.accountPicker.setHDPathTemplate(params)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_ADD_ACCOUNTS': {
      await mainCtrl.accountPicker.addAccounts()
      break
    }
    case 'IMPORT_SMART_ACCOUNT_JSON': {
      // Add accounts first, because some of the next steps have validation
      // if accounts exists.
      await mainCtrl.accounts.addAccounts([params.readyToAddAccount])

      // Then add keys, because some of the next steps could have validation
      // if keys exists. Should be separate (not combined in Promise.all,
      // since firing multiple keystore actions is not possible
      // (the #wrapKeystoreAction listens for the first one to finish and
      // skips the parallel one, if one is requested).

      return await mainCtrl.keystore.addKeys(params.keys)
    }
    case 'MAIN_CONTROLLER_ADD_VIEW_ONLY_ACCOUNTS': {
      // Since these accounts are view-only, directly add them in the
      // MainController, bypassing the AccountPicker flow.
      await mainCtrl.accounts.addAccounts(params.accounts)
      break
    }
    case 'MAIN_CONTROLLER_REMOVE_ACCOUNT': {
      return await mainCtrl.removeAccount(params.accountAddr)
    }
    case 'MAIN_CONTROLLER_BUILD_TRANSFER_USER_REQUEST':
      return await mainCtrl.buildTransferUserRequest(
        params.amount,
        params.recipientAddress,
        params.selectedToken,
        params.actionExecutionType
      )

    case 'MAIN_CONTROLLER_BUILD_CLAIM_WALLET_USER_REQUEST':
      return await mainCtrl.buildClaimWalletUserRequest(params.token)
    case 'MAIN_CONTROLLER_BUILD_MINT_VESTING_USER_REQUEST':
      return await mainCtrl.buildMintVestingUserRequest(params.token)
    case 'MAIN_CONTROLLER_ADD_USER_REQUEST':
      return await mainCtrl.addUserRequest(params)
    case 'MAIN_CONTROLLER_REMOVE_USER_REQUEST':
      return mainCtrl.removeUserRequest(params.id)
    case 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST':
      return mainCtrl.resolveUserRequest(params.data, params.id)
    case 'MAIN_CONTROLLER_REJECT_USER_REQUEST':
      return mainCtrl.rejectUserRequest(params.err, params.id)
    case 'MAIN_CONTROLLER_REJECT_SIGN_ACCOUNT_OP_CALL': {
      return mainCtrl.rejectSignAccountOpCall(params.callId)
    }
    case 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP':
      return mainCtrl.rejectAccountOpAction(
        params.err,
        params.actionId,
        params.shouldOpenNextAction
      )
    case 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT': {
      return await mainCtrl.signMessage.init(params)
    }
    case 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET':
      return mainCtrl.signMessage.reset()
    case 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE': {
      mainCtrl.signMessage.setSigningKey(params.keyAddr, params.keyType)
      return await mainCtrl.handleSignMessage()
    }
    case 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS':
      return mainCtrl.activity.filterAccountsOps(
        params.sessionId,
        params.filters,
        params.pagination
      )
    case 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_FILTERS':
      return mainCtrl.activity.filterSignedMessages(
        params.sessionId,
        params.filters,
        params.pagination
      )
    case 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS':
      return mainCtrl.activity.resetAccountsOpsFilters(params.sessionId)
    case 'MAIN_CONTROLLER_ACTIVITY_RESET_SIGNED_MESSAGES_FILTERS':
      return mainCtrl.activity.resetSignedMessagesFilters(params.sessionId)
    case 'ACTIVITY_CONTROLLER_HIDE_BANNER':
      return await mainCtrl.activity.hideBanner(params)

    case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE':
      return mainCtrl?.signAccountOp?.update(params)
    case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_STATUS':
      return mainCtrl?.signAccountOp?.updateStatus(params.status)
    case 'MAIN_CONTROLLER_HANDLE_SIGN_AND_BROADCAST_ACCOUNT_OP': {
      const signAccountOpType = params?.isSwapAndBridge
        ? SIGN_ACCOUNT_OP_SWAP
        : SIGN_ACCOUNT_OP_MAIN
      return await mainCtrl.handleSignAndBroadcastAccountOp(signAccountOpType)
    }
    case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_INIT':
      return mainCtrl.initSignAccOp(params.actionId)
    case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_DESTROY':
      return mainCtrl.destroySignAccOp()
    case 'SIGN_ACCOUNT_OP_UPDATE': {
      if (params.updateType === 'Main') return mainCtrl?.signAccountOp?.update(params)
      return mainCtrl?.swapAndBridge?.signAccountOpController?.update(params)
    }

    case 'SELECTED_ACCOUNT_SET_DASHBOARD_NETWORK_FILTER': {
      mainCtrl.selectedAccount.setDashboardNetworkFilter(params.dashboardNetworkFilter)
      break
    }

    case 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM':
      return await mainCtrl.swapAndBridge.initForm(params.sessionId, {
        preselectedFromToken: params.preselectedFromToken
      })
    case 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN':
      return mainCtrl.swapAndBridge.unloadScreen(params.sessionId, params.forceUnload)
    case 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM':
      return mainCtrl.swapAndBridge.updateForm(params)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS':
      return await mainCtrl.swapAndBridge.switchFromAndToTokens()
    case 'SWAP_AND_BRIDGE_CONTROLLER_ADD_TO_TOKEN_BY_ADDRESS':
      return await mainCtrl.swapAndBridge.addToTokenByAddress(params.address)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SELECT_ROUTE':
      return await mainCtrl.swapAndBridge.selectRoute(params.route, params.isAutoSelectDisabled)
    case 'SWAP_AND_BRIDGE_CONTROLLER_BUILD_USER_REQUEST': {
      return await mainCtrl.buildSwapAndBridgeUserRequest()
    }
    case 'SWAP_AND_BRIDGE_CONTROLLER_ON_ESTIMATION_FAILURE': {
      return await mainCtrl.swapAndBridge.onEstimationFailure()
    }
    case 'SWAP_AND_BRIDGE_CONTROLLER_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST':
      return await mainCtrl.buildSwapAndBridgeUserRequest(params.activeRouteId)
    case 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_QUOTE': {
      await mainCtrl.swapAndBridge.updateQuote({
        skipPreviousQuoteRemoval: true,
        skipQuoteUpdateOnSameValues: false,
        skipStatusUpdate: false
      })
      break
    }
    case 'SWAP_AND_BRIDGE_CONTROLLER_RESET_FORM':
      return mainCtrl.swapAndBridge.resetForm()
    case 'SWAP_AND_BRIDGE_CONTROLLER_MARK_SELECTED_ROUTE_AS_FAILED':
      return mainCtrl.swapAndBridge.markSelectedRouteAsFailed()
    case 'SWAP_AND_BRIDGE_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE':
      return mainCtrl?.swapAndBridge?.signAccountOpController?.update(params)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_STATUS':
      return mainCtrl?.swapAndBridge?.signAccountOpController?.updateStatus(params.status)
    case 'SWAP_AND_BRIDGE_CONTROLLER_HAS_USER_PROCEEDED':
      return mainCtrl?.swapAndBridge.setUserProceeded(params.proceeded)
    case 'SWAP_AND_BRIDGE_CONTROLLER_IS_AUTO_SELECT_ROUTE_DISABLED':
      return mainCtrl?.swapAndBridge.setIsAutoSelectRouteDisabled(params.isDisabled)
    case 'SWAP_AND_BRIDGE_CONTROLLER_DESTROY_SIGN_ACCOUNT_OP':
      return mainCtrl?.swapAndBridge.destroySignAccountOp()
    case 'SWAP_AND_BRIDGE_CONTROLLER_OPEN_SIGNING_ACTION_WINDOW':
      if (!mainCtrl.selectedAccount.account) throw new Error('No selected account')

      return mainCtrl.actions.addOrUpdateAction(
        {
          id: `${mainCtrl.selectedAccount.account.addr}-swap-and-bridge-sign`,
          type: 'swapAndBridge',
          userRequest: {
            meta: {
              accountAddr: mainCtrl.selectedAccount.account.addr
            }
          }
        },
        'last',
        'open-action-window'
      )
    case 'SWAP_AND_BRIDGE_CONTROLLER_CLOSE_SIGNING_ACTION_WINDOW':
      if (!mainCtrl.selectedAccount.account) throw new Error('No selected account')
      return mainCtrl.actions.removeAction(
        `${mainCtrl.selectedAccount.account.addr}-swap-and-bridge-sign`
      )
    case 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE':
      return mainCtrl.removeActiveRoute(params.activeRouteId)

    case 'ACTIONS_CONTROLLER_REMOVE_FROM_ACTIONS_QUEUE':
      return mainCtrl.actions.removeAction(params.id, params.shouldOpenNextAction)
    case 'ACTIONS_CONTROLLER_FOCUS_ACTION_WINDOW':
      return mainCtrl.actions.focusActionWindow()
    case 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID':
      return mainCtrl.actions.setCurrentActionById(params.actionId)
    case 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX':
      return mainCtrl.actions.setCurrentActionByIndex(params.index)
    case 'ACTIONS_CONTROLLER_SET_WINDOW_LOADED':
      return mainCtrl.actions.setWindowLoaded()

    case 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT': {
      return await mainCtrl.reloadSelectedAccount({
        chainId: params?.chainId ? BigInt(params?.chainId) : undefined
      })
    }
    case 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT_PORTFOLIO': {
      return await mainCtrl.updateSelectedAccountPortfolio(params?.forceUpdate, params?.network)
    }

    case 'PORTFOLIO_CONTROLLER_GET_TEMPORARY_TOKENS': {
      if (!mainCtrl.selectedAccount.account) return

      return await mainCtrl.portfolio.getTemporaryTokens(
        mainCtrl.selectedAccount.account.addr,
        params.chainId,
        params.additionalHint
      )
    }
    case 'PORTFOLIO_CONTROLLER_ADD_CUSTOM_TOKEN': {
      return await mainCtrl.portfolio.addCustomToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_REMOVE_CUSTOM_TOKEN': {
      return await mainCtrl.portfolio.removeCustomToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN': {
      return await mainCtrl.portfolio.toggleHideToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_CHECK_TOKEN': {
      if (!mainCtrl.selectedAccount.account) return
      return await mainCtrl.portfolio.updateTokenValidationByStandard(
        params.token,
        mainCtrl.selectedAccount.account.addr
      )
    }
    case 'SELECTED_ACCOUNT_CONTROLLER_UPDATE_CASHBACK_STATUS': {
      return await mainCtrl.selectedAccount.changeCashbackStatus(params)
    }
    case 'KEYSTORE_CONTROLLER_ADD_SECRET':
      return await mainCtrl.keystore.addSecret(
        params.secretId,
        params.secret,
        params.extraEntropy,
        params.leaveUnlocked
      )
    case 'KEYSTORE_CONTROLLER_ADD_TEMP_SEED':
      return await mainCtrl.keystore.addTempSeed(params)
    case 'KEYSTORE_CONTROLLER_UPDATE_SEED':
      return await mainCtrl.keystore.updateSeed(params)
    case 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET':
      return await mainCtrl.keystore.unlockWithSecret(params.secretId, params.secret)
    case 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE':
      return mainCtrl.keystore.resetErrorState()
    case 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD':
      return await mainCtrl.keystore.changeKeystorePassword(
        params.newSecret,
        params.secret,
        params.extraEntropy
      )
    case 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD_FROM_RECOVERY':
      // In the case we change the user's device password through the recovery process,
      // we don't know the old password, which is why we send only the new password.
      return await mainCtrl.keystore.changeKeystorePassword(
        params.newSecret,
        undefined,
        params.extraEntropy
      )
    case 'KEYSTORE_CONTROLLER_SEND_PRIVATE_KEY_TO_UI':
      return await mainCtrl.keystore.sendPrivateKeyToUi(params.keyAddr)
    case 'KEYSTORE_CONTROLLER_SEND_SEED_TO_UI':
      return await mainCtrl.keystore.sendSeedToUi(params.id)
    case 'KEYSTORE_CONTROLLER_SEND_TEMP_SEED_TO_UI':
      return await mainCtrl.keystore.sendTempSeedToUi()
    case 'KEYSTORE_CONTROLLER_DELETE_SEED':
      return await mainCtrl.keystore.deleteSeed(params.id)

    case 'EMAIL_VAULT_CONTROLLER_GET_INFO':
      return await mainCtrl.emailVault.getEmailVaultInfo(params.email)
    case 'EMAIL_VAULT_CONTROLLER_UPLOAD_KEYSTORE_SECRET':
      return await mainCtrl.emailVault.uploadKeyStoreSecret(params.email)
    case 'EMAIL_VAULT_CONTROLLER_HANDLE_MAGIC_LINK_KEY':
      return await mainCtrl.emailVault.handleMagicLinkKey(params.email, undefined, params.flow)
    case 'EMAIL_VAULT_CONTROLLER_CANCEL_CONFIRMATION':
      return mainCtrl.emailVault.cancelEmailConfirmation()
    case 'EMAIL_VAULT_CONTROLLER_RECOVER_KEYSTORE':
      return await mainCtrl.emailVault.recoverKeyStore(params.email, params.newPass)
    case 'EMAIL_VAULT_CONTROLLER_CLEAN_MAGIC_AND_SESSION_KEYS':
      return await mainCtrl.emailVault.cleanMagicAndSessionKeys()
    case 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC':
      return await mainCtrl.emailVault.requestKeysSync(params.email, params.keys)
    case 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER':
      return mainCtrl.emailVault.dismissBanner()
    case 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT': {
      return await mainCtrl.addressBook.addContact(params.name, params.address)
    }
    case 'ADDRESS_BOOK_CONTROLLER_RENAME_CONTACT': {
      const { address, newName } = params

      const account = mainCtrl.accounts.accounts.find(
        ({ addr }) => addr.toLowerCase() === address.toLowerCase()
      )

      if (!account) {
        await mainCtrl.addressBook.renameManuallyAddedContact(address, newName)
        return
      }

      return await mainCtrl.accounts.updateAccountPreferences([
        {
          addr: address,
          preferences: {
            pfp: account.preferences.pfp,
            label: newName
          }
        }
      ])
    }
    case 'ADDRESS_BOOK_CONTROLLER_REMOVE_CONTACT':
      return await mainCtrl.addressBook.removeManuallyAddedContact(params.address)
    case 'DOMAINS_CONTROLLER_REVERSE_LOOKUP':
      return await mainCtrl.domains.reverseLookup(params.address)
    case 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP':
      return mainCtrl.domains.saveResolvedReverseLookup(params)
    case 'SET_IS_PINNED': {
      walletStateCtrl.isPinned = params.isPinned
      break
    }
    case 'SET_IS_SETUP_COMPLETE': {
      walletStateCtrl.isSetupComplete = params.isSetupComplete
      break
    }
    case 'AUTO_LOCK_CONTROLLER_SET_LAST_ACTIVE_TIME': {
      autoLockCtrl.setLastActiveTime()
      break
    }
    case 'AUTO_LOCK_CONTROLLER_SET_AUTO_LOCK_TIME': {
      autoLockCtrl.autoLockTime = params
      break
    }

    case 'INVITE_CONTROLLER_VERIFY': {
      return await mainCtrl.invite.verify(params.code)
    }
    case 'INVITE_CONTROLLER_BECOME_OG': {
      return await mainCtrl.invite.becomeOG()
    }
    case 'INVITE_CONTROLLER_REVOKE_OG': {
      return await mainCtrl.invite.revokeOG()
    }

    case 'DAPPS_CONTROLLER_DISCONNECT_DAPP': {
      await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, params)
      mainCtrl.dapps.updateDapp(params, { isConnected: false })
      break
    }
    case 'CHANGE_CURRENT_DAPP_NETWORK': {
      mainCtrl.dapps.updateDapp(params.origin, { chainId: params.chainId })
      await mainCtrl.dapps.broadcastDappSessionEvent(
        'chainChanged',
        {
          chain: `0x${params.chainId.toString(16)}`,
          networkVersion: `${params.chainId}`
        },
        params.origin
      )
      break
    }
    case 'DAPP_CONTROLLER_ADD_DAPP': {
      return mainCtrl.dapps.addDapp(params)
    }
    case 'DAPP_CONTROLLER_UPDATE_DAPP': {
      return mainCtrl.dapps.updateDapp(params.url, params.dapp)
    }
    case 'DAPP_CONTROLLER_REMOVE_DAPP': {
      await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, params)
      return mainCtrl.dapps.removeDapp(params)
    }
    case 'PHISHING_CONTROLLER_GET_IS_BLACKLISTED_AND_SEND_TO_UI': {
      return mainCtrl.phishing.sendIsBlacklistedToUi(params.url)
    }
    case 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE': {
      extensionUpdateCtrl.applyUpdate()
      break
    }

    case 'OPEN_EXTENSION_POPUP': {
      try {
        await browser.action.openPopup()
      } catch (error) {
        try {
          await chrome.action.openPopup()
        } catch (e) {
          pm.send('> ui', {
            method: 'navigate',
            params: { route: WEB_ROUTES.dashboard }
          })
        }
      }
      break
    }

    case 'TRANSACTION_CONTROLLER_BUILD_TRANSACTION_USER_REQUEST': {
      const {
        fromAmount,
        fromSelectedToken,
        recipientAddress
        // toChainId,
        // toSelectedToken,
        // quote,
      } = params

      const transactionType = mainCtrl.transactionManager.transactionType

      if (transactionType === 'intent') {
        await mainCtrl.buildIntentUserRequest(fromAmount, recipientAddress, fromSelectedToken)
      }

      if (transactionType === 'swapAndBridge') {
        await mainCtrl.buildSwapAndBridgeUserRequest()
      }

      if (transactionType === 'transfer') {
        await mainCtrl.buildTransferUserRequest(fromAmount, recipientAddress, fromSelectedToken)
      }

      mainCtrl.transactionManager.formState.resetForm()
      mainCtrl.transactionManager.intent.setQuoteAndTransaction([], [])

      break
    }

    case 'TRANSACTION_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS':
      return await mainCtrl.transactionManager.formState.switchFromAndToTokens()

    case 'TRANSACTION_CONTROLLER_UPDATE_FORM':
      return mainCtrl.transactionManager.formState.update(params)

    case 'TRANSACTION_CONTROLLER_SET_QUOTE': {
      const { quote, transactions } = params
      return mainCtrl.transactionManager.intent.setQuoteAndTransaction(quote, transactions)
    }

    case 'TRANSACTION_CONTROLLER_INIT_FORM':
      // Add custom tokens (USDC) to the portfolio on init form
      await mainCtrl.portfolio.addCustomToken({
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        chainId: 421614n,
        standard: 'ERC20'
      })
      await mainCtrl.portfolio.addCustomToken({
        address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        chainId: 84532n,
        standard: 'ERC20'
      })
      await mainCtrl.portfolio.addCustomToken(
        {
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          chainId: 11155111n,
          standard: 'ERC20'
        },
        mainCtrl.selectedAccount.account?.addr,
        true
      )
      await mainCtrl.transactionManager.formState.update({
        toChainId: 11155111,
        fromChainId: 11155111
      })

      return mainCtrl.transactionManager.formState.initForm(params.sessionId)

    case 'TRANSACTION_CONTROLLER_UNLOAD_SCREEN':
      return mainCtrl.transactionManager.formState.unloadScreen(
        params.sessionId,
        params.forceUnload
      )

    default:
      // eslint-disable-next-line no-console
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}

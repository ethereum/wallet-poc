import { MainController } from '@ambire-common/controllers/main/main'
import { ONBOARDING_WEB_ROUTES } from '@common/modules/router/constants/common'
import { IS_FIREFOX } from '@web/constants/common'
import { Port } from '@web/extension-services/messengers'

export const handleCleanUpOnPortDisconnect = async ({
  port,
  mainCtrl
}: {
  port: Port
  mainCtrl: MainController
}) => {
  if (!port.sender || !port.sender?.url) return

  const url = new URL(port.sender.url)

  if (port.sender.url?.includes('sessionId')) {
    const sessionId = url.searchParams.get('sessionId')!

    if (url.pathname.includes('swap-and-bridge')) {
      mainCtrl.swapAndBridge.unloadScreen(sessionId)
    }

    if (url.pathname.includes('dashboard') || url.pathname.includes('transactions')) {
      mainCtrl.activity.resetAccountsOpsFilters(sessionId)
    }

    if (url.pathname.includes('signed-messages')) {
      mainCtrl.activity.resetSignedMessagesFilters(sessionId)
    }
  }

  if (url.pathname.includes('sign-account-op')) {
    mainCtrl.destroySignAccOp()
  }

  if (url.pathname.includes('sign-message')) {
    mainCtrl.signMessage.reset()
  }

  if (mainCtrl.accountPicker.isInitialized) {
    const shouldResetAccountPicker = ONBOARDING_WEB_ROUTES.some(
      (r) => url.pathname.includes(r) && port.name === 'tab'
    )

    if (shouldResetAccountPicker) await mainCtrl.accountPicker.reset()
  }

  // In Firefox, we don't close the action window directly to avoid a bug where closing it also closes the extension popup.
  // Instead, we turn it into a blank, unfocused page. Later, when the popup gets disconnected, we clean up any such leftover blank pages.
  // The rest of the logic is in the remove func in window.ts
  if (IS_FIREFOX && port.name === 'popup') {
    const windows = await chrome.windows.getAll()
    const popupWindows = windows.filter((w) => w.type === 'popup')

    // eslint-disable-next-line no-restricted-syntax
    for (const w of popupWindows) {
      if (w && w.id) {
        // eslint-disable-next-line no-await-in-loop
        const tabs = await chrome.tabs.query({ windowId: w.id })
        if (tabs[0].url === 'about:blank' && tabs[0].status !== 'loading') {
          // eslint-disable-next-line no-await-in-loop
          await chrome.windows.remove(w.id)
        }
      }
    }
  }
}

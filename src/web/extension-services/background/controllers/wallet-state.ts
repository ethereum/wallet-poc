/* eslint-disable @typescript-eslint/no-floating-promises */
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { browser, isSafari } from '@web/constants/browserapi'
import { storage } from '@web/extension-services/background/webapi/storage'

export class WalletStateController extends EventEmitter {
  isReady: boolean = false

  #isPinned: boolean = true

  #isPinnedInterval: ReturnType<typeof setTimeout> | undefined = undefined

  #isSetupComplete: boolean = false

  get isPinned() {
    return this.#isPinned
  }

  set isPinned(newValue: boolean) {
    this.#isPinned = newValue
    storage.set('isPinned', newValue)
    this.emitUpdate()
  }

  get isSetupComplete() {
    return this.#isSetupComplete
  }

  set isSetupComplete(newValue: boolean) {
    this.#isSetupComplete = newValue
    if (!newValue) {
      this.#initCheckIsPinned()
    } else {
      clearTimeout(this.#isPinnedInterval)
    }
    storage.set('isSetupComplete', newValue)
    this.emitUpdate()
  }

  constructor() {
    super()

    this.#init()
  }

  async #init(): Promise<void> {
    this.#isPinned = isSafari() || (await storage.get('isPinned', false))
    this.#initCheckIsPinned()

    this.#isSetupComplete = await storage.get('isSetupComplete', false)

    this.isReady = true
    this.emitUpdate()
  }

  async #initCheckIsPinned() {
    if (this.isPinned && this.#isPinnedInterval) clearTimeout(this.#isPinnedInterval)
    if (this.isPinned) return
    // @ts-ignore
    const userSettings = await browser.action.getUserSettings()
    if (userSettings.isOnToolbar) this.isPinned = true
    this.#isPinnedInterval = setTimeout(this.#initCheckIsPinned.bind(this), 500)
  }

  toJSON() {
    return {
      ...this,
      ...super.toJSON(),
      isPinned: this.isPinned,
      isSetupComplete: this.isSetupComplete
    }
  }
}

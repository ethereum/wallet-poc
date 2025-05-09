// @ts-nocheck

import { browser, isSafari } from '@web/constants/browserapi'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

const createTab = async (url: string): Promise<number | undefined> => {
  const extensionId = browser?.runtime?.id
  if (url.startsWith('http') && !url.includes(extensionId)) {
    const tab = await browser.tabs.create({ active: true, url })
    return tab
  }
  try {
    const window = await browser.windows.getCurrent() // search existing Ambire tabs only for the current window
    const queryParams = window ? { windowId: window.id } : {}
    const allTabs = ((await browser.tabs.query(queryParams)) || []).filter(
      (t) => !t.url.includes('action-window.html')
    )
    const base = browser.runtime.getURL('/')
    const fullUrl = new URL(url, base)
    const route = fullUrl.hash.replace(/^#/, '')

    const existingTab = allTabs.find((tab) => {
      return tab.url?.includes(extensionId)
    })

    if (existingTab && existingTab.id) {
      const existingUrl = new URL(existingTab.url)
      const tabRoute = existingUrl.hash.replace(/^#/, '')
      const samePath = tabRoute === route

      if (samePath) {
        await browser.tabs.update(existingTab.id, { active: true })
      } else {
        await browser.tabs.update(existingTab.id, { url, active: true })
      }
      await browser.tabs.move(existingTab.id, { index: -1 })
      return existingTab.id
    }

    const tab = await browser.tabs.create({ active: true, url })
    return tab
  } catch (error) {
    console.error('Error in createTab: ', error)
  }
}

const getCurrentTab = async (): Promise<Tabs.Tab> => {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })

    return tabs[0]
  } catch (error) {
    // TODO: add appropriate error handling that will notify the user
  }
}

export const openInTab = async (url, needClose = true): Promise<Tabs.Tab> => {
  const tab = await createTab(url)
  if (needClose) {
    if (!isSafari()) await closeCurrentWindow()
  }

  return tab
}

const routeableSearchParams = ['flow', 'goBack']

const openInternalPageInTab = async (
  route?: string,
  searchParams = {},
  needClose?: boolean = true
) => {
  const searchToParams = searchParams
    ? `${Object.keys(searchParams)
        .map((key) =>
          routeableSearchParams.indexOf(key) !== -1 ? `${key}=${searchParams[key]}` : ''
        )
        .filter((value: string) => value)
        .join('&')}`
    : ''

  await openInTab(
    `./tab.html${route ? `#/${route}${searchToParams !== '' ? `?${searchToParams}` : ''}` : ''}`,
    needClose
  )
}

export { createTab, getCurrentTab, openInternalPageInTab }

// @ts-nocheck

import { getSDKVersion, MessageFormatter, Methods } from '@gnosis.pm/safe-apps-sdk'

function GnosisConnector(_iframeRef: any, _app: any) {
  this.iframeRef = _iframeRef
  this.app = _app
  this.handlers = {}

  this.on = (method, handler) => {
    this.handlers[method] = handler
  }

  this.isValidMessage = (msg) => {
    // @ts-expect-error .parent doesn't exist on some possible types
    if (!msg?.source?.parent) {
      return false
    }
    const sentFromIframe = msg.source.parent === window.parent
    const knownMethod = Object.values(Methods).includes(msg.data.method)

    return sentFromIframe && knownMethod
  }

  this.canHandleMessage = (msg) => {
    return Boolean(this.handlers[msg.data.method])
  }

  this.send = (data, requestId, error) => {
    const sdkVersion = getSDKVersion()
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, error, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion)

    if (this.iframeRef) {
      this.iframeRef.current?.postMessage(msg, '*')
    } else {
      console.log('Iframe not referenced ')
    }
  }

  this.handleIncomingMessage = async (msg) => {
    const validMessage = this.isValidMessage(msg)
    const hasHandler = this.canHandleMessage(msg)

    if (validMessage && hasHandler) {
      const handler = this.handlers[msg.data.method]
      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg)

        // If response is not returned, it means the response will be send somewhere else
        if (typeof response !== 'undefined') {
          this.send(response, msg.data.id)
        }
      } catch (err) {
        this.send(err.message, msg.data.id, true)
      }
    }
  }
}

export { GnosisConnector }

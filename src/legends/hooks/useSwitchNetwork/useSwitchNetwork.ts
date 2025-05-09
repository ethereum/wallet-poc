import { ERROR_MESSAGES } from '@legends/constants/errors/messages'

import useAccountContext from '../useAccountContext'
import useToast from '../useToast'

const useSwitchNetwork = () => {
  const { chainId } = useAccountContext()
  const { addToast } = useToast()

  const switchNetwork = async (newChainId: number) => {
    const isAlreadyConnected = Number(chainId) === newChainId
    // Request a chain change to base and a sign message to associate the EOA address
    try {
      if (isAlreadyConnected) return
      await window.ambire.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: newChainId }]
      })
    } catch {
      addToast(ERROR_MESSAGES.networkSwitchFailed, { type: 'error' })
    }
  }

  return switchNetwork
}

export default useSwitchNetwork

/* eslint-disable no-console */
import { BrowserProvider, Contract, Interface } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import HumanReadableError from '@legends/classes/HumanReadableError'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import CardActionWrapper from './CardActionWrapper'

const walletIface = new Interface([
  'function approve(address,uint)',
  'function balanceOf(address) view returns (uint256)'
])

const stkWalletIface = new Interface(['function enter(uint256 amount) external'])

const StakeWallet = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isInProgress, setIsInProgress] = useState(false)
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete, handleClose } = useCardActionContext()

  const { addToast } = useToast()
  const { connectedAccount, v1Account } = useAccountContext()
  const switchNetwork = useSwitchNetwork()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const [walletBalance, setWalletBalance] = useState(null)

  useEffect(() => {
    if (!connectedAccount) return
    const provider = new BrowserProvider(window.ambire)
    const walletContract = new Contract(WALLET_TOKEN, walletIface, provider)
    // @TODO use the pending $WALLET balance in the future
    switchNetwork(ETHEREUM_CHAIN_ID)
      .then(() =>
        walletContract
          .balanceOf(connectedAccount)
          .then(setWalletBalance)
          .catch((e) => {
            console.error(e)
            addToast('Failed to get $WALLET token balance', { type: 'error' })
          })
      )
      .catch((e) => {
        console.error(e)
        addToast('Failed to switch network to Ethereum', { type: 'error' })
      })
      .finally(() => setIsLoading(false))
  }, [connectedAccount, addToast, switchNetwork])

  const stakeWallet = useCallback(async () => {
    try {
      if (!connectedAccount) throw new HumanReadableError('No connected account.')
      if (!walletBalance) throw new HumanReadableError('Insufficient $WALLET balance')

      setIsInProgress(true)
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner(connectedAccount)

      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        [
          {
            to: WALLET_TOKEN,
            data: walletIface.encodeFunctionData('approve', [STK_WALLET, walletBalance])
          },
          {
            to: STK_WALLET,
            data: stkWalletIface.encodeFunctionData('enter', [walletBalance])
          }
        ],
        useSponsorship
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)
      onComplete(receipt.transactionHash)
      handleClose()
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionSigningFailed)

      console.error(e)
      addToast(message, { type: 'error' })
    } finally {
      setIsInProgress(false)
    }
  }, [
    connectedAccount,
    walletBalance,
    sendCalls,
    chainId,
    getCallsStatus,
    onComplete,
    handleClose,
    addToast
  ])

  const onButtonClick = useCallback(async () => {
    if (!walletBalance) {
      await window.ambire
        .request({
          method: 'open-wallet-route',
          params: { route: 'swap-and-bridge' }
        })
        .catch((e) => {
          console.error(e)
          addToast(
            'This action is not supported in the current extension version. It’s available in version 4.44.1. Please update!',
            { type: 'error' }
          )
        })
      return
    }
    await switchNetwork()
    await stakeWallet()
  }, [switchNetwork, stakeWallet, walletBalance, addToast])

  return (
    <CardActionWrapper
      isLoading={isInProgress}
      loadingText="Signing..."
      disabled={disabledButton || isInProgress}
      buttonText={
        disabledButton
          ? 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
          : isLoading
          ? 'Loading...'
          : !walletBalance
          ? 'Buy $WALLET'
          : 'Stake'
      }
      onButtonClick={onButtonClick}
    />
  )
}

export default StakeWallet

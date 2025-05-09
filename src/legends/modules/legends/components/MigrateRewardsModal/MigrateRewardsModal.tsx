/* eslint-disable no-console */
import { BrowserProvider, Contract, formatUnits, Interface } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import CloseIcon from '@legends/components/CloseIcon'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useEscModal from '@legends/hooks/useEscModal'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import smokeAndLights from '@legends/modules/leaderboard/screens/Leaderboard/Smoke-and-lights.png'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import { CardActionCalls, CardActionPredefined, CardFromResponse, CardStatus } from '../../types'
import CardActionButton from '../Card/CardAction/actions/CardActionButton'
import rewardsCoverImg from './assets/rewards-cover.png'
import styles from './MigrateRewardsModal.module.scss'

type Action = CardActionPredefined & {
  calls: CardActionCalls['calls']
}
interface MigrateRewardsModalProps {
  isOpen: boolean
  handleClose: () => void
  action: Action | undefined
  meta: CardFromResponse['meta'] | undefined
  card: CardFromResponse['card'] | undefined
}

const walletIface = new Interface([
  'function approve(address,uint)',
  'function balanceOf(address) view returns (uint256)'
])

const X_WALLET_TOKEN = '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935'

const MigrateRewardsModal: React.FC<MigrateRewardsModalProps> = ({
  isOpen,
  handleClose,
  action,
  meta,
  card
}) => {
  const { character } = useCharacterContext()
  const { claimableRewards, xWalletClaimableBalance } = usePortfolioControllerState()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete } = useCardActionContext()
  const formatXp = (xp: number) => {
    return xp && xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const { addToast } = useToast()
  const { connectedAccount, v1Account } = useAccountContext()
  const switchNetwork = useSwitchNetwork()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const [walletBalance, setWalletBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const closeModal = async () => {
    handleClose()
  }

  useEffect(() => {
    if (!connectedAccount) return
    const provider = new BrowserProvider(window.ambire)
    const walletContract = new Contract(X_WALLET_TOKEN, walletIface, provider)
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

  console.log('walletBalance', walletBalance)
  // Close Modal on ESC
  useEscModal(isOpen, closeModal)

  const onButtonClick = useCallback(async () => {
    if (!action || !action.calls) return
    await switchNetwork(ETHEREUM_CHAIN_ID)

    try {
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner()

      const formattedCalls = action.calls.map(([to, value, data]) => {
        return { to, value, data }
      })

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        formattedCalls,
        false
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)
      onComplete(receipt.transactionHash)
      handleClose()
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionProcessingFailed)
      console.error(e)
      addToast(message, { type: 'error' })
    }
  }, [switchNetwork, action, sendCalls, chainId, getCallsStatus, onComplete, handleClose, addToast])

  if (!isOpen) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.wrapper}>
        <button type="button" onClick={closeModal} className={styles.closeButton}>
          <CloseIcon />
        </button>

        <div className={styles.contentWrapper}>
          <h2 className={styles.title}>Migrate xWALLET</h2>
          <div className={styles.content}>
            <div>
              <p className={styles.sectionTitle}>Your xWALLET</p>
              <div className={styles.sectionContent}>
                <p>
                  {formatDecimals(
                    Number(
                      parseFloat(formatUnits(walletBalance, xWalletClaimableBalance.decimals))
                    ),
                    'amount'
                  )}
                </p>
                <p className={styles.usdValue}>
                  {
                    getAndFormatTokenDetails(
                      {
                        ...xWalletClaimableBalance,
                        amount: walletBalance,
                        flags: { rewardsType: 'wallet-rewards' }
                      },
                      [{ chainId: 1 }]
                    ).balanceUSDFormatted
                  }{' '}
                </p>
              </div>
            </div>
          </div>

          <CardActionButton
            onButtonClick={onButtonClick}
            buttonText="Migrate xWALLET"
            className={styles.button}
          />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default MigrateRewardsModal

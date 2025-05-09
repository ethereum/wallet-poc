/* eslint-disable no-console */
import { BrowserProvider, formatUnits } from 'ethers'
import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Alert from '@legends/components/Alert'
import CloseIcon from '@legends/components/CloseIcon'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
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
import styles from './ClaimRewardsModal.module.scss'

type Action = CardActionPredefined & {
  calls: CardActionCalls['calls']
}
interface ClaimRewardsModalProps {
  isOpen: boolean
  handleClose: () => void
  action: Action | undefined
  meta: CardFromResponse['meta'] | undefined
  card: CardFromResponse['card'] | undefined
}

const ClaimRewardsModal: React.FC<ClaimRewardsModalProps> = ({
  isOpen,
  handleClose,
  action,
  meta,
  card
}) => {
  const { character } = useCharacterContext()
  const { claimableRewards } = usePortfolioControllerState()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete } = useCardActionContext()
  const formatXp = (xp: number) => {
    return xp && xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const cardDisabled = card?.status === CardStatus.disabled

  const { addToast } = useToast()
  const switchNetwork = useSwitchNetwork()

  const closeModal = async () => {
    handleClose()
  }

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
  if (!character)
    return (
      <Alert
        type="error"
        title="Failed to load character"
        message="Please try again later or contact support if the issue persists."
      />
    )

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.wrapper}>
        <button type="button" onClick={closeModal} className={styles.closeButton}>
          <CloseIcon />
        </button>
        <div
          className={styles.backgroundEffect}
          style={{
            backgroundImage: `url(${smokeAndLights})`
          }}
        />
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <h2 className={styles.title}>Claim rewards</h2>
            <img src={rewardsCoverImg} alt="rewards-cover" className={styles.rewardsCoverImg} />
            <div>
              <p className={styles.sectionTitle}> Claimable $WALLET rewards</p>
              <div className={styles.sectionContent}>
                <p>
                  {formatDecimals(
                    parseFloat(meta?.availableToClaim ? meta?.availableToClaim : '0')
                  )}
                </p>
                <p className={styles.usdValue}>
                  {
                    getAndFormatTokenDetails(
                      {
                        ...claimableRewards,
                        flags: { rewardsType: 'wallet-rewards' }
                      },
                      [{ chainId: 1 }]
                    ).balanceUSDFormatted
                  }{' '}
                </p>
              </div>
            </div>

            <div>
              <p className={styles.sectionTitle}>Total XP accrued</p>
              <div className={styles.sectionContent}>{formatXp(character.xp)}</div>
            </div>
          </div>

          <CardActionButton
            onButtonClick={onButtonClick}
            disabled={cardDisabled}
            buttonText={cardDisabled ? 'Claim is not available yet' : 'Claim'}
          />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default ClaimRewardsModal

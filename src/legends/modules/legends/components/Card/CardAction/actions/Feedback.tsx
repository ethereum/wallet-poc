/* eslint-disable no-console */

import { BrowserProvider, hashMessage, Interface } from 'ethers'
import React, { useCallback, useState } from 'react'
import { Linking } from 'react-native'

import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import Input from '../../../../../../components/Input/Input'
import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'

const iface = new Interface(['function claimXpFromFeedback(string)'])

const Feedback = () => {
  const [isInProgress, setIsInProgress] = useState(false)
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false)
  const [surveyCode, setSurveyCode] = useState<string>('')
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete, handleClose } = useCardActionContext()
  const { addToast } = useToast()
  const switchNetwork = useSwitchNetwork()
  const { connectedAccount, v1Account } = useAccountContext()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const openForm = useCallback(() => {
    if (!connectedAccount) return addToast('No account connected')

    setIsFeedbackFormOpen(true)
    const queryParam = `${hashMessage(`${connectedAccount}ambire salt`)}`
    const queryParamName = 'ambro'
    Linking.openURL(
      `https://survey.typeform.com/to/nbSnXDPw#${queryParamName}=${queryParam}`
    ).catch(() => {
      addToast('Cannot open survey')
    })
  }, [connectedAccount, addToast])

  const claimXp = useCallback(async () => {
    try {
      if (!connectedAccount) throw new Error('No connected account')
      if (!surveyCode) throw new Error('No survey code')
      setIsInProgress(true)
      await switchNetwork()
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner(connectedAccount)

      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        [
          {
            to: LEGENDS_CONTRACT_ADDRESS,
            data: iface.encodeFunctionData('claimXpFromFeedback', [surveyCode]),
            value: '0'
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
      addToast(message || ERROR_MESSAGES.transactionSigningFailed, { type: 'error' })
    } finally {
      setIsInProgress(false)
    }
  }, [
    connectedAccount,
    sendCalls,
    surveyCode,
    chainId,
    getCallsStatus,
    onComplete,
    handleClose,
    addToast,
    switchNetwork
  ])

  const onButtonClick = () => {
    if (isFeedbackFormOpen) {
      claimXp()
    } else {
      openForm()
    }
  }

  return (
    <CardActionWrapper
      onButtonClick={onButtonClick}
      isLoading={isInProgress}
      loadingText="Signing..."
      disabled={disabledButton || (isFeedbackFormOpen && !surveyCode)}
      buttonText={
        disabledButton
          ? 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
          : isFeedbackFormOpen
          ? 'Claim xp'
          : 'Open feedback form'
      }
    >
      <div className={styles.wrapper}>
        {isFeedbackFormOpen && (
          <>
            <Input.Label label="Enter Survey code" />
            <Input.Field
              value={surveyCode || ''}
              label="Enter Survey code"
              placeholder="Survey code"
              onChange={(e) => setSurveyCode(e.target.value)}
              className={styles.input}
            />
          </>
        )}
      </div>
    </CardActionWrapper>
  )
}

export default Feedback

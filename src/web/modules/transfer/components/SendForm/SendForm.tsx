import { formatUnits, ZeroAddress } from 'ethers'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { estimateEOA } from '@ambire-common/libs/estimate/estimateEOA'
import { getGasPriceRecommendations } from '@ambire-common/libs/gasPrice/gasPrice'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getRpcProvider } from '@ambire-common/services/provider'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import SendToken from '@common/components/SendToken'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import { getInfoFromSearch } from '@web/contexts/transferControllerStateContext'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import { getTokenId } from '@web/utils/token'

import styles from './styles'

const ONE_MINUTE = 60 * 1000

const SendForm = ({
  addressInputState,
  isSmartAccount = false,
  hasGasTank,
  amountErrorMessage,
  isRecipientAddressUnknown,
  isSWWarningVisible,
  isRecipientHumanizerKnownTokenOrSmartContract,
  recipientMenuClosedAutomaticallyRef,
  formTitle
}: {
  addressInputState: ReturnType<typeof useAddressInput>
  isSmartAccount: boolean
  hasGasTank: boolean
  amountErrorMessage: string
  isRecipientAddressUnknown: boolean
  isSWWarningVisible: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  recipientMenuClosedAutomaticallyRef: React.MutableRefObject<boolean>
  formTitle: string | ReactNode
}) => {
  const { validation } = addressInputState
  const { state, tokens, transferCtrl } = useTransferControllerState()
  const { accountStates } = useAccountsControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const {
    maxAmount,
    amountFieldMode,
    amountInFiat,
    selectedToken,
    isSWWarningAgreed,
    isRecipientAddressUnknownAgreed,
    isTopUp,
    addressState,
    amount
  } = state
  const { t } = useTranslation()
  const { networks } = useNetworksControllerState()
  const { search } = useRoute()
  const [isEstimationLoading, setIsEstimationLoading] = useState(true)
  const [estimation, setEstimation] = useState<null | {
    totalGasWei: bigint
    chainId: bigint
    updatedAt: number
  }>(null)

  const selectedTokenFromUrl = useMemo(() => getInfoFromSearch(search), [search])

  const {
    value: tokenSelectValue,
    options,
    amountSelectDisabled
  } = useGetTokenSelectProps({
    tokens,
    token: selectedToken ? getTokenId(selectedToken, networks) : '',
    networks,
    isToToken: false
  })

  const disableForm = (!hasGasTank && isTopUp) || !tokens.length

  const handleChangeToken = useCallback(
    (value: string) => {
      const tokenToSelect = tokens.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes, networks) === value
      )

      transferCtrl.update({ selectedToken: tokenToSelect, amount: '' })
    },
    [tokens, transferCtrl, networks]
  )

  const setAddressStateFieldValue = useCallback(
    (value: string) => {
      transferCtrl.update({ addressState: { fieldValue: value } })
    },
    [transferCtrl]
  )

  const setMaxAmount = useCallback(() => {
    const shouldDeductGas = selectedToken?.address === ZeroAddress && !isSmartAccount
    const canDeductGas = estimation && estimation.chainId === selectedToken?.chainId

    if (!shouldDeductGas || !canDeductGas) {
      transferCtrl.update({
        amount: maxAmount,
        amountFieldMode: 'token'
      })

      return
    }

    const gasDeductedAmountBigInt = getTokenAmount(selectedToken) - estimation.totalGasWei
    const gasDeductedAmount = formatUnits(gasDeductedAmountBigInt, selectedToken.decimals)

    transferCtrl.update({
      amount: gasDeductedAmount,
      amountFieldMode: 'token'
    })
  }, [estimation, isSmartAccount, maxAmount, selectedToken, transferCtrl])

  const switchAmountFieldMode = useCallback(() => {
    transferCtrl.update({
      amountFieldMode: amountFieldMode === 'token' ? 'fiat' : 'token'
    })
  }, [amountFieldMode, transferCtrl])

  const setAmount = useCallback(
    (value: string) => {
      transferCtrl.update({ amount: value })
    },
    [transferCtrl]
  )

  const onRecipientAddressUnknownCheckboxClick = useCallback(() => {
    transferCtrl.update({
      isRecipientAddressUnknownAgreed: true
    })
  }, [transferCtrl])

  const isMaxAmountEnabled = useMemo(() => {
    if (!maxAmount) return false
    if (isSmartAccount) return true

    const isNativeSelected = selectedToken?.address === ZeroAddress

    if (!isNativeSelected) return true

    return !!estimation && !isEstimationLoading
  }, [estimation, isEstimationLoading, isSmartAccount, maxAmount, selectedToken?.address])

  useEffect(() => {
    if (tokens?.length && !state.selectedToken) {
      let tokenToSelect = tokens[0]

      if (selectedTokenFromUrl) {
        const correspondingToken = tokens.find(
          (token) =>
            token.address === selectedTokenFromUrl.addr &&
            token.chainId.toString() === selectedTokenFromUrl.chainId &&
            token.flags.onGasTank === false
        )

        if (correspondingToken) {
          tokenToSelect = correspondingToken
        }
      }

      if (tokenToSelect && getTokenAmount(tokenToSelect) > 0) {
        transferCtrl.update({ selectedToken: tokenToSelect }, { shouldPersist: false })
      }
    }
  }, [tokens, selectedTokenFromUrl, state.selectedToken, transferCtrl])

  useEffect(() => {
    if (
      estimation &&
      estimation.chainId === selectedToken?.chainId &&
      estimation.updatedAt > Date.now() - ONE_MINUTE
    )
      return
    const networkData = networks.find((n) => n.chainId === selectedToken?.chainId)

    if (!networkData || isSmartAccount || !account || !selectedToken?.chainId) return

    const rpcUrl = networkData.selectedRpcUrl
    const provider = getRpcProvider([rpcUrl], selectedToken.chainId)
    const nonce = accountStates?.[account.addr]?.[selectedToken.chainId.toString()]?.nonce

    if (typeof nonce !== 'bigint') return

    setIsEstimationLoading(true)

    Promise.all([
      getGasPriceRecommendations(provider, networkData, 'latest'),
      estimateEOA(
        account,
        {
          accountAddr: account.addr,
          chainId: selectedToken.chainId,
          signingKeyAddr: null,
          signingKeyType: null,
          nonce,
          calls: [
            {
              to: ZeroAddress,
              value: selectedToken.amount,
              data: '0x'
            }
          ],
          gasLimit: null,
          signature: null,
          gasFeePayment: null,
          accountOpToExecuteBefore: null
        },
        accountStates,
        networkData,
        provider,
        [selectedToken],
        '0x0000000000000000000000000000000000000001',
        'latest',
        () => {}
      )
    ])
      .then(([feeData, newEstimation]) => {
        if (!feeData.gasPrice) return
        const apeGasSpeed = feeData.gasPrice.find(({ name }) => name === 'ape')
        // @ts-ignore
        const gasPrice = apeGasSpeed?.gasPrice || apeGasSpeed?.baseFeePerGas
        const addedNative = newEstimation.feePaymentOptions[0].addedNative || 0n

        let totalGasWei = newEstimation.gasUsed * gasPrice + addedNative

        // Add 20% to the gas fee for optimistic networks
        if (addedNative) {
          totalGasWei = (totalGasWei * 120n) / 100n
        } else {
          // Add 10% to the gas fee for all other networks
          totalGasWei = (totalGasWei * 110n) / 100n
        }

        setEstimation({
          totalGasWei,
          chainId: selectedToken.chainId,
          updatedAt: Date.now()
        })
      })
      .catch((error) => {
        // Expected error
        if (error?.message.includes('cancelled request')) return
        console.error('Failed to fetch gas data:', error)
      })
      .finally(() => {
        setIsEstimationLoading(false)
      })

    return () => {
      provider?.destroy()
    }
  }, [accountStates, estimation, isSmartAccount, networks, account, selectedToken])

  return (
    <ScrollableWrapper
      contentContainerStyle={[styles.container, isTopUp ? styles.topUpContainer : {}]}
    >
      {(!state.selectedToken && tokens.length) || !portfolio?.isReadyToVisualize ? (
        <View>
          <Text appearance="secondaryText" fontSize={14} weight="regular" style={spacings.mbMi}>
            {!portfolio?.isReadyToVisualize
              ? t('Loading tokens...')
              : t(`Select ${isTopUp ? 'Gas Tank ' : ''}Token`)}
          </Text>
          <SkeletonLoader width="100%" height={120} style={spacings.mbLg} />
        </View>
      ) : (
        <SendToken
          fromTokenOptions={options}
          fromTokenValue={tokenSelectValue}
          fromAmountValue={amountFieldMode === 'token' ? amount : amountInFiat}
          fromTokenAmountSelectDisabled={disableForm || amountSelectDisabled}
          handleChangeFromToken={({ value }) => handleChangeToken(value as string)}
          fromSelectedToken={selectedToken}
          fromAmount={amount}
          fromAmountInFiat={amountInFiat}
          fromAmountFieldMode={amountFieldMode}
          maxFromAmount={maxAmount}
          validateFromAmount={{ success: !amountErrorMessage, message: amountErrorMessage }}
          onFromAmountChange={setAmount}
          handleSwitchFromAmountFieldMode={switchAmountFieldMode}
          handleSetMaxFromAmount={setMaxAmount}
          inputTestId="amount-field"
          selectTestId="tokens-select"
          title={formTitle}
          maxAmountDisabled={!isMaxAmountEnabled}
        />
      )}
      <View>
        {!isTopUp && (
          <Recipient
            disabled={disableForm}
            address={addressState.fieldValue}
            setAddress={setAddressStateFieldValue}
            validation={validation}
            ensAddress={addressState.ensAddress}
            addressValidationMsg={validation.message}
            isRecipientHumanizerKnownTokenOrSmartContract={
              isRecipientHumanizerKnownTokenOrSmartContract
            }
            isRecipientAddressUnknown={isRecipientAddressUnknown}
            isRecipientDomainResolving={addressState.isDomainResolving}
            isRecipientAddressUnknownAgreed={isRecipientAddressUnknownAgreed}
            onRecipientAddressUnknownCheckboxClick={onRecipientAddressUnknownCheckboxClick}
            isSWWarningVisible={isSWWarningVisible}
            isSWWarningAgreed={isSWWarningAgreed}
            selectedTokenSymbol={selectedToken?.symbol}
            recipientMenuClosedAutomaticallyRef={recipientMenuClosedAutomaticallyRef}
          />
        )}
      </View>
    </ScrollableWrapper>
  )
}

export default React.memo(SendForm)

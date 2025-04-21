import { formatUnits, ZeroAddress } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { estimateEOA } from '@ambire-common/libs/estimate/estimateEOA'
import { getGasPriceRecommendations } from '@ambire-common/libs/gasPrice/gasPrice'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getRpcProvider } from '@ambire-common/services/provider'
import { convertTokenPriceToBigInt } from '@ambire-common/utils/numbers/formatters'
import { useTranslation } from '@common/config/localization'
import { getInfoFromSearch } from '@web/contexts/transferControllerStateContext'
import { getTokenId } from '@web/utils/token'
import { getChainFromHumanAddress } from '@erc7930/index'

import InputSendToken from '@common/components/InputSendToken'
import Recipient from '@common/components/Recipient'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Select from '@common/components/Select'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useAddressInput from '@common/hooks/useAddressInput'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'

import styles from './styles'

const ONE_MINUTE = 60 * 1000

const SendForm = ({
  addressInputState,
  isSmartAccount = false,
  amountErrorMessage,
  isRecipientAddressUnknown,
  isSWWarningVisible,
  isRecipientHumanizerKnownTokenOrSmartContract
}: {
  addressInputState: ReturnType<typeof useAddressInput>
  isSmartAccount: boolean
  amountErrorMessage: string
  isRecipientAddressUnknown: boolean
  isSWWarningVisible: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
}) => {
  const { validation } = addressInputState
  const { state, tokens, transferCtrl } = useTransferControllerState()
  const { accountStates } = useAccountsControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const {
    maxAmount,
    maxAmountInFiat,
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

  const tokensByChainId = useMemo(() => {
    if (addressState.interopAddress) {
      const chain = getChainFromHumanAddress(addressState.interopAddress)

      if (chain?.chainReference) {
        const filteredTokensByChainId = tokens.filter(
          (chainToken) => Number(chainToken.chainId) === Number(chain.chainReference)
        )

        return filteredTokensByChainId
      }
    }

    return tokens
  }, [addressState.interopAddress, tokens])

  const {
    value: tokenSelectValue,
    options,
    amountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: tokensByChainId,
    token: selectedToken ? getTokenId(selectedToken, networks) : '',
    networks,
    isToToken: false
  })

  const disableForm = (!isSmartAccount && isTopUp) || !tokens.length

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
        amount: amountFieldMode === 'token' ? maxAmount : maxAmountInFiat
      })

      return
    }

    const gasDeductedAmountBigInt = getTokenAmount(selectedToken) - estimation.totalGasWei
    const gasDeductedAmount = formatUnits(gasDeductedAmountBigInt, selectedToken.decimals)

    // Let the user see for himself that the amount is less than the gas fee
    if (gasDeductedAmountBigInt < 0n) {
      transferCtrl.update({ amount: amountFieldMode === 'token' ? maxAmount : maxAmountInFiat })
      return
    }

    if (amountFieldMode === 'token') {
      transferCtrl.update({ amount: gasDeductedAmount })
      return
    }

    if (amountFieldMode === 'fiat') {
      const tokenPrice = selectedToken.priceIn[0].price
      const { tokenPriceBigInt, tokenPriceDecimals } = convertTokenPriceToBigInt(tokenPrice)

      const gasDeductedAmountInFiat = formatUnits(
        gasDeductedAmountBigInt * tokenPriceBigInt,
        tokenPriceDecimals + selectedToken.decimals
      )

      transferCtrl.update({ amount: String(gasDeductedAmountInFiat) })
    }
  }, [
    amountFieldMode,
    estimation,
    isSmartAccount,
    maxAmount,
    maxAmountInFiat,
    selectedToken,
    transferCtrl
  ])

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
        transferCtrl.update({ selectedToken: tokenToSelect })
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
          />
        )}
      </View>
      {(!state.selectedToken && tokens.length) || !portfolio?.isReadyToVisualize ? (
        <View>
          <Text appearance="secondaryText" fontSize={14} weight="regular" style={spacings.mbMi}>
            {!portfolio?.isReadyToVisualize
              ? t('Loading tokens...')
              : t(`Select ${isTopUp ? 'Gas Tank ' : ''}Token`)}
          </Text>
          <SkeletonLoader width="100%" height={50} style={spacings.mbLg} />
        </View>
      ) : (
        <Select
          setValue={({ value }) => handleChangeToken(value as string)}
          label={t(`Select ${isTopUp ? 'Gas Tank ' : ''}Token`)}
          options={options}
          value={tokenSelectValue}
          disabled={disableForm}
          containerStyle={styles.tokenSelect}
          testID="tokens-select"
        />
      )}
      <InputSendToken
        amount={amount}
        onAmountChange={setAmount}
        selectedTokenSymbol={selectedToken?.symbol || ''}
        errorMessage={amountErrorMessage}
        setMaxAmount={setMaxAmount}
        maxAmount={maxAmount}
        amountInFiat={amountInFiat}
        amountFieldMode={amountFieldMode}
        maxAmountInFiat={maxAmountInFiat}
        switchAmountFieldMode={switchAmountFieldMode}
        disabled={disableForm || amountSelectDisabled}
        isLoading={!portfolio?.isReadyToVisualize || !isMaxAmountEnabled}
        isSwitchAmountFieldModeDisabled={selectedToken?.priceIn.length === 0}
      />
    </ScrollableWrapper>
  )
}

export default React.memo(SendForm)

import { formatUnits, isAddress } from 'ethers'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { getIsNetworkSupported } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import getStyles from '@common/components/SendToken/styles'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import SwitchTokensButton from '@web/modules/intent/components/SwitchTokensButton'
import ToTokenSelect from '@web/modules/intent/components/ToToken/ToTokenSelect'
import useSwapAndBridgeForm from '@web/modules/intent/hooks/useSwapAndBridgeForm'
import { getTokenId } from '@web/utils/token'

import NotSupportedNetworkTooltip from '../NotSupportedNetworkTooltip'
import useTransactionForm from '../../hooks/useTransactionForm'

type Props = Pick<ReturnType<typeof useSwapAndBridgeForm>, 'setIsAutoSelectRouteDisabled'> & {
  isAutoSelectRouteDisabled: boolean
}

const ToToken: FC<Props> = ({ isAutoSelectRouteDisabled, setIsAutoSelectRouteDisabled }) => {
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const {
    toChainId,
    supportedChainIds,
    switchTokensStatus,
    toSelectedToken,
    toTokenList,
    quote,
    fromSelectedToken,
    fromTokenValue,
    transactionType,
    fromAmount
  } = useTransactionForm()
  const {
    statuses: swapAndBridgeCtrlStatuses,
    updateQuoteStatus,
    formStatus,
    updateToTokenListStatus,
    signAccountOpController
  } = useSwapAndBridgeControllerState()

  const { networks } = useNetworksControllerState()
  const { portfolio } = useSelectedAccountControllerState()
  const { dispatch } = useBackgroundService()

  const handleSwitchFromAndToTokens = useCallback(
    () =>
      dispatch({
        type: 'TRANSACTION_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS'
      }),
    [dispatch]
  )

  const handleSetToNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: {
          toChainId: networks.filter((n) => String(n.chainId) === networkOption.value)[0].chainId
        }
      })
    },
    [networks, dispatch]
  )

  const defaultToTokenId = useMemo(() => {
    if (fromTokenValue.value === 'no-selection') return ''

    const tokenAddress = toTokenList.find(
      (token) => token.chainId === toChainId && token.symbol === fromSelectedToken?.symbol
    )?.address

    return `${tokenAddress}.${fromSelectedToken?.symbol}`
  }, [fromSelectedToken, toChainId, toTokenList, fromTokenValue.value])

  const {
    options: toTokenOptions,
    value: toTokenValue
    // amountSelectDisabled: toTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: toTokenList.filter((token) => token.symbol === (fromSelectedToken as any)?.symbol),
    token: toSelectedToken ? getTokenId(toSelectedToken, networks) : defaultToTokenId,
    networks,
    supportedChainIds,
    isLoading: !toTokenList.length && updateToTokenListStatus !== 'INITIAL',
    isToToken: true
  })

  const toTokenInPortfolio = useMemo(() => {
    const [address] = toTokenValue.value.split('.')

    if (!address || !toChainId) return null

    const bigintChainId = BigInt(toChainId)

    const tokenInPortfolio = portfolio?.tokens.find(
      (token) =>
        token.address === address &&
        token.chainId === bigintChainId &&
        !token.flags.onGasTank &&
        !token.flags.rewardsType
    )

    if (!tokenInPortfolio) return null

    const amountFormatted = formatDecimals(
      parseFloat(formatUnits(tokenInPortfolio.amount, tokenInPortfolio.decimals)),
      'amount'
    )

    return {
      ...tokenInPortfolio,
      amountFormatted
    }
  }, [portfolio?.tokens, toChainId, toTokenValue.value])

  const shouldShowAmountOnEstimationFailure = useMemo(() => {
    return (
      isAutoSelectRouteDisabled &&
      signAccountOpController?.estimation.status === EstimationStatus.Error
    )
  }, [isAutoSelectRouteDisabled, signAccountOpController?.estimation.status])

  const toNetworksOptions: SelectValue[] = useMemo(
    () =>
      networks
        // filter out networks that are not supported
        .filter((n) => getIsNetworkSupported(supportedChainIds, n))
        .map((n) => {
          const tooltipId = `network-${n.chainId}-not-supported-tooltip`
          const isNetworkSupported = getIsNetworkSupported(supportedChainIds, n)

          return {
            value: String(n.chainId),
            extraSearchProps: [n.name],
            disabled: !isNetworkSupported,
            label: (
              <>
                <Text
                  fontSize={14}
                  weight="medium"
                  dataSet={{ tooltipId }}
                  style={flexbox.flex1}
                  numberOfLines={1}
                >
                  {n.name}
                </Text>
                {!isNetworkSupported && (
                  <NotSupportedNetworkTooltip tooltipId={tooltipId} network={n} />
                )}
              </>
            ),
            icon: (
              <NetworkIcon
                key={n.chainId.toString()}
                id={n.chainId.toString()}
                style={{ backgroundColor: theme.primaryBackground }}
                size={18}
              />
            )
          }
        }),
    [networks, supportedChainIds, theme.primaryBackground]
  )

  const getToNetworkSelectValue = useMemo(() => {
    const network = networks.find((n) => Number(n.chainId) === toChainId)
    if (!network) return toNetworksOptions[0]

    return toNetworksOptions.filter((opt) => opt.value === String(network.chainId))[0]
  }, [networks, toChainId, toNetworksOptions])

  const handleChangeToToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = toTokenList.find(
        (tk: SwapAndBridgeToToken) => getTokenId(tk, networks) === value
      )

      setIsAutoSelectRouteDisabled(false)

      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { toSelectedToken: tokenToSelect }
      })
    },
    [toTokenList, setIsAutoSelectRouteDisabled, dispatch, networks]
  )

  const handleAddToTokenByAddress = useCallback(
    (searchTerm: string) => {
      const isValidTokenAddress = isAddress(searchTerm)
      if (!isValidTokenAddress) return

      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_ADD_TO_TOKEN_BY_ADDRESS',
        params: { address: searchTerm }
      })
    },
    [dispatch]
  )

  const formattedToAmount = useMemo(() => {
    if (transactionType === 'transfer') {
      return Number(fromAmount) > 0 ? fromAmount : '0'
    }

    if (
      !quote ||
      !quote.selectedRoute ||
      !quote?.toAsset?.decimals ||
      signAccountOpController?.estimation.status === EstimationStatus.Error
    )
      return '0'

    // return `${formatDecimals(
    //   Number(formatUnits(quote.selectedRoute.toAmount, quote.toAsset.decimals)),
    //   'amount'
    // )}`
    return quote.selectedRoute.toAmount
  }, [quote, signAccountOpController?.estimation.status, fromAmount, transactionType])

  return (
    <View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbTy
        ]}
      >
        <SwitchTokensButton
          onPress={handleSwitchFromAndToTokens}
          disabled={
            switchTokensStatus === 'LOADING' ||
            updateQuoteStatus === 'LOADING' ||
            updateToTokenListStatus === 'LOADING'
          }
        />
        <Text appearance="secondaryText" fontSize={16} weight="medium">
          {t('Receive')}
        </Text>
        <Select
          disabled // temporarily disabled
          setValue={handleSetToNetworkValue}
          containerStyle={{ ...spacings.mb0, width: 142 }}
          options={toNetworksOptions}
          size="sm"
          value={getToNetworkSelectValue}
          selectStyle={{
            backgroundColor: '#54597A14',
            borderWidth: 0
          }}
          mode="bottomSheet"
          bottomSheetTitle={t('Receive token network')}
        />
      </View>
      <View style={[styles.container, spacings.ph0]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.phSm]}>
          <ToTokenSelect
            toTokenOptions={toTokenOptions}
            toTokenValue={toTokenValue}
            handleChangeToToken={handleChangeToToken}
            // toTokenAmountSelectDisabled={toTokenAmountSelectDisabled}
            addToTokenByAddressStatus={swapAndBridgeCtrlStatuses.addToTokenByAddress}
            handleAddToTokenByAddress={handleAddToTokenByAddress}
          />
          <View style={[flexbox.flex1]}>
            {(formStatus === SwapAndBridgeFormStatus.Empty ||
              formStatus === SwapAndBridgeFormStatus.Invalid ||
              formStatus === SwapAndBridgeFormStatus.NoRoutesFound ||
              formStatus === SwapAndBridgeFormStatus.ReadyToSubmit ||
              formStatus === SwapAndBridgeFormStatus.Proceeded ||
              shouldShowAmountOnEstimationFailure) &&
            updateQuoteStatus !== 'LOADING' ? (
              <Text
                fontSize={20}
                weight="medium"
                numberOfLines={1}
                appearance={
                  formattedToAmount && formattedToAmount !== '0' ? 'primaryText' : 'secondaryText'
                }
                style={{ ...spacings.mr, textAlign: 'right' }}
              >
                {formattedToAmount}
                {!!formattedToAmount && formattedToAmount !== '0' && !!quote?.selectedRoute && (
                  <Text fontSize={20} appearance="secondaryText">{` (${formatDecimals(
                    quote.selectedRoute.outputValueInUsd,
                    'value'
                  )})`}</Text>
                )}
              </Text>
            ) : (
              <SkeletonLoader
                appearance="tertiaryBackground"
                width={100}
                height={32}
                style={{ marginLeft: 'auto' }}
              />
            )}
          </View>
        </View>
        <View
          style={[
            flexbox.directionRow,
            spacings.ptSm,
            spacings.pl,
            flexbox.alignCenter,
            {
              height: 32 // Prevents layout shifts
            }
          ]}
        >
          {toTokenInPortfolio && (
            <>
              <WalletFilledIcon width={14} height={14} color={theme.tertiaryText} />
              <Text
                testID="max-available-amount"
                numberOfLines={1}
                fontSize={12}
                style={spacings.mlMi}
                weight="medium"
                appearance="tertiaryText"
                ellipsizeMode="tail"
              >
                {toTokenInPortfolio?.amountFormatted} {toTokenInPortfolio?.symbol}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

export default memo(ToToken)

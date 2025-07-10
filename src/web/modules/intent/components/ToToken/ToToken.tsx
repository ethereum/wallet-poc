// import { isAddress } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
// import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { getIsNetworkSupported } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
// import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
// import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import NetworkIcon from '@common/components/NetworkIcon'
// import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
// import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
// import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
// import SwitchTokensButton from '@web/modules/intent/components/SwitchTokensButton'
// import ToTokenSelect from '@web/modules/intent/components/ToToken/ToTokenSelect'
// import useSwapAndBridgeForm from '@web/modules/intent/hooks/useSwapAndBridgeForm'
// import { getTokenId } from '@web/utils/token'
import getStyles from './styles'
import NotSupportedNetworkTooltip from '../NotSupportedNetworkTooltip'
import useTransactionForm from '../../hooks/useTransactionForm'
import { getInteropAddressChainId } from '../../utils/interopSdkService'
import ChainTokenIcon from '../ChainTokenIcon'

interface Props {
  isLoading?: boolean
}

const ToToken = ({ isLoading }: Props) => {
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const {
    toChainId,
    fromChainId,
    supportedChainIds,
    toSelectedToken,
    quote,
    transactionType,
    fromAmount,
    addressState
  } = useTransactionForm()

  const { signAccountOpController } = useSwapAndBridgeControllerState()

  const { networks } = useNetworksControllerState()
  const { dispatch } = useBackgroundService()

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

  const providerFee = useMemo(() => {
    if (!toSelectedToken?.symbol || !quote?.fee?.total) return null

    return `${quote?.fee?.total} ${toSelectedToken?.symbol}`
  }, [toSelectedToken?.symbol, quote])

  const outputAmount = useMemo(() => {
    if (!quote?.output || !toSelectedToken) return null

    return `${quote?.output.outputAmount} ${toSelectedToken?.symbol}`
  }, [quote?.output, toSelectedToken])

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

  const formattedToAmount = useMemo(() => {
    if (transactionType === 'transfer') {
      return Number(fromAmount) > 0 ? fromAmount : '0'
    }

    if (transactionType === 'intent') {
      return outputAmount
    }

    // TODO: this should be the quote value
    if (transactionType === 'swapAndBridge') {
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
  }, [transactionType, quote, signAccountOpController?.estimation.status, fromAmount, outputAmount])

  const toChain = useMemo(() => {
    if (toChainId && networks) {
      return networks?.find((n) => Number(n.chainId) === toChainId)
    }

    return null
  }, [toChainId, networks])

  const fromChain = useMemo(() => {
    if (fromChainId && networks) {
      return networks?.find((n) => Number(n.chainId) === fromChainId)
    }

    return null
  }, [fromChainId, networks])

  const isLoadingFeeAndTotal = useMemo(() => {
    // only should load if transaction is intent
    // and fromAmount is greater than zero
    // and there is no provider fee
    if (transactionType === 'intent' && fromAmount !== '' && !providerFee && isLoading) return true
    return false
  }, [providerFee, transactionType, fromAmount, isLoading])

  useEffect(() => {
    if (addressState.interopAddress) {
      getInteropAddressChainId(addressState.fieldValue)
        .then((interopChainId) => {
          const interopNetwork = networks.find((n) => Number(n.chainId) === interopChainId)

          if (!interopNetwork) return

          const toNetwork = toNetworksOptions.filter(
            (opt) => opt.value === String(interopChainId)
          )[0]

          if (!toNetwork) return

          handleSetToNetworkValue(toNetwork)
        })
        .catch(() => {
          // TODO: advice the user to add the network
        })
    }
  }, [addressState.interopAddress, addressState.fieldValue])

  return (
    <View>
      <View style={[styles.container, spacings.ph0]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View style={[flexbox.flex1]}>
            {transactionType === 'intent' && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.justifySpaceBetween,
                  spacings.mbSm,
                  { height: 32 }
                ]}
              >
                <Text fontSize={16} weight="medium" appearance="quaternaryText">
                  {t('Fee')}
                </Text>

                {!isLoadingFeeAndTotal ? (
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <ChainTokenIcon token={toSelectedToken} network={fromChain} />
                    <Text
                      fontSize={16}
                      weight="medium"
                      numberOfLines={1}
                      appearance="quaternaryText"
                      style={{ ...spacings.mr, textAlign: 'right' }}
                    >
                      <Text fontSize={16} appearance="quaternaryText">
                        {fromAmount === '' ? `0 ${toSelectedToken?.symbol}` : providerFee}
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <SkeletonLoader
                    appearance="tertiaryBackground"
                    width={100}
                    height={32}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </View>
            )}

            <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, { height: 32 }]}>
              <Text fontSize={16} weight="medium" appearance="quaternaryText">
                {t('Recipient gets')}
              </Text>

              {transactionType !== 'intent' ? (
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <ChainTokenIcon token={toSelectedToken} network={toChain} />
                  <Text
                    fontSize={16}
                    weight="medium"
                    numberOfLines={1}
                    appearance="quaternaryText"
                    style={{ ...spacings.mr, textAlign: 'right' }}
                  >
                    <Text fontSize={16} appearance="quaternaryText">
                      {formattedToAmount} {toSelectedToken?.symbol}
                    </Text>
                  </Text>
                </View>
              ) : (
                <View>
                  {!isLoadingFeeAndTotal ? (
                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <ChainTokenIcon token={toSelectedToken} network={toChain} />
                      <Text
                        fontSize={16}
                        weight="medium"
                        numberOfLines={1}
                        appearance="quaternaryText"
                        style={{ ...spacings.mr, textAlign: 'right' }}
                      >
                        <Text fontSize={16} appearance="quaternaryText">
                          {fromAmount === '' ? `0 ${toSelectedToken?.symbol}` : formattedToAmount}
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <SkeletonLoader
                      appearance="tertiaryBackground"
                      width={100}
                      height={32}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default memo(ToToken)

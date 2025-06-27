import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'

const PayOption = ({
  feeOption,
  amountUsd,
  disabledReason,
  amount
}: {
  feeOption: FeePaymentOption
  amountUsd: string
  amount: bigint
  disabledReason?: string
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { accounts } = useAccountsControllerState()
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const signAccountOpState = useSignAccountOpControllerState()

  const iconSize = 24

  const paidByAccountData = useMemo(
    () => accounts.find((a) => a.addr === feeOption.paidBy),
    [accounts, feeOption.paidBy]
  )

  const formattedAmount = useMemo(() => {
    return formatDecimals(Number(formatUnits(amount, feeOption.token.decimals)), 'amount')
  }, [amount, feeOption.token.decimals])

  const feeTokenNetworkName = useMemo(() => {
    if (feeOption.token.flags.onGasTank) {
      return 'Gas Tank'
    }

    return networks.find((n) => n.chainId === feeOption.token.chainId)?.name || ''
  }, [feeOption.token.flags.onGasTank, feeOption.token.chainId, networks])

  const warning = useMemo(() => {
    if (!signAccountOpState) return

    return signAccountOpState.warnings.find(
      ({ id }) =>
        id === 'bundler-failure' || id === 'estimation-retry' || id === 'feeTokenPriceUnavailable'
    )
  }, [signAccountOpState])

  const isPaidByAnotherAccount = feeOption.paidBy !== account?.addr

  const paidByLabel = useMemo(() => {
    return paidByAccountData?.preferences.label
  }, [paidByAccountData?.preferences.label])

  if (!paidByAccountData) return null

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        {
          width: '100%'
        }
      ]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
        <TokenIcon
          containerStyle={{
            width: iconSize,
            height: iconSize
          }}
          width={iconSize}
          height={iconSize}
          networkSize={12}
          address={feeOption.token.address}
          chainId={feeOption.token.chainId}
          onGasTank={feeOption.token.flags.onGasTank}
          skeletonAppearance="secondaryBackground"
        />

        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text weight="semiBold" fontSize={12} numberOfLines={1}>
            {formattedAmount} {feeOption.token.symbol}{' '}
            <Text fontSize={12}>{feeOption.token.flags.onGasTank ? t('from ') : t('on ')}</Text>
            <Text fontSize={12}>{feeTokenNetworkName}</Text>
          </Text>

          {disabledReason ? (
            <Text weight="medium" fontSize={10} numberOfLines={1} appearance="errorText">
              {disabledReason}
            </Text>
          ) : (
            <Text appearance="secondaryText" weight="medium" fontSize={10}>
              {formatDecimals(Number(amountUsd), 'value')}
            </Text>
          )}
        </View>
      </View>
      {isPaidByAnotherAccount && (
        <View style={[flexbox.alignEnd]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Avatar
              size={16}
              pfp={feeOption.paidBy}
              style={spacings.prTy}
              isSmart={false}
              displayTypeBadge={false}
            />
            <Text fontSize={10} weight="semiBold" numberOfLines={1}>
              {paidByLabel}
            </Text>
          </View>
          <Text fontSize={10} weight="medium">
            {shortenAddress(feeOption.paidBy, 13)}
          </Text>
        </View>
      )}
      {warning && (
        <>
          <WarningIcon
            width={20}
            height={20}
            style={spacings.mrTy}
            data-tooltip-id="estimation-warning"
            color={theme.warningText}
          />
          <Tooltip id="estimation-warning" content={warning.title} />
        </>
      )}
    </View>
  )
}

export default React.memo(PayOption)

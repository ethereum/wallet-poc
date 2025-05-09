import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import Text, { TextWeight } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

interface Props {
  chainId?: bigint
  withOnPrefix?: boolean
  style?: ViewStyle
  fontSize?: number
  weight?: TextWeight
  iconSize?: number
  renderNetworkName?: (networkName: string) => React.ReactNode
}

const NetworkBadge: FC<Props> = ({
  chainId,
  withOnPrefix,
  style,
  fontSize = 16,
  weight,
  iconSize = 32,
  renderNetworkName
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useNetworksControllerState()

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === chainId)
  }, [chainId, networks])

  const networkName = useMemo(() => network?.name || t('Unknown network'), [network?.name, t])

  if (!chainId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        ...spacings.pl,
        ...spacings.prTy,
        ...spacings.pvMi,
        borderRadius: BORDER_RADIUS_PRIMARY,
        backgroundColor: theme.secondaryBackground,
        ...style
      }}
    >
      <Text fontSize={fontSize} weight={weight || 'medium'} appearance="secondaryText">
        {withOnPrefix ? (
          <Text fontSize={fontSize} weight={weight || 'medium'} appearance="tertiaryText">
            on{' '}
          </Text>
        ) : null}
        {!renderNetworkName ? networkName : renderNetworkName(networkName)}
      </Text>
      <NetworkIcon
        key={network?.chainId.toString() || networkName}
        style={{ backgroundColor: 'transparent' }}
        id={network?.chainId.toString() || networkName}
        size={iconSize}
      />
    </View>
  )
}

export default memo(NetworkBadge)

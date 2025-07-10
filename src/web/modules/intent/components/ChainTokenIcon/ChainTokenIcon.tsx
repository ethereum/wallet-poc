import React, { FC, memo, ReactNode, useEffect } from 'react'
import { View, Image } from 'react-native'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { Network } from '@ambire-common/interfaces/network'
import NetworkIcon from '@common/components/NetworkIcon'
import getStyles from './styles'

type Props = {
  token: SwapAndBridgeToToken | null
  network: Network | null | undefined
}

const ChainTokenIcon: FC<Props> = ({ token, network }) => {
  const { styles } = useTheme(getStyles)

  if (token && !token.icon) {
    token.icon = 'https://cena.ambire.com/iconProxy/base/0x0000000000000000000000000000000000000000'
  }

  return (
    <View style={[styles.container, flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
      {!!network && (
        <NetworkIcon
          size={14}
          id={network.chainId.toString()}
          style={styles.chainIcon}
          benzinNetwork={network}
        />
      )}
      {!!token?.icon && typeof token?.icon !== 'string' && (
        <View style={spacings.mrTy}>{token.icon}</View>
      )}
      {!!token?.icon && typeof token?.icon === 'string' && (
        <Image source={{ uri: token.icon }} style={styles.tokenIcon} />
      )}
    </View>
  )
}

export default ChainTokenIcon

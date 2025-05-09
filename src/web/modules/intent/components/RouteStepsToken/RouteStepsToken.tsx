import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'

import styles from './styles'

interface Props {
  symbol: string
  address: string
  chainId?: bigint
  uri?: string
  isLast?: boolean
  amount?: string
}

const RouteStepsToken: React.FC<Props> = ({
  symbol,
  address,
  chainId,
  uri,
  isLast = false,
  amount = ''
}) => (
  <View style={[styles.tokenWrapper, { alignItems: isLast ? 'flex-end' : 'flex-start' }]}>
    <View style={styles.tokenContainer}>
      <TokenIcon
        uri={uri}
        width={30}
        height={30}
        address={address}
        chainId={chainId}
        withNetworkIcon
      />
    </View>

    <View style={styles.textContainer}>
      <Text fontSize={14} weight="medium" style={styles.text}>
        {amount ? `${amount} ` : ''}
        {symbol}
      </Text>
    </View>
  </View>
)

export default React.memo(RouteStepsToken)

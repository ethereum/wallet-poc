import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'

interface Props {
  tooltipId: string
  network?: Network
}

const NotSupportedNetworkTooltip: React.FC<Props> = ({ tooltipId, network }) => {
  const { t } = useTranslation()

  const networkName = network?.name || t('This')

  return (
    <Tooltip id={tooltipId}>
      <View>
        <Text fontSize={14} appearance="secondaryText">
          {t('{{networkName}} network is not supported by our service provider.', {
            networkName
          })}
        </Text>
      </View>
    </Tooltip>
  )
}

export default React.memo(NotSupportedNetworkTooltip)

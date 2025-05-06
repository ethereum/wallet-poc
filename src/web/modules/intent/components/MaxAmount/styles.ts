import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  maxButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    maxButton: {
      backgroundColor: '#6000FF14',
      ...common.borderRadiusPrimary,
      paddingVertical: 2,
      ...spacings.phSm,
      borderRadius: 11,
      ...spacings.mlTy
    }
  })

export default getStyles

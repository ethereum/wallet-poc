import { StyleSheet, ImageStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  tokenIcon: ImageStyle
  chainIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      position: 'relative'
    },
    tokenIcon: {
      width: 30,
      height: 30,
      ...common.borderRadiusPrimary,
      ...spacings.mrTy
    },
    chainIcon: {
      top: 0,
      left: -1,
      zIndex: 1,
      width: 14,
      height: 14,
      ...spacings.mrMi,
      position: 'absolute'
    }
  })
export default getStyles

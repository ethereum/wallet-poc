import { StyleSheet, ImageStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  containerWarning: ViewStyle
  tokenIcon: ImageStyle
  chainIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      ...spacings.ptMi,
      ...spacings.prMd,
      ...spacings.pb0,
      ...spacings.pl
    },
    containerWarning: {
      borderWidth: 1,
      borderColor: theme.warningDecorative,
      backgroundColor: theme.warningBackground
    },
    tokenIcon: {
      width: 30,
      height: 30,
      ...common.borderRadiusPrimary,
      ...spacings.mrTy
    },
    chainIcon: {
      width: 15,
      height: 30,
      ...spacings.mrMi
    }
  })
export default getStyles

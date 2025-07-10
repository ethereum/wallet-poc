import { StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.ptMd,
      ...spacings.prMd,
      ...spacings.pbSm,
      ...spacings.pl
    },
    containerWarning: {
      borderWidth: 1,
      borderColor: theme.warningDecorative,
      backgroundColor: theme.warningBackground
    }
  })
export default getStyles

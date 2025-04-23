import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getInputStyles from '../Input/styles'

interface Style {
  label: TextStyle
  domainIcons: ViewStyle
  plTy: ViewStyle
  button: ViewStyle
  bottomLabel: TextStyle
  chainLogo: ViewStyle
  icon: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    label: {
      ...spacings.mbMi
    },
    domainIcons: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mlTy
    },
    plTy: spacings.plTy,
    button: getInputStyles(theme).button,
    bottomLabel: {
      fontSize: 12
    },
    chainLogo: {
      ...flexbox.directionRow,
      ...flexbox.justifyEnd,
      ...flexbox.alignCenter
    },
    icon: {
      backgroundColor: theme.secondaryBackground,
      marginRight: -10
    }
  })

export default getStyles

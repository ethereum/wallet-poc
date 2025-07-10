import { StyleSheet, ViewStyle } from 'react-native'
import { ThemeProps } from '@common/styles/themeConfig'

interface Style {
  warningsModal: ViewStyle
  footer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    warningsModal: {
      backgroundColor: theme.primaryBackground,
      paddingHorizontal: 0,
      paddingVertical: 0,
      overflow: 'hidden'
    },
    footer: {
      backgroundColor: theme.primaryBackground,
      shadowColor: '#B8BDE080',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.64,
      shadowRadius: 8,
      elevation: 5
    }
  })

export default getStyles

import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  transactionsContainer: ViewStyle
  transactionsScrollView: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    transactionsContainer: {
      flex: 1
    },
    transactionsScrollView: {
      height: '100%'
    }
  })

export default getStyles

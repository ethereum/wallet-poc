import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

interface Style {
  panel: ViewStyle
  spinnerContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    panel: {
      maxHeight: '100%',
      maxWidth: 680,
      width: '100%',
      marginHorizontal: 'auto'
    },
    spinnerContainer: {
      ...flexbox.center,
      ...flexbox.flex1
    }
  })

export default getStyles

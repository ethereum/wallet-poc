import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  icon: ViewStyle
}

const styles = StyleSheet.create<Style>({
  icon: {
    marginBottom: 5
  }
})

export default styles

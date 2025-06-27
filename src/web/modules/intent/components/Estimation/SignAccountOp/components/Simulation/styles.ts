import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  simulationSection: ViewStyle
  simulationScrollView: ViewStyle
  simulationContainer: ViewStyle
  simulationContainerHeader: ViewStyle
  spinner: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    simulationSection: {
      ...spacings.pbLg
    },
    simulationScrollView: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    simulationContainer: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.secondaryBorder,
      overflow: 'hidden',
      ...flexbox.flex1,
      maxHeight: '100%'
    },
    simulationContainerHeader: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.phTy,
      ...spacings.pvMi
    },
    spinner: {
      alignSelf: 'center'
    }
  })

export default getStyles

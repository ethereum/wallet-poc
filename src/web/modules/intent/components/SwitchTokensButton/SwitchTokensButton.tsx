import React from 'react'
import { Animated, Pressable, PressableProps, View } from 'react-native'

import RepeatIcon from '@common/assets/svg/RepeatIcon'
import useTheme from '@common/hooks/useTheme'
import { useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

const SWITCH_TOKENS_CONDITION_TOOLTIP_ID = 'switch-tokens-condition-tooltip-sab'

const SwitchTokensButton = ({ disabled, ...rest }: PressableProps) => {
  const { styles } = useTheme(getStyles)
  const [bindAnim, , , , animatedValues] = useCustomHover({
    property: 'rotateZ' as any,
    values: { from: 0, to: 1 },
    duration: 250
  })

  const rotateInterpolate = animatedValues
    ? animatedValues[0].value.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
      })
    : null

  return (
    <View style={styles.switchTokensButtonWrapper} testID={SWITCH_TOKENS_CONDITION_TOOLTIP_ID}>
      <Pressable
        style={[styles.switchTokensButton, disabled ? { opacity: 0.5 } : {}]}
        disabled={disabled}
        {...bindAnim}
        {...rest}
      >
        <Animated.View style={{ transform: [{ rotateZ: rotateInterpolate || '0deg' }] }}>
          <RepeatIcon />
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default React.memo(SwitchTokensButton)

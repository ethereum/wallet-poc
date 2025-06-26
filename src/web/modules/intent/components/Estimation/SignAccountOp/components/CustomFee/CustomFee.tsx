import React from 'react'
import { View, ViewStyle } from 'react-native'

import EditIcon from '@common/assets/svg/EditIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import FeeWrapper from '@web/modules/sign-account-op/components/FeeWrapper'

import styles from './styles'

interface Props {
  onPress: () => void
  style?: ViewStyle
}

const CustomFee = ({ onPress, style }: Props) => {
  const { t } = useTranslation()
  return (
    <FeeWrapper onPress={onPress} type="custom" isSelected={false} style={style}>
      <View style={styles.icon}>
        <EditIcon width={21} height={21} />
      </View>
      <Text fontSize={14} weight="medium" numberOfLines={1}>
        {t('Custom')}
      </Text>
    </FeeWrapper>
  )
}

export default CustomFee

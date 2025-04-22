import React from 'react'
import { View } from 'react-native'

import Checkbox from '@common/components/Checkbox'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'

type Props = {
  isInteropAddressAgreed: boolean
  onInteropAddressCheckboxClick: () => void
}

const UseInteropAddress = ({ isInteropAddressAgreed, onInteropAddressCheckboxClick }: Props) => {
  const { t } = useTranslation()

  return (
    <View style={spacings.mbMd}>
      <Checkbox
        value={isInteropAddressAgreed}
        onValueChange={onInteropAddressCheckboxClick}
        label={t('Use interoperable address')}
        style={spacings.mb0}
        testID="use-interop-address-checkbox"
      />
    </View>
  )
}

export default UseInteropAddress

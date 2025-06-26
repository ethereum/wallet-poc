import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import spacings from '@common/styles/spacings'

const EstimationSkeleton = () => {
  return (
    <View>
      <SkeletonLoader width="100%" height={120} style={spacings.mbMi} />
    </View>
  )
}

export default EstimationSkeleton

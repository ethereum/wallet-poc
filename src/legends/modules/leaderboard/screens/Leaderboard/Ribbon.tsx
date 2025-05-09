import React from 'react'
import Svg, { Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const Ribbon: React.FC<LegendsSvgProps> = ({ width = 14, height = 16, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 14 16" fill="none" {...rest}>
      <Path
        d="M9.4 1C11.8 1 13 2.15304 13 4.45912V12.5076C13 14.7794 11.308 15.6584 9.232 14.4711L7.648 13.5578C7.288 13.3524 6.712 13.3524 6.352 13.5578L4.768 14.4711C2.692 15.6584 1 14.7794 1 12.5076V4.45912C1 2.15304 2.2 1 4.6 1H9.4Z"
        fill="#00BB92"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default Ribbon

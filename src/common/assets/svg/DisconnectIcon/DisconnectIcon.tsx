import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const DisconnectIcon: React.FC<Props> = ({
  width = 34,
  height = 34,

  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 34 34" {...rest}>
    <Rect
      width="34"
      height="34"
      rx="13"
      transform="rotate(-90 17 17)"
      fill={colors.titan}
      opacity=".05"
    />
    <G transform="translate(5 5)">
      <G transform="translate(-788 -742)">
        <Path
          d="M5181.415,24.92a1,1,0,0,1,0-1.414l1.484-1.485a5,5,0,0,1,.636-6.294l.707-.707-.353-.353a1,1,0,0,1,1.414-1.414l7.779,7.778a1,1,0,0,1-1.414,1.415l-.354-.354-.707.707a5,5,0,0,1-6.293.637l-1.485,1.485a1,1,0,0,1-1.414,0Zm7.777-3.536.708-.706-4.243-4.243-.708.708a3,3,0,0,0-.024,4.217l.025.025.024.025A3,3,0,0,0,5189.192,21.385Zm3.536-4.95a1,1,0,0,1,0-1.414l2.121-2.121-1.414-1.414-2.121,2.121a1,1,0,0,1-1.414-1.415l2.121-2.12h0l-1.414-1.414h0l-.353-.353a1,1,0,1,1,1.414-1.414l.353.353.707-.707a5,5,0,0,1,6.293-.636l1.484-1.485a1,1,0,0,1,1.416,1.414l-1.485,1.485a5,5,0,0,1-.636,6.293l-.708.707.354.353a1,1,0,1,1-1.414,1.414l-.354-.354-1.415-1.414-2.121,2.121a1,1,0,0,1-1.414,0Zm1.414-8.485-.707.708,4.242,4.242.708-.708a3,3,0,0,0-4.243-4.242Z"
          transform="translate(-4391.643 739.542)"
          fill={colors.titan}
        />
      </G>
    </G>
  </Svg>
)

export default DisconnectIcon

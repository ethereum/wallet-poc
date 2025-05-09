import React, { FC } from 'react'
import Svg, { Defs, G, Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const LockIcon: FC<LegendsSvgProps> = ({ width = 45, height = 64, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 35 35" fill="none" {...rest}>
      <Path
        d="M28.31 17.239a4.666 4.666 0 011.166 2.656h-2.753c-.682.032-2.26.032-3.702 0l-4.407.032c-2.507 0-3.621 0-6.634-.032l-6.459.032c.156-1.947 1.575-3.607 3.469-4.094l.003-7.955c1.004-10.431 16.701-10.003 17.048.518l.003 7.42c.014.04.58.214.679.257.6.259 1.156.683 1.588 1.166zm-5.289-1.166V8.017c-.633-6.382-10.36-6.41-11.042-.035v8.09H23.02z"
        fill="#E13A7B"
      />
      <G filter="url(#filter0_d_3597_2358)">
        <Path
          d="M28.814 17.255a4.562 4.562 0 011.22 2.653l.002 10.59c-.206 2.295-2.177 4.096-4.596 4.226l-15.877-.002c-2.381-.11-4.393-1.932-4.596-4.191l-.002-10.59c.163-1.946 1.647-3.604 3.63-4.091l7.156-.017h2.915l6.774.017c.014.04 1.253 0 1.253 0s1.05.26 2.121 1.405z"
          fill="#E13A7B"
        />
      </G>
      <Path
        d="M16.772 20.447c2.76-.824 4.372 2.89 1.951 4.34l-.006 4.085c-.12 1.6-2.288 1.582-2.432.035l.002-4.103c-1.776-1.015-1.5-3.765.485-4.357z"
        fill="#191A1F"
      />
      <Defs>
        <filter
          id="filter0_d_3597_2358"
          x="0.964844"
          y="7.83307"
          width="33.0703"
          height="26.8909"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.18109 0 0 0 0 0.129132 0 0 0 0 0.0107376 0 0 0 0.6 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3597_2358" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3597_2358"
            result="shape"
          />
        </filter>
      </Defs>
    </Svg>
  )
}

export default LockIcon

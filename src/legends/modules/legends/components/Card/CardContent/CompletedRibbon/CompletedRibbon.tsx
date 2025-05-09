import * as React from 'react'
import Svg, { G, Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

const CompletedRibbon: React.FC<LegendsSvgProps> = ({ width = 55, height = 70, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 55 70" fill="none" {...rest}>
    <G filter="url(#filter3_d_3695_6869)">
      <Path
        d="M27.9757 42.0181L20.9559 61.9496L20.6085 61.8717L16.5114 54.2487C16.0018 53.5754 15.0235 53.3523 14.2101 53.5662C11.6472 54.5022 8.94255 56.2383 6.40825 57.0978C6.22295 57.1598 6.13439 57.2919 5.9668 57.0727L13.5488 36.5C14.2451 38.1424 14.9036 39.4489 16.7348 39.4833C18.0156 39.507 19.5444 38.9776 20.787 39.1493C23.1169 39.4701 25.0776 43.0677 27.9743 42.0194L27.9757 42.0181Z"
        fill="#00BB92"
      />
      <Path
        d="M33.4055 61.9312L32.8945 61.9405L26.0488 42C26.6347 39.6804 29.1564 42.251 30.0488 40C30.9672 39.4059 32.1056 39.2998 33.257 39.148C35.4357 38.8602 37.737 40.3125 39.8312 38.6516C40.4484 38.1618 40.0365 36.54 40.5488 36L48.1357 56.9896C48.0349 57.3817 47.2378 56.9408 46.9585 56.8259C44.5782 55.8489 42.2183 54.563 39.8339 53.5636C39.1008 53.3999 38.346 53.4527 37.7792 53.957C36.1687 56.5143 34.7857 59.2393 33.4041 61.9273L33.4055 61.9312Z"
        fill="#00BB92"
      />
    </G>
    <G filter="url(#filter2_d_3695_6869)">
      <Path
        d="M27.3515 0.0157545C28.8216 0.197946 30.5938 2.39231 32.331 2.84779C34.2767 3.35719 37.0998 2.20711 38.5195 2.92396C39.7144 3.52729 40.4183 6.82456 41.665 8.06165C42.9893 9.37396 46.197 9.80049 46.9423 11.1339C47.6547 12.4093 46.7548 14.9082 46.9169 16.4396C47.1608 18.7472 50.2389 20.709 50.039 22.4992C49.8387 24.2894 47.3066 25.8228 46.9755 27.8546C46.7127 29.4732 47.6833 32.3929 46.8905 33.5812C46.0485 34.8446 42.8565 35.2029 41.4599 36.7687C40.2609 38.114 39.7261 41.6397 37.8554 41.8576C35.993 42.074 34.2289 41.2775 32.3066 41.7618C30.4222 42.2371 28.5304 44.8329 26.6923 44.6163C25.0464 44.4221 23.3488 41.9823 21.1689 41.6495C19.5897 41.4093 16.6532 42.2965 15.4501 41.6456C14.1641 40.9485 13.6029 37.738 12.3114 36.5021C11.0211 35.2677 7.72638 34.7075 7.00969 33.4533C6.23717 32.1013 7.44775 29.3183 6.92863 27.4581C6.35488 25.4027 3.42497 23.7537 4.10051 21.5597C4.73132 19.5082 7.19186 18.6511 7.13762 15.6466C7.11173 14.1734 6.13814 11.9795 7.31208 10.7437C7.3123 10.7434 7.3126 10.7433 7.31291 10.7433C7.31322 10.7433 7.31352 10.7432 7.31373 10.7429C8.31273 9.69231 11.0291 9.33496 12.3124 8.12708C13.5958 6.91896 14.138 3.62769 15.5263 2.92396C16.9337 2.20977 19.7187 3.34156 21.6044 2.87318C23.6167 2.37285 25.4033 -0.225339 27.3515 0.0157545Z"
        fill="#00BB92"
      />
    </G>
    <Path
      d="M18.0488 24.1714L24.434 30.6L36.9488 18"
      stroke="#F4F4F7"
      strokeWidth={4}
      strokeLinecap="round"
    />
    <defs>
      <filter
        id="filter3_d_3695_6869"
        x="1.9668"
        y="36"
        width="50.1689"
        height="33.9496"
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
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3695_6869" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3695_6869"
          result="shape"
        />
      </filter>
      <filter
        id="filter2_d_3695_6869"
        x="0"
        y="0"
        width="54.0479"
        height="52.6292"
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
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3695_6869" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3695_6869"
          result="shape"
        />
      </filter>
    </defs>
  </Svg>
)

export default React.memo(CompletedRibbon)

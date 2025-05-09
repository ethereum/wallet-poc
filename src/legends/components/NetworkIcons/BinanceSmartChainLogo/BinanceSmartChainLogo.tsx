import React from 'react'
import Svg, { Path, Rect, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const BinanceSmartChainLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 28 28" fill="none" {...rest}>
    <Rect
      x="1.25"
      y="1.25"
      width="26"
      height="26"
      rx="12.5"
      stroke="#6A6F86"
      strokeOpacity="0.3"
      strokeWidth="1.5"
    />
    <Rect
      transform="matrix(.9067 0 0 .9067 1.29 1.28)"
      stroke="none"
      fillRule="evenodd"
      fill="#f0b90b"
      fillOpacity={1}
      width={26}
      height={26}
      rx="12.5"
      x="1.5"
      y="1.5"
    />
    <Path
      d="M7.695 14l.008 3.703 3.149 1.852v2.164l-4.989-2.922v-5.879zm0-3.703v2.16l-1.832-1.086V9.215l1.832-1.086 1.84 1.086zm4.47-1.082l1.831-1.086 1.84 1.086-1.84 1.082zm0 0"
      transform="matrix(.9067 0 0 .9067 1.29 1.28)"
      stroke="none"
      fillRule="nonzero"
      fill="#fff"
      fillOpacity={1}
    />
    <Path
      d="M9.02 16.934v-2.168l1.832 1.086v2.156zm3.144 3.394l1.832 1.086 1.84-1.086v2.16l-1.84 1.082-1.832-1.082zm6.3-11.113l1.833-1.086 1.84 1.086v2.156l-1.84 1.086v-2.16zm1.833 8.488L20.305 14l1.832-1.082v5.875l-4.985 2.926V19.55zm0 0"
      transform="matrix(.9067 0 0 .9067 1.29 1.28)"
      stroke="none"
      fillRule="nonzero"
      fill="#fff"
      fillOpacity={1}
    />
    <Path
      d="M18.98 16.934l-1.832 1.074v-2.156l1.832-1.086zm0 0"
      transform="matrix(.9067 0 0 .9067 1.29 1.28)"
      stroke="none"
      fillRule="nonzero"
      fill="#fff"
      fillOpacity={1}
    />
    <Path
      d="M18.98 11.066l.012 2.168-3.156 1.848v3.711l-1.832 1.074-1.832-1.074v-3.711L9.02 13.234v-2.168l1.84-1.086 3.136 1.86 3.152-1.86 1.84 1.086zM9.02 7.363l4.976-2.933 4.984 2.933-1.832 1.086-3.152-1.86-3.144 1.86zm0 0"
      transform="matrix(.9067 0 0 .9067 1.29 1.28)"
      stroke="none"
      fillRule="nonzero"
      fill="#fff"
      fillOpacity={1}
    />
  </Svg>
)

export default React.memo(BinanceSmartChainLogo)

import React from 'react'

import { NetworkIcon } from '@legends/components/NetworkIcons'
import { Networks } from '@legends/modules/legends/types'

import styles from './Stacked.module.scss'

interface StackedProps {
  chains: Networks[]
}

const Stacked: React.FC<StackedProps> = ({ chains }) => (
  <div className={styles.itemNetworks}>
    {chains.map((chain) => (
      <React.Fragment key={chain}>
        <NetworkIcon chainId={chain} />
      </React.Fragment>
    ))}
  </div>
)

export default Stacked

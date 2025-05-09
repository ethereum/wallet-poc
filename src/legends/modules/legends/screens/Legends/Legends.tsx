import React from 'react'

import LockIcon from '@legends/common/assets/svg/LockIcon'
import Page from '@legends/components/Page'
import Spinner from '@legends/components/Spinner'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import Card from '@legends/modules/legends/components/Card'
import { CardGroup, CardGroupNameMapping, CardStatus } from '@legends/modules/legends/types'

import styles from './Legends.module.scss'

const GROUP_SORT = [
  CardGroup.MiniGame,
  CardGroup.Show,
  CardGroup.Supporter,
  CardGroup.GasTank,
  CardGroup.SwapAndBridge,
  CardGroup.Transactions,
  CardGroup.Seasonal
]

const Legends = () => {
  const { legends, isLoading } = useLegendsContext()

  const isOverachieverReached = legends.some(
    (card) => card.id === 'overachiever' && card.card.status === CardStatus.completed
  )
  const processedLegends = legends
    .sort((a, b) => {
      const indexA = GROUP_SORT.indexOf(a.group)
      const indexB = GROUP_SORT.indexOf(b.group)

      return indexA - indexB
    })
    .reduce((groups, card) => {
      const group = card.group || 'Ungrouped'
      return {
        ...groups,
        [group]: [...(groups[group] || []), card]
      }
    }, {} as Record<string, typeof legends>)

  return (
    <Page containerSize="lg">
      {isOverachieverReached && (
        <div className={styles.overachieverBanner}>
          <LockIcon className={styles.lockIcon} width={29} height={37} />
          <p className={styles.overachieverText}>
            Daily limit of 20 transactions reached. Every other transaction for the rest of the day
            earns you 1XP.
          </p>
        </div>
      )}
      {!isLoading ? (
        <div>
          {Object.entries(processedLegends).map(([groupName, cards]) => (
            <div key={groupName} className={styles.group}>
              <h2 className={styles.groupName}>
                {CardGroupNameMapping[groupName as keyof typeof CardGroupNameMapping]}
              </h2>
              <div className={styles.cards}>
                {cards.map((card) => (
                  <Card key={card.title + card.card.type} cardData={card} action={card.action} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.spinnerContainer}>
          <Spinner />
        </div>
      )}
    </Page>
  )
}

export default Legends

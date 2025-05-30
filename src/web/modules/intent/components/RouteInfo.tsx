import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'

const RouteInfo: FC = () => {
  const { t } = useTranslation()
  const state = useTransactionControllerState()

  const providerFee = useMemo(() => {
    if (!state.intent?.quote?.fee && state.transactionType !== 'intent') return null
    return `${state.intent?.quote?.fee?.total} ${
      state.formState?.toSelectedToken?.symbol
    } (${Number(state.intent?.quote?.fee?.percent).toFixed(2)}%)`
  }, [state.formState?.toSelectedToken?.symbol, state.intent?.quote?.fee, state.transactionType])

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        {
          height: 25 // Prevents layout shifts
        },
        spacings.mbLg
      ]}
    >
      {providerFee && state.transactionType === 'intent' && (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text appearance="tertiaryText" fontSize={14} weight="medium">
            {t('Provider fee: {{fee}}', {
              fee: providerFee
            })}
          </Text>
        </View>
      )}
    </View>
  )
}

export default RouteInfo

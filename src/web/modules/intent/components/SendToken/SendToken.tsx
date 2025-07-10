import React, { FC, memo, ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import FlipIcon from '@common/assets/svg/FlipIcon'
import NumberInput from '@common/components/NumberInput'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import MaxAmount from '@web/modules/swap-and-bridge/components/MaxAmount'

import getStyles from './styles'

type Props = {
  fromTokenOptions: SelectValue[]
  fromTokenValue?: SelectValue
  fromAmountValue: string
  fromTokenAmountSelectDisabled: boolean
  handleChangeFromToken: (value: SelectValue) => void
  fromSelectedToken: TokenResult | null
  fromAmount?: string
  fromAmountInFiat?: string
  fromAmountFieldMode: 'token' | 'fiat'
  maxFromAmount: string
  validateFromAmount: { message?: string; success?: boolean }
  onFromAmountChange: (value: string) => void
  handleSwitchFromAmountFieldMode: () => void
  handleSetMaxFromAmount: () => void
  inputTestId?: string
  selectTestId?: string
  title?: string | ReactNode
  maxAmountDisabled?: boolean
}

const SendToken: FC<Props> = ({
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  handleChangeFromToken,
  fromSelectedToken,
  fromAmount,
  fromAmountInFiat,
  fromAmountFieldMode,
  maxFromAmount,
  validateFromAmount,
  onFromAmountChange,
  handleSwitchFromAmountFieldMode,
  handleSetMaxFromAmount,
  inputTestId,
  selectTestId,
  title,
  maxAmountDisabled
}) => {
  const { portfolio } = useSelectedAccountControllerState()
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const heading = title ?? t('Send')

  const dollarIcon = useCallback(() => {
    if (fromAmountFieldMode === 'token') return null

    return (
      <Text
        fontSize={20}
        weight="medium"
        style={{ marginBottom: 3 }}
        appearance={fromAmountInFiat ? 'primaryText' : 'secondaryText'}
      >
        $
      </Text>
    )
  }, [fromAmountFieldMode, fromAmountInFiat])
  return (
    <View style={spacings.mbXl}>
      <Text appearance="quaternaryText" fontSize={16} weight="medium" style={spacings.mbTy}>
        {heading}
      </Text>
      <View
        style={[
          styles.container,
          spacings.pr2Xl,
          !!validateFromAmount.message && styles.containerWarning
        ]}
      >
        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
          <Select
            setValue={handleChangeFromToken}
            options={fromTokenOptions}
            value={fromTokenValue}
            testID={selectTestId}
            bottomSheetTitle={t('Send token')}
            searchPlaceholder={t('Token name or address...')}
            emptyListPlaceholderText={t('No tokens found.')}
            containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
            selectStyle={{
              backgroundColor: '#54597A14',
              borderWidth: 0
            }}
            mode="bottomSheet"
          />
          <NumberInput
            value={fromAmountValue}
            onChangeText={onFromAmountChange}
            placeholder="0"
            borderless
            inputWrapperStyle={{ backgroundColor: 'transparent' }}
            nativeInputStyle={{
              fontFamily: FONT_FAMILIES.MEDIUM,
              fontSize: 20,
              textAlign: 'right'
            }}
            disabled={fromTokenAmountSelectDisabled}
            containerStyle={[spacings.mb0, flexbox.flex1]}
            leftIcon={dollarIcon}
            leftIconStyle={spacings.plXl}
            inputStyle={spacings.ph0}
            error={validateFromAmount.message || ''}
            errorType="warning"
            testID={inputTestId}
          />
        </View>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.ptSm
          ]}
        >
          {!fromTokenAmountSelectDisabled && (
            <MaxAmount
              isLoading={!portfolio?.isReadyToVisualize}
              maxAmount={Number(maxFromAmount)}
              selectedTokenSymbol={fromSelectedToken?.symbol || ''}
              onMaxButtonPress={handleSetMaxFromAmount}
              disabled={maxAmountDisabled}
            />
          )}
        </View>
      </View>
    </View>
  )
}

export default memo(SendToken)

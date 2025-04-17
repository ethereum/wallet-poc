import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SpeedCalc } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Warning } from '@ambire-common/interfaces/signAccountOp'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AssetIcon from '@common/assets/svg/AssetIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import Select, { SectionedSelect } from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useBackgroundService from '@web/hooks/useBackgroundService'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import EstimationSkeleton from './components/EstimationSkeleton'
import { NO_FEE_OPTIONS } from './consts'
import { getDefaultFeeOption, mapFeeOptions, sortFeeOptions } from './helpers'
import { Props } from './types'

const FEE_SECTION_LIST_MENU_HEADER_HEIGHT = 34

export const SPEED_TEST_IDS = {
  slow: 'option-slow',
  medium: 'option-medium',
  fast: 'option-fast',
  ape: 'option-ape'
}

const FeeSpeedLabel = ({
  speed,
  feeTokenPriceUnavailableWarning,
  payValue,
  isValue
}: {
  speed: SpeedCalc
  feeTokenPriceUnavailableWarning?: Warning
  payValue?: SelectValue
  isValue?: boolean
}) => {
  const { t } = useTranslation()

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween
      ]}
      testID={SPEED_TEST_IDS[speed.type]}
    >
      <Text weight="medium" fontSize={12} style={spacings.mrMi}>
        {t(speed.type.charAt(0).toUpperCase() + speed.type.slice(1))}
      </Text>
      {!isValue && (
        <Text
          fontSize={!feeTokenPriceUnavailableWarning ? 14 : 12}
          style={spacings.mlMi}
          numberOfLines={1}
          weight={!feeTokenPriceUnavailableWarning ? 'regular' : 'medium'}
          appearance="secondaryText"
        >
          {!feeTokenPriceUnavailableWarning
            ? formatDecimals(Number(speed.amountUsd), 'value')
            : `${formatDecimals(Number(speed.amountFormatted), 'precise')} ${
                payValue?.token.symbol
              }`}
        </Text>
      )}
    </View>
  )
}

const Estimation = ({
  signAccountOpState,
  disabled,
  hasEstimation,
  isSponsored,
  sponsor,
  slowRequest
}: Props) => {
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { minWidthSize } = useWindowSize()

  const feeTokenPriceUnavailableWarning = useMemo(() => {
    return signAccountOpState?.warnings.find((warning) => warning.id === 'feeTokenPriceUnavailable')
  }, [signAccountOpState?.warnings])

  const payOptionsPaidByUsOrGasTank = useMemo(() => {
    if (!signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.estimation.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy === signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [hasEstimation, signAccountOpState])

  const payOptionsPaidByEOA = useMemo(() => {
    if (!signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.estimation.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy !== signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [hasEstimation, signAccountOpState])

  const defaultFeeOption = useMemo(
    () => getDefaultFeeOption(payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA),
    [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank]
  )

  const [selectedFeeOption, setSelectedFeeOption] = useState<SelectValue['value'] | null>(null)

  const payValue = useMemo(() => {
    return (
      payOptionsPaidByUsOrGasTank.find(({ value }) => value === selectedFeeOption) ||
      payOptionsPaidByEOA.find(({ value }) => value === selectedFeeOption)
    )
  }, [payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA, selectedFeeOption])

  const setFeeOption = useCallback(
    (localPayValue: any) => {
      if (!signAccountOpState?.selectedFeeSpeed) return
      setSelectedFeeOption(localPayValue.value)

      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          feeToken: localPayValue.token,
          paidBy: localPayValue.paidBy,
          speed: localPayValue.speedCoverage.includes(signAccountOpState.selectedFeeSpeed)
            ? signAccountOpState.selectedFeeSpeed
            : FeeSpeed.Fast
        }
      })
    },
    [dispatch, signAccountOpState?.selectedFeeSpeed]
  )

  useEffect(() => {
    if (!hasEstimation) return

    const isInitialValueSet = !!payValue
    const canPayFeeAfterNotBeingAbleToPayInitially =
      payValue?.value === NO_FEE_OPTIONS.value && defaultFeeOption.value !== NO_FEE_OPTIONS.value
    const feeOptionNoLongerViable = payValue?.disabled !== defaultFeeOption.disabled

    if (
      !isInitialValueSet ||
      canPayFeeAfterNotBeingAbleToPayInitially ||
      feeOptionNoLongerViable ||
      (payValue &&
        !payOptionsPaidByUsOrGasTank.find(
          (payOption) =>
            payOption.paidBy === payValue.paidBy &&
            payOption.token.address === payValue.token?.address
        ) &&
        !payOptionsPaidByEOA.find(
          (payOption) =>
            payOption.paidBy === payValue.paidBy &&
            payOption.token.address === payValue.token?.address
        ))
    ) {
      setFeeOption(defaultFeeOption)
    }
  }, [
    payValue,
    setFeeOption,
    hasEstimation,
    defaultFeeOption.value,
    defaultFeeOption,
    signAccountOpState?.account.addr,
    payOptionsPaidByUsOrGasTank,
    payOptionsPaidByEOA
  ])

  const feeSpeeds = useMemo(() => {
    if (!signAccountOpState?.selectedOption) return []

    const identifier = getFeeSpeedIdentifier(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp.accountAddr,
      signAccountOpState.rbfAccountOps[signAccountOpState.selectedOption.paidBy]
    )
    return signAccountOpState.feeSpeeds[identifier]
  }, [
    signAccountOpState?.feeSpeeds,
    signAccountOpState?.selectedOption,
    signAccountOpState?.accountOp.accountAddr,
    signAccountOpState?.rbfAccountOps
  ])

  const isGaslessTransaction = useMemo(() => {
    return (
      feeSpeeds.every((speed) => !speed.amount) &&
      !signAccountOpState?.estimation.error &&
      !signAccountOpState?.errors.length &&
      !!feeSpeeds.length
    )
  }, [feeSpeeds, signAccountOpState?.errors.length, signAccountOpState?.estimation.error])

  const feeSpeedOptions = useMemo(() => {
    return feeSpeeds.map((speed) => ({
      label: (
        <FeeSpeedLabel
          speed={speed}
          feeTokenPriceUnavailableWarning={feeTokenPriceUnavailableWarning}
          payValue={payValue}
        />
      ),
      value: speed.type,
      speed,
      disabled: speed.disabled
    }))
  }, [feeSpeeds, feeTokenPriceUnavailableWarning, payValue])

  const selectedFee = useMemo(() => {
    const selectedOption =
      feeSpeedOptions.find(({ value }) => value === signAccountOpState?.selectedFeeSpeed) ||
      feeSpeedOptions[0]

    if (!selectedOption) return null

    return {
      ...selectedOption,
      label: (
        <FeeSpeedLabel
          speed={selectedOption.speed}
          feeTokenPriceUnavailableWarning={feeTokenPriceUnavailableWarning}
          payValue={payValue}
          isValue
        />
      )
    }
  }, [
    feeSpeedOptions,
    feeTokenPriceUnavailableWarning,
    payValue,
    signAccountOpState?.selectedFeeSpeed
  ])

  const onFeeSelect = useCallback(
    ({ value }: { value: string }) => {
      if (!Object.values(FeeSpeed).includes(value as FeeSpeed)) {
        console.error('Invalid fee speed')
        return
      }

      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          speed: value as FeeSpeed
        }
      })
    },
    [dispatch]
  )

  const feeOptionSelectSections = useMemo(() => {
    if (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length)
      return [
        {
          data: [NO_FEE_OPTIONS],
          key: 'no-options'
        }
      ]

    return [
      {
        title: {
          icon: <FeeIcon color={theme.secondaryText} width={16} height={16} />,
          text: t('With fee tokens from current account')
        },
        data: payOptionsPaidByUsOrGasTank,
        key: 'account-tokens'
      },
      {
        title: {
          icon: <AssetIcon color={theme.secondaryText} width={16} height={16} />,
          text: t('With native assets of my basic accounts')
        },
        data: payOptionsPaidByEOA,
        key: 'eoa-tokens'
      }
    ]
  }, [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank, t, theme.secondaryText])

  const renderFeeOptionSectionHeader = useCallback(
    ({ section }: any) => {
      if (section.data.length === 0 || !section.title) return null

      return (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phTy,
            spacings.pvTy,
            {
              backgroundColor: theme.primaryBackground,
              height: FEE_SECTION_LIST_MENU_HEADER_HEIGHT
            },
            section?.key === 'eoa-tokens' && {
              borderTopWidth: 1,
              borderTopColor: theme.secondaryBorder
            }
          ]}
        >
          {section.title.icon}
          <Text
            style={minWidthSize('xl') ? spacings.mlMi : spacings.mlTy}
            fontSize={minWidthSize('xl') ? 12 : 14}
            weight="medium"
            appearance="secondaryText"
          >
            {section.title.text}
          </Text>
        </View>
      )
    },
    [minWidthSize, theme.primaryBackground, theme.secondaryBorder]
  )

  if (!hasEstimation && !!slowRequest) {
    return (
      <View style={spacings.ptTy}>
        <Alert
          type="warning"
          size="sm"
          title="Estimating this transaction is taking an unexpectedly long time. We'll keep trying, but it is possible that there's an issue with this network or RPC - please change your RPC provider or contact Ambire support if this issue persists."
        />
      </View>
    )
  }
  if (
    !signAccountOpState ||
    // <Bobby>: the line below may be incorrect and may cause
    // estimation flashing
    signAccountOpState.estimation.status === EstimationStatus.Error ||
    (!hasEstimation && signAccountOpState.estimation.estimationRetryError) ||
    !payValue
  ) {
    return <EstimationSkeleton />
  }

  if (isSponsored) {
    return (
      <View>
        {sponsor && (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            {sponsor.icon && (
              <ManifestImage
                uri={sponsor.icon}
                size={64}
                fallback={() => <ManifestFallbackIcon width={64} height={64} />}
              />
            )}
            <View style={spacings.ml}>
              <Text fontSize={18} weight="semiBold" style={spacings.mbMi}>
                {sponsor.name}
              </Text>
              <Text fontSize={16} appearance="secondaryText">
                {t('is 🪄 sponsoring 🪄 this transaction')}
              </Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  if (isGaslessTransaction) {
    return (
      <Alert
        type="success"
        size="md"
        text={t('No fee payment required- this is a gasless (meta) transaction.')}
        style={spacings.mbSm}
      />
    )
  }

  return (
    <>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbMi
        ]}
      >
        <Text fontSize={18} weight="medium">
          {t('Pay fee with')}
        </Text>
        {selectedFee && (
          <Select
            value={selectedFee}
            // @ts-ignore
            setValue={onFeeSelect}
            options={feeSpeedOptions}
            selectStyle={{ height: 32 }}
            menuOptionHeight={32}
            // Display a wider menu if the fee token price is unavailable
            // as the native amount takes up more space
            menuLeftHorizontalOffset={feeTokenPriceUnavailableWarning ? 100 : 48}
            menuStyle={{ minWidth: feeTokenPriceUnavailableWarning ? 200 : 148 }}
            withSearch={false}
            containerStyle={{ ...spacings.mb0, width: 116 }}
            testID="fee-speed-select"
          />
        )}
      </View>
      <SectionedSelect
        setValue={setFeeOption}
        testID="fee-option-select"
        headerHeight={FEE_SECTION_LIST_MENU_HEADER_HEIGHT}
        sections={feeOptionSelectSections}
        renderSectionHeader={renderFeeOptionSectionHeader}
        containerStyle={spacings.mb0}
        value={payValue || NO_FEE_OPTIONS}
        disabled={
          disabled ||
          (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length) ||
          defaultFeeOption.label === NO_FEE_OPTIONS.label
        }
        defaultValue={payValue ?? undefined}
        withSearch={!!payOptionsPaidByUsOrGasTank.length || !!payOptionsPaidByEOA.length}
        stickySectionHeadersEnabled
      />
    </>
  )
}

export default React.memo(Estimation)

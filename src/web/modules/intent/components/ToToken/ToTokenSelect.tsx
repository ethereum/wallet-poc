import { isAddress } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SwapAndBridgeController } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { getIsTokenEligibleForSwapAndBridge } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import CoinsIcon from '@common/assets/svg/CoinsIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import StarFilledIcon from '@common/assets/svg/StarFilledIcon'
import { SectionedSelect } from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'

interface Props {
  toTokenOptions: SelectValue[]
  toTokenValue: SelectValue
  // toTokenAmountSelectDisabled: boolean
  handleChangeToToken: (value: SelectValue) => void
  addToTokenByAddressStatus: SwapAndBridgeController['statuses']['addToTokenByAddress']
  handleAddToTokenByAddress: (searchTerm: string) => void
}

const SECTION_MENU_HEADER_HEIGHT = 50

const getToTokenListErrorOption = ({
  t,
  theme,
  title,
  text,
  id,
  isValue
}: {
  t: (key: string) => string
  theme: ThemeProps
  title: string
  text?: string
  id: string
  isValue: boolean
}) => {
  return {
    value: id,
    label: (
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Text fontSize={14} weight="medium" appearance="errorText" style={spacings.mrMi}>
          {t(isValue ? 'Temporarily unavailable' : title)}
        </Text>
        <InfoIcon
          color={theme.secondaryText}
          width={14}
          height={14}
          data-tooltip-id="to-token-list-error-tooltip"
        />
        <Tooltip id="to-token-list-error-tooltip" content={text} />
      </View>
    ),
    icon: null,
    disabled: true
  }
}

const ToTokenSelect: React.FC<Props> = ({
  toTokenOptions,
  toTokenValue,
  // toTokenAmountSelectDisabled,
  handleChangeToToken,
  addToTokenByAddressStatus,
  handleAddToTokenByAddress
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { errors, isTokenListLoading } = useSwapAndBridgeControllerState()
  const { portfolio } = useSelectedAccountControllerState()
  const [didAttemptSearchingTokenByAddress, setDidAttemptSearchingTokenByAddress] =
    React.useState(false)

  const handleAttemptToFetchMoreOptions = useCallback(
    (searchTerm: string) => {
      // Defer the state update to the next event loop iteration. This prevents the state
      // update from happening during the render phase of the parent which causes the warn:
      // Cannot update a component (ToTokenSelect) while rendering a different component (Select).
      setTimeout(() => setDidAttemptSearchingTokenByAddress(isAddress(searchTerm)), 100)

      return handleAddToTokenByAddress(searchTerm)
    },
    [handleAddToTokenByAddress]
  )

  const isAttemptingToAddToTokenByAddress = addToTokenByAddressStatus !== 'INITIAL'
  const notFoundPlaceholderText = didAttemptSearchingTokenByAddress
    ? t('Not found. Wrong receive network?') // TODO: Add "... or unsupported token" when UI allows longer messages
    : t('Not found. Try with token address?')

  const toTokenListError = useMemo(() => {
    if (isTokenListLoading) return null

    return errors.find(({ id }) => id === 'to-token-list-fetch-failed')
  }, [errors, isTokenListLoading])

  const toTokenValueOrError = useMemo(() => {
    if (toTokenListError && !toTokenOptions.length) {
      return getToTokenListErrorOption({
        ...toTokenListError,
        t,
        theme,
        isValue: true
      })
    }

    return toTokenValue
  }, [t, theme, toTokenListError, toTokenOptions.length, toTokenValue])

  const selectSections = useMemo(() => {
    const { toTokenOptionsInAccount, restToTokenOptions } = toTokenOptions.reduce<{
      toTokenOptionsInAccount: SelectValue[]
      restToTokenOptions: SelectValue[]
    }>(
      (acc, option) => {
        const isInPortfolioAndEligible = portfolio.tokens.some(
          (pt) =>
            pt.address === option.address &&
            pt.chainId.toString() === option.chainId.toString() &&
            getIsTokenEligibleForSwapAndBridge(pt)
        )

        isInPortfolioAndEligible
          ? acc.toTokenOptionsInAccount.push(option)
          : acc.restToTokenOptions.push(option)

        return acc
      },
      { toTokenOptionsInAccount: [], restToTokenOptions: [] }
    )

    if (toTokenListError) {
      restToTokenOptions.unshift(
        getToTokenListErrorOption({
          ...toTokenListError,
          t,
          theme,
          isValue: false
        })
      )
    }

    return [
      {
        title: { icon: <CoinsIcon />, text: t('Tokens in current account') },
        data: toTokenOptionsInAccount,
        key: 'swap-and-bridge-to-account-tokens'
      },
      {
        title: { icon: <StarFilledIcon />, text: t('Tokens') },
        data: restToTokenOptions,
        key: 'swap-and-bridge-to-service-provider-tokens'
      }
    ]
  }, [toTokenOptions, toTokenListError, t, portfolio.tokens, theme])

  const renderFeeOptionSectionHeader = useCallback(
    ({ section }: any) => {
      if (section.data.length === 0 || !section.title) return null

      return (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.ph,
            spacings.pt,
            section?.key === 'swap-and-bridge-to-account-tokens' ? spacings.pbSm : spacings.pbSm,
            { height: SECTION_MENU_HEADER_HEIGHT, backgroundColor: theme.primaryBackground }
          ]}
        >
          {section.title.icon}
          <Text style={spacings.mlMi} fontSize={14} weight="medium" appearance="secondaryText">
            {section.title.text}
          </Text>
        </View>
      )
    },
    [theme]
  )

  return (
    <SectionedSelect
      setValue={handleChangeToToken}
      mode="bottomSheet"
      bottomSheetTitle={t('Receive token')}
      sections={selectSections}
      renderSectionHeader={renderFeeOptionSectionHeader}
      value={toTokenValueOrError}
      headerHeight={SECTION_MENU_HEADER_HEIGHT}
      // disabled={toTokenAmountSelectDisabled || (toTokenValueOrError && !toTokenOptions.length)}
      disabled
      testID="to-token-select"
      searchPlaceholder={t('Token name or address...')}
      // menuLeftHorizontalOffset={285}
      emptyListPlaceholderText={
        isAttemptingToAddToTokenByAddress ? t('Pulling token details...') : notFoundPlaceholderText
      }
      attemptToFetchMoreOptions={handleAttemptToFetchMoreOptions}
      containerStyle={{ ...spacings.mb0, ...flexbox.flex1 }}
      selectStyle={{ backgroundColor: '#54597A14', borderWidth: 0 }}
      stickySectionHeadersEnabled
    />
  )
}

export default React.memo(ToTokenSelect)

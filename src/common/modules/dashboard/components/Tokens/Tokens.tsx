import React, { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FlatListProps, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
// import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import AddTokenBottomSheet from '@web/modules/settings/screens/ManageTokensSettingsScreen/AddTokenBottomSheet'
import { getTokenId } from '@web/utils/token'
import { getUiType } from '@web/utils/uiType'

import { useTestnetPortfolio } from '@common/hooks/useTestnetPortfolio'
import DashboardBanners from '../DashboardBanners'
import DashboardPageScrollContainer from '../DashboardPageScrollContainer'
// import TabsAndSearch from '../TabsAndSearch'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import TokenItem from './TokenItem'
import Skeleton from './TokensSkeleton'

interface Props {
  openTab: TabType
  // setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  // sessionId: string
  initTab?: {
    [key: string]: boolean
  }
  onScroll: FlatListProps<any>['onScroll']
  dashboardNetworkFilterName: string | null
}

const { isPopup } = getUiType()

const Tokens = ({
  openTab,
  // setOpenTab,
  initTab,
  // sessionId,
  onScroll,
  dashboardNetworkFilterName
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { networks } = useNetworksControllerState()
  const { portfolio, dashboardNetworkFilter } = useSelectedAccountControllerState()
  const {
    ref: addTokenBottomSheetRef,
    // open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const { watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })
  const { sortedTokens } = useTestnetPortfolio()
  const searchValue = watch('search')

  const hiddenTokensCount = 0

  // const navigateToAddCustomToken = useCallback(() => {
  //   openAddTokenBottomSheet()
  // }, [openAddTokenBottomSheet])

  const renderItem = useCallback(
    ({ item, index }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            {/* <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              searchControl={control}
              sessionId={sessionId}
            /> */}
            <View style={[flexbox.directionRow, spacings.mbTy, spacings.phTy]}>
              <Text appearance="secondaryText" fontSize={14} weight="medium" style={{ flex: 1.5 }}>
                {t('ASSET/AMOUNT')}
              </Text>
              <Text appearance="secondaryText" fontSize={14} weight="medium" style={{ flex: 0.7 }}>
                {t('PRICE')}
              </Text>
              <Text
                appearance="secondaryText"
                fontSize={14}
                weight="medium"
                style={{ flex: 0.4, textAlign: 'right' }}
              >
                {t('USD VALUE')}
              </Text>
            </View>
          </View>
        )
      }

      if (item === 'empty') {
        return (
          <View style={[flexbox.alignCenter, spacings.pv]}>
            <Text fontSize={16} weight="medium">
              {!searchValue && !dashboardNetworkFilterName && t("You don't have any tokens yet.")}
              {!searchValue &&
                dashboardNetworkFilterName &&
                t(`No tokens found on ${dashboardNetworkFilterName}.`)}
              {searchValue &&
                t(
                  `No tokens match "${searchValue}"${
                    dashboardNetworkFilterName ? ` on ${dashboardNetworkFilterName}` : ''
                  }.`
                )}
            </Text>
          </View>
        )
      }

      if (item === 'skeleton')
        return (
          <View style={spacings.ptTy}>
            {/* Display more skeleton items if there are no tokens */}
            <Skeleton amount={3} withHeader={false} />
          </View>
        )

      if (item === 'footer') {
        return portfolio?.isAllReady &&
          // A trick to render the button once all tokens have been rendered. Otherwise
          // there will be layout shifts
          index === sortedTokens.length + 4 ? (
          <View style={hiddenTokensCount ? spacings.ptTy : spacings.ptSm}>
            {!!hiddenTokensCount && (
              <Pressable
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  spacings.pvMi,
                  spacings.phTy,
                  spacings.mhTy,
                  spacings.mbLg,
                  {
                    borderRadius: 4,
                    backgroundColor: theme.secondaryBackground
                  }
                ]}
                onPress={() => {
                  navigate(WEB_ROUTES.manageTokens)
                }}
              >
                <Text appearance="secondaryText" fontSize={12}>
                  {t('You have {{count}} hidden {{tokensLabel}}', {
                    count: hiddenTokensCount,
                    tokensLabel: hiddenTokensCount > 1 ? t('tokens') : t('token')
                  })}{' '}
                  {!!dashboardNetworkFilter && t('on this network')}
                </Text>
                <RightArrowIcon height={12} color={theme.secondaryText} />
              </Pressable>
            )}
            {/* <Button
              type="secondary"
              text={t('+ Add custom token')}
              onPress={navigateToAddCustomToken}
            /> */}
          </View>
        ) : null
      }

      if (
        !initTab?.tokens ||
        !item ||
        item === 'keep-this-to-avoid-key-warning' ||
        item === 'keep-this-to-avoid-key-warning-2'
      )
        return null

      return (
        <TokenItem
          token={item}
          testID={`token-${item.address}-${item.chainId}${item.flags.onGasTank ? '-gastank' : ''}`}
        />
      )
    },
    [
      initTab?.tokens,
      theme.primaryBackground,
      theme.secondaryBackground,
      theme.secondaryText,
      t,
      searchValue,
      dashboardNetworkFilterName,
      portfolio?.isAllReady,
      sortedTokens.length,
      hiddenTokensCount,
      dashboardNetworkFilter,
      // navigateToAddCustomToken,
      navigate
    ]
  )

  const keyExtractor = useCallback(
    (tokenOrElement: any) => {
      if (typeof tokenOrElement === 'string') {
        return tokenOrElement
      }

      return getTokenId(tokenOrElement, networks)
    },
    [networks]
  )

  useEffect(() => {
    setValue('search', '')
  }, [setValue])

  return (
    <>
      <DashboardPageScrollContainer
        tab="tokens"
        openTab={openTab}
        ListHeaderComponent={<DashboardBanners />}
        data={[
          'header',
          !sortedTokens.length && !portfolio?.isAllReady
            ? 'skeleton'
            : 'keep-this-to-avoid-key-warning',
          ...(initTab?.tokens ? sortedTokens : []),
          sortedTokens.length && !portfolio?.isAllReady
            ? 'skeleton'
            : 'keep-this-to-avoid-key-warning-2',
          !sortedTokens.length && portfolio?.isAllReady ? 'empty' : '',
          'footer'
        ]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={isPopup ? 5 : 2.5}
        initialNumToRender={isPopup ? 10 : 20}
        windowSize={9} // Larger values can cause performance issues.
        onScroll={onScroll}
      />
      <AddTokenBottomSheet
        sheetRef={addTokenBottomSheetRef}
        handleClose={closeAddTokenBottomSheet}
      />
    </>
  )
}

export default React.memo(Tokens)

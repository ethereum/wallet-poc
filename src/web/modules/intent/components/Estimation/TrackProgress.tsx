import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { getIsBridgeRoute } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import OpenIcon from '@common/assets/svg/OpenIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import AlertVertical from '@common/components/AlertVertical'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import formatTime from '@common/utils/formatTime'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import { getUiType } from '@web/utils/uiType'

import RouteStepsToken from '../RouteStepsToken'
import BackgroundShapes from './BackgroundShapes'

const { isActionWindow } = getUiType()

type Props = {
  handleClose: () => void
}

const LIFI_EXPLORER_URL = 'https://scan.li.fi'

const TrackProgress: FC<Props> = ({ handleClose }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { dispatch } = useBackgroundService()
  const { activeRoutes } = useSwapAndBridgeControllerState()
  const lastCompletedRoute = activeRoutes[activeRoutes.length - 1]
  const steps = lastCompletedRoute?.route?.steps
  const firstStep = steps ? steps[0] : null
  const lastStep = steps ? steps[steps.length - 1] : null
  const fromAsset = firstStep ? firstStep.fromAsset : null
  const toAsset = lastStep ? lastStep.toAsset : null
  const toAssetSymbol = steps ? steps[steps.length - 1].toAsset.symbol : null
  const { maxWidthSize } = useWindowSize()
  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])
  const isSwap = lastCompletedRoute.route && !getIsBridgeRoute(lastCompletedRoute.route)

  const onPrimaryButtonPress = useCallback(() => {
    if (isActionWindow) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_CLOSE_SIGNING_ACTION_WINDOW'
      })
    } else {
      navigate(WEB_ROUTES.dashboard)
    }
  }, [dispatch, navigate])

  const handleOpenExplorer = useCallback(async () => {
    try {
      if (!isSwap) {
        const link = `${LIFI_EXPLORER_URL}/tx/${lastCompletedRoute.userTxHash}`
        await openInTab(link, false)
        return
      }
      const toChainId = lastCompletedRoute.route?.toChainId
      if (!toChainId) throw new Error('No toChainId')

      const { identifiedBy } = lastCompletedRoute

      if (!identifiedBy) throw new Error('No identifiedBy')

      const link = `https://benzin.ambire.com/${getBenzinUrlParams({
        chainId: toChainId,
        txnId: lastCompletedRoute.userTxHash,
        identifiedBy
      })}`
      await openInTab(link, false)
    } catch {
      addToast('Error opening explorer', { type: 'error' })
    }
  }, [addToast, isSwap, lastCompletedRoute])

  return (
    <TabLayoutContainer
      backgroundColor={theme.primaryBackground}
      header={
        <Header
          backgroundColor="primaryBackground"
          displayBackButtonIn="never"
          mode="title"
          customTitle={
            <Text fontSize={20} weight="medium">
              {t('Swap & Bridge')}
            </Text>
          }
          withAmbireLogo
        />
      }
      withHorizontalPadding={false}
      footer={null}
      style={{ ...flexbox.alignEnd, ...spacings.pb }}
    >
      <TabLayoutWrapperMainContent
        contentContainerStyle={{
          ...spacings.pv0,
          ...paddingHorizontalStyle,
          ...flexbox.flex1
        }}
        withScroll={false}
      >
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <View
            style={[
              flexbox.alignCenter,
              flexbox.justifyCenter,
              isActionWindow ? {} : flexbox.flex1,
              isActionWindow ? spacings.pt0 : spacings.pt2Xl
            ]}
          >
            {(!lastCompletedRoute || lastCompletedRoute?.routeStatus === 'in-progress') && (
              <>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifyCenter,
                    spacings.mbLg
                  ]}
                >
                  <Text fontSize={20} weight="medium" style={text.center}>
                    {t('Confirming your trade')}
                  </Text>
                  <Spinner
                    style={{
                      width: 20,
                      height: 20,
                      ...spacings.mlSm
                    }}
                  />
                </View>
                {!!fromAsset && !!toAsset && (
                  <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb2Xl]}>
                    <RouteStepsToken
                      uri={fromAsset.icon}
                      chainId={BigInt(fromAsset.chainId)}
                      address={fromAsset.address}
                      symbol={fromAsset.symbol}
                    />
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: theme.secondaryBackground,
                        ...flexbox.alignCenter,
                        ...flexbox.justifyCenter,
                        ...spacings.mhSm
                      }}
                    >
                      <RightArrowIcon />
                    </View>
                    <RouteStepsToken
                      uri={toAsset.icon}
                      chainId={BigInt(toAsset.chainId)}
                      address={toAsset.address}
                      symbol={toAsset.symbol}
                      isLast
                    />
                  </View>
                )}
                {!!lastCompletedRoute.route?.serviceTime && (
                  <Text
                    fontSize={12}
                    weight="medium"
                    appearance="secondaryText"
                    style={text.center}
                  >
                    {t('Time: ~{{time}}', {
                      time: formatTime(lastCompletedRoute.route?.serviceTime)
                    })}
                  </Text>
                )}
              </>
            )}
            {lastCompletedRoute?.routeStatus === 'completed' && (
              <>
                <BackgroundShapes
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1
                  }}
                />
                <CheckIcon2 style={spacings.mb3Xl} />
                <Text fontSize={20} weight="medium" style={spacings.mbTy}>
                  {t('Nice trade!')}
                </Text>
                <Text weight="medium" appearance="secondaryText" style={spacings.mb2Xl}>
                  {t('{{symbol}} delivered - like magic.', {
                    symbol: toAssetSymbol || 'Token'
                  })}
                </Text>
                {!!lastCompletedRoute.route && (
                  <Pressable
                    onPress={handleOpenExplorer}
                    style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter]}
                  >
                    <OpenIcon color={theme.primary} width={16} height={16} style={spacings.mrTy} />
                    <Text
                      weight="medium"
                      style={{
                        textDecorationLine: 'underline',
                        textDecorationColor: theme.primary,
                        textDecorationStyle: 'solid'
                      }}
                      appearance="primary"
                    >
                      {isSwap ? t('View swap') : t('View bridge')}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
            {lastCompletedRoute?.routeStatus === 'failed' && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  spacings.mbLg
                ]}
              >
                <AlertVertical
                  title={t(isSwap ? 'Swap failed' : 'Bridge failed')}
                  text={`Error: ${lastCompletedRoute.error}`}
                />
              </View>
            )}
          </View>
          {!isActionWindow && (
            <View
              style={{
                height: 1,
                backgroundColor: theme.secondaryBorder,
                ...spacings.mvLg
              }}
            />
          )}
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              !isActionWindow ? flexbox.justifySpaceBetween : flexbox.justifyCenter,
              isActionWindow && spacings.pt2Xl
            ]}
          >
            {!isActionWindow ? (
              <Button
                onPress={handleClose}
                hasBottomSpacing={false}
                type="secondary"
                text={t('Start a new swap?')}
              />
            ) : (
              <View />
            )}
            <Button
              onPress={onPrimaryButtonPress}
              hasBottomSpacing={false}
              style={{ width: isActionWindow ? 240 : 160 }}
              text={t('Close')}
            />
          </View>
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default TrackProgress

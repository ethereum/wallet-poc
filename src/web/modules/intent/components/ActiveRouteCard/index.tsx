import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import CloseIcon from '@common/assets/svg/CloseIcon'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'
import useBackgroundService from '@web/hooks/useBackgroundService'
import RouteStepsPreview from '@web/modules/intent/components/RouteStepsPreview'

import getStyles from './styles'

const ActiveRouteCard = ({ activeRoute }: { activeRoute: SwapAndBridgeActiveRoute }) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const activeTransaction = useMemo(() => {
    const isInProgress = activeRoute.routeStatus === 'in-progress'

    // If the transaction is in progress we need to mark the bridge request as active
    if (isInProgress) {
      const bridgeRequest = activeRoute.route?.userTxs.find((tx) => tx.userTxType === 'fund-movr')

      return bridgeRequest || activeRoute.route?.userTxs[activeRoute.route.currentUserTxIndex]
    }

    return activeRoute.route?.userTxs[activeRoute.route.currentUserTxIndex]
  }, [activeRoute.route?.currentUserTxIndex, activeRoute.route?.userTxs, activeRoute.routeStatus])

  const { steps } = activeRoute.route || {}

  const handleRejectActiveRoute = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE',
      params: { activeRouteId: activeRoute.activeRouteId }
    })
  }, [activeRoute.activeRouteId, dispatch])

  const getPanelContainerStyle = useCallback(() => {
    let panelStyles = {}
    if (activeRoute.error)
      panelStyles = {
        borderWidth: 1,
        backgroundColor: theme.errorBackground,
        borderColor: theme.errorDecorative
      }
    if (activeRoute.routeStatus === 'completed')
      panelStyles = {
        borderWidth: 1,
        backgroundColor: '#edf6f1',
        borderColor: theme.successDecorative
      }

    return { ...panelStyles, ...spacings.mbTy }
  }, [activeRoute.error, activeRoute.routeStatus, theme])

  return (
    <Panel spacingsSize="small" style={getPanelContainerStyle()}>
      {activeRoute.routeStatus === 'completed' && (
        <Pressable style={styles.closeIcon} onPress={handleRejectActiveRoute}>
          <CloseIcon />
        </Pressable>
      )}
      <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbMi}>
        {activeRoute.routeStatus === 'completed' ? t('Completed Route') : t('Pending Route')}
      </Text>
      <View
        style={[
          styles.container,
          activeRoute.routeStatus === 'completed' && { backgroundColor: '#767DAD14' }
        ]}
      >
        <RouteStepsPreview
          steps={steps || []}
          currentStep={activeRoute.route?.currentUserTxIndex}
          loadingEnabled={
            !!activeRoute.userTxHash &&
            (activeRoute.routeStatus === 'in-progress' ||
              activeRoute.routeStatus === 'waiting-approval-to-resolve')
          }
        />
      </View>

      {activeRoute.routeStatus !== 'completed' && (
        <View style={[spacings.ptSm, flexbox.directionRow, flexbox.alignCenter]}>
          {!activeRoute.error && (
            <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
              {activeRoute.routeStatus === 'in-progress' &&
                activeTransaction?.userTxType === 'fund-movr' && (
                  <>
                    <Text
                      fontSize={12}
                      weight="medium"
                      style={spacings.mrMi}
                      appearance="secondaryText"
                    >
                      {t('Estimated bridge time:')}
                    </Text>

                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <Text
                        fontSize={12}
                        weight="medium"
                        appearance="primary"
                        style={spacings.mrTy}
                      >
                        {t('around')} {formatTime(activeTransaction?.serviceTime || 0)}
                      </Text>
                      <Spinner style={{ width: 16, height: 16 }} />
                    </View>
                  </>
                )}
              {activeRoute.routeStatus === 'in-progress' &&
                activeTransaction?.userTxType === 'dex-swap' && (
                  <>
                    <Text
                      fontSize={12}
                      weight="medium"
                      style={spacings.mrTy}
                      appearance="secondaryText"
                    >
                      {t('Swap in progress')}
                    </Text>
                    <Spinner style={{ width: 16, height: 16 }} />
                  </>
                )}
              {activeRoute.routeStatus === 'waiting-approval-to-resolve' && (
                <>
                  <Text
                    fontSize={12}
                    weight="medium"
                    style={spacings.mrTy}
                    appearance="secondaryText"
                  >
                    {t('Approval in progress')}
                  </Text>
                  <Spinner style={{ width: 16, height: 16 }} />
                </>
              )}
            </View>
          )}
          {!!activeRoute.error && (
            <Text
              fontSize={12}
              weight="medium"
              style={[spacings.mrTy, flexbox.flex1]}
              appearance="errorText"
            >
              {activeRoute.error}
            </Text>
          )}
        </View>
      )}
    </Panel>
  )
}

export default React.memo(ActiveRouteCard)

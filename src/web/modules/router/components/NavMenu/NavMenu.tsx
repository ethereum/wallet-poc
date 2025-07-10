import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, Pressable, ScrollView, View } from 'react-native'

import DiscordIcon from '@common/assets/svg/DiscordIcon'
import LockFilledIcon from '@common/assets/svg/LockFilledIcon'
import MaximizeIcon from '@common/assets/svg/MaximizeIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import getHeaderStyles from '@common/modules/header/components/Header/styles'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@web/constants/social'
import { getAutoLockLabel } from '@web/extension-services/background/controllers/auto-lock'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useAutoLockStateController from '@web/hooks/useAutoLockStateController'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover from '@web/hooks/useHover'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import SettingsLink from '@web/modules/settings/components/SettingsLink'
import { SETTINGS_LINKS } from '@web/modules/settings/components/Sidebar/Sidebar'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

export const SOCIAL = [
  { Icon: TwitterIcon, url: TWITTER_URL, label: 'Twitter' },
  { Icon: TelegramIcon, url: TELEGRAM_URL, label: 'Telegram' },
  { Icon: DiscordIcon, url: DISCORD_URL, label: 'Discord' }
]

const { isTab, isPopup } = getUiType()
const expandViewTooltipId = 'expand-view-tooltip'

const NavMenu = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { styles, theme } = useTheme(getStyles)
  const { styles: headerStyles } = useTheme(getHeaderStyles)
  const { hasPasswordSecret } = useKeystoreControllerState()
  const { dispatch } = useBackgroundService()
  const autoLockState = useAutoLockStateController()
  const handleLockAmbire = () => {
    dispatch({
      type: 'MAIN_CONTROLLER_LOCK'
    })
  }

  useEffect(() => {
    if (isTab) {
      navigate('accounts')
    }
  }, [navigate])

  const [bindMaximizeAnim, maximizeAnimStyle] = useHover({ preset: 'opacity' })

  return (
    <TabLayoutContainer
      hideFooterInPopup
      width="full"
      footer={<BackButton />}
      footerStyle={{ maxWidth: tabLayoutWidths.xl }}
      header={
        <Header mode="custom">
          <View style={[headerStyles.widthContainer, { maxWidth: tabLayoutWidths.xl }]}>
            <View style={[headerStyles.sideContainer, { width: 180 }]}>
              <HeaderBackButton />
            </View>
            <View style={headerStyles.containerInner}>
              <Text
                weight="medium"
                fontSize={isTab ? 24 : 20}
                style={headerStyles.title}
                numberOfLines={2}
              >
                {t('Menu')}
              </Text>
            </View>
            <View style={[headerStyles.sideContainer, { width: 180, alignItems: 'flex-end' }]}>
              {hasPasswordSecret && (
                <View style={[flexbox.justifyCenter, flexbox.alignCenter]}>
                  <Button
                    text="Lock Wallet"
                    type="secondary"
                    size="small"
                    childrenPosition="left"
                    style={{ height: 32, ...spacings.phTy, ...spacings.mbMi, maxWidth: 130 }}
                    onPress={handleLockAmbire}
                  >
                    <LockFilledIcon style={spacings.mrTy} color={theme.primary} height={20} />
                  </Button>
                  <Text appearance="tertiaryText" fontSize={12} style={text.center}>
                    {t('Auto lock time:')}{' '}
                    <Text appearance="tertiaryText" fontSize={12} weight="medium">
                      {getAutoLockLabel(autoLockState.autoLockTime)}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Header>
      }
      style={spacings.ph0}
      withHorizontalPadding={false}
    >
      <View style={[flexbox.flex1]}>
        <View style={[commonWebStyles.contentContainer, flexbox.flex1, spacings.pt]}>
          <View style={[spacings.ph, flexbox.flex1]}>
            <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
              <Text
                fontSize={20}
                weight="medium"
                style={[SETTINGS_LINKS.length > 8 ? spacings.mbSm : spacings.mb, spacings.pl]}
              >
                {t('Settings')}
              </Text>
              <View>
                {isPopup && (
                  <>
                    <Pressable
                      onPress={() => openInTab(`tab.html#/${WEB_ROUTES.dashboard}`)}
                      {...bindMaximizeAnim}
                    >
                      <Animated.View style={maximizeAnimStyle}>
                        <MaximizeIcon
                          color={theme.primaryText}
                          // @ts-ignore missing type, but the prop is valid
                          dataSet={{ tooltipId: expandViewTooltipId }}
                          style={styles.maximizeButton}
                          width={16}
                          height={16}
                        />
                      </Animated.View>
                    </Pressable>
                    <Tooltip content={t('Expand view')} id={expandViewTooltipId} />
                  </>
                )}
              </View>
            </View>
            <ScrollView style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={[flexbox.directionRow, flexbox.wrap, flexbox.alignStart]}>
                {SETTINGS_LINKS.map((link, i) => (
                  <SettingsLink
                    {...link}
                    key={link.key}
                    isActive={false}
                    initialBackground={theme.primaryBackground}
                    style={{
                      width: '50%',
                      ...(i !== SETTINGS_LINKS.length - 1 && i !== SETTINGS_LINKS.length - 2
                        ? spacings.mbTy
                        : spacings.mb0)
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NavMenu)

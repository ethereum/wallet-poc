import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BasicToSmart from '@common/assets/svg/BasicToSmart'
import BundleTxns from '@common/assets/svg/BundleTxns'
import PayGas from '@common/assets/svg/PayGas'
import PreviewOutcome from '@common/assets/svg/PreviewOutcome'
import Alert from '@common/components/Alert'
import Checkbox from '@common/components/Checkbox'
import Panel from '@common/components/Panel'
import { getPanelPaddings } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import useWindowSize from '@common/hooks/useWindowSize'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import Card from '@web/modules/auth/components/Card'

interface Props {
  onDoNotAskMeAgainChange?: () => void
  doNotAskMeAgain?: boolean
  displayFullInformation?: boolean
  children?: React.ReactNode
}

const Authorization7702 = ({
  onDoNotAskMeAgainChange,
  doNotAskMeAgain,
  displayFullInformation,
  children
}: Props) => {
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()

  const options = [
    {
      id: 1,
      text: 'Pay gas fees in ERC-20 tokens, stablecoins, and native tokens.',
      image: PayGas
    },
    {
      id: 2,
      text: 'Bundle multiple actions, i.e., transaction approvals and the transactions themselves.',
      image: BundleTxns
    },
    {
      id: 3,
      text: 'Preview the outcome of your transactions, including the future account balance, before signing.',
      image: PreviewOutcome,
      styles: [spacings.mr0]
    }
  ]

  return (
    <TabLayoutWrapperMainContent style={spacings.mbLg} contentContainerStyle={spacings.pvXl}>
      {displayFullInformation && (
        <>
          <View style={[flexbox.directionRow, flexbox.center]}>
            <Text weight="medium" fontSize={16}>
              {t('Make your account smarter')}
            </Text>
          </View>
          <View style={[flexbox.directionRow, flexbox.center]}>
            <BasicToSmart style={[spacings.mt, spacings.mb]} />
          </View>
        </>
      )}
      <View style={[flexbox.directionRow, flexbox.center]}>
        <Text weight="light" fontSize={14} style={[{ maxWidth: 650, textAlign: 'center' }]}>
          {t(
            "You can do more with your Basic Account (EOA)! Thanks to the recent upgrade to Ethereum's protocol, your account gains "
          )}
          <Text weight="medium" fontSize={14}>
            {t('additional smart features:')}
          </Text>
        </Text>
      </View>
      <Panel style={[{ borderWidth: 0 }, spacings.pt, spacings.pb]}>
        <View style={[flexbox.directionRow]}>
          {options.map((option, index) => (
            <Card
              style={[
                options.length === index + 1 ? spacings.mr0 : spacings.mrLg,
                flexbox.flex1,
                flexbox.center,
                spacings.plXl,
                spacings.prXl,
                spacings.ptSm,
                spacings.pbSm,
                { minHeight: 'auto' },
                // @ts-ignore
                { textAlign: 'center' },
                // @ts-ignore
                { cursor: 'default' },
                // @ts-ignore
                { hover: 'b' }
              ]}
              key={option.id}
              text={option.text}
              textStyle={[{ color: colors.black, fontSize: 12 }]}
              titleStyle={[spacings.mb]}
              icon={option.image}
              iconWrapperStyles={[{ height: 66 }]}
              isDisabled
            />
          ))}
        </View>
      </Panel>
      <View style={[spacings.pt0, spacings.pb0, getPanelPaddings(maxWidthSize, 'large')]}>
        <View>
          <Text weight="light" fontSize={14} style={spacings.mb}>
            Once enabled in Ambire Wallet,{' '}
            <Text weight="medium" fontSize={14}>
              these features won’t change your account
            </Text>
            . You keep the{' '}
            <Text weight="medium" fontSize={14}>
              same address across all networks
            </Text>
            , and your{' '}
            <Text weight="medium" fontSize={14}>
              portfolio and DeFi positions (if any) won’t be affected.
            </Text>
          </Text>
        </View>
        {displayFullInformation && onDoNotAskMeAgainChange && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, { minHeight: '47px' }]}>
            <Checkbox
              value={!!doNotAskMeAgain}
              style={spacings.mb0}
              onValueChange={onDoNotAskMeAgainChange}
            >
              <Text fontSize={14}>{t('Do not ask me again')}</Text>
            </Checkbox>
            {doNotAskMeAgain && (
              <Alert type="info" style={spacings.ml} size="sm">
                <Text fontSize={14}>You can always change this from account settings</Text>
              </Alert>
            )}
          </View>
        )}
      </View>
      {children}
    </TabLayoutWrapperMainContent>
  )
}

export default React.memo(Authorization7702)

import React, { useCallback } from 'react'
import { View } from 'react-native'

import { TransferController } from '@temp/transfer'
import { TokenResult } from '@ambire-common/libs/portfolio'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useTransferControllerState from '@web/hooks/useTransferControllerState'

type Props = {
  onAddToAddressBook: () => any
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  isRecipientAddressUnknownAgreed: TransferController['isRecipientAddressUnknownAgreed']
  onRecipientAddressUnknownCheckboxClick: () => void
  addressValidationMsg: string
  isSWWarningVisible: boolean
  isSWWarningAgreed: boolean
  isRecipientAddressSameAsSender: boolean
  selectedTokenSymbol?: TokenResult['symbol']
}

const ConfirmAddress = ({
  onAddToAddressBook,
  onRecipientAddressUnknownCheckboxClick,
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  isRecipientAddressUnknownAgreed,
  addressValidationMsg,
  isSWWarningVisible,
  isSWWarningAgreed,
  isRecipientAddressSameAsSender,
  selectedTokenSymbol
}: Props) => {
  const { t } = useTranslation()
  const { transferCtrl } = useTransferControllerState()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })

  const onSWWarningCheckboxClick = useCallback(() => {
    transferCtrl.update({
      isSWWarningAgreed: true
    })
  }, [transferCtrl])

  return !isRecipientHumanizerKnownTokenOrSmartContract &&
    !!isRecipientAddressUnknown &&
    !isRecipientAddressSameAsSender &&
    addressValidationMsg !== 'Invalid address.' ? (
    <>
      <View style={spacings.mbMd}>
        <Checkbox
          value={isRecipientAddressUnknownAgreed}
          onValueChange={onRecipientAddressUnknownCheckboxClick}
          label={t('Confirm sending to a previously unknown address')}
          style={isSWWarningVisible ? spacings.mbSm : spacings.mb0}
          testID="recipient-address-unknown-checkbox"
        />

        {isSWWarningVisible ? (
          <Checkbox
            value={isSWWarningAgreed}
            style={spacings.mb0}
            onValueChange={onSWWarningCheckboxClick}
          >
            <Text fontSize={12} onPress={onSWWarningCheckboxClick} testID="sw-warning-checkbox">
              {
                t(
                  'I confirm this address is not Binance, Coinbase or another centralized exchange. These platforms do not support {{token}} deposits from smart wallets.',
                  {
                    token: selectedTokenSymbol
                  }
                ) as string
              }
            </Text>
          </Checkbox>
        ) : null}
      </View>
      <AnimatedPressable style={animStyle} onPress={onAddToAddressBook} {...bindAnim}>
        <Text
          style={{
            textDecorationLine: 'underline',
            ...spacings.mbMd
          }}
          fontSize={14}
          appearance="primary"
        >
          {t('+ Add to Address Book')}
        </Text>
      </AnimatedPressable>
    </>
  ) : null
}

export default ConfirmAddress

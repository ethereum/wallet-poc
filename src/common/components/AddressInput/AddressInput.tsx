import * as Clipboard from 'expo-clipboard'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { Network } from '@ambire-common/interfaces/network'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
// import EnsIcon from '@common/assets/svg/EnsIcon'
import ScanIcon from '@common/assets/svg/ScanIcon'
import Input, { InputProps } from '@common/components/Input'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import BottomSheet from '../BottomSheet'
import QRCodeScanner from '../QRCodeScanner'
import getStyles from './styles'
import NetworkIcon from '../NetworkIcon'

export interface AddressValidation {
  isError: boolean
  message: string
}

interface Props extends InputProps {
  ensAddress: string
  isRecipientDomainResolving: boolean
  validation: AddressValidation
  selectedNetwork?: Network | null
  label?: string
}

const AddressInput: React.FC<Props> = ({
  onChangeText,
  ensAddress,
  isRecipientDomainResolving,
  label,
  validation,
  containerStyle = {},
  placeholder,
  childrenBeforeButtons,
  selectedNetwork,
  ...rest
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles } = useTheme(getStyles)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const { message, isError } = validation
  const isValidationInDomainResolvingState = message === 'Resolving domain...'

  const handleOnScan = useCallback(
    (code: string) => {
      if (onChangeText) onChangeText(code)

      closeBottomSheet()
    },
    [onChangeText, closeBottomSheet]
  )

  const handleOnButtonPress = useCallback(() => {
    Keyboard.dismiss()
    openBottomSheet()
  }, [openBottomSheet])

  const handleCopyResolvedAddress = useCallback(async () => {
    const address = ensAddress

    if (address) {
      try {
        await Clipboard.setStringAsync(address)
        addToast(t('Copied to clipboard!'), { timeout: 2500 })
      } catch {
        addToast(t('Failed to copy address to clipboard'), { type: 'error' })
      }
    }
  }, [addToast, ensAddress, t])

  return (
    <>
      {label && (
        <Text fontSize={14} appearance="secondaryText" weight="regular" style={styles.label}>
          {label}
        </Text>
      )}
      <Input
        onChangeText={onChangeText}
        // Purposefully spread props here, so that we don't override AddressInput's props
        testID="address-ens-field"
        {...rest}
        containerStyle={containerStyle}
        validLabel={!isError && !isValidationInDomainResolvingState ? message : ''}
        error={isError ? message : ''}
        isValid={!isError && !isValidationInDomainResolvingState}
        placeholder={placeholder || t('Address / ENS / Interop address')}
        bottomLabelStyle={styles.bottomLabel}
        info={isValidationInDomainResolvingState ? t('Resolving domain...') : ''}
        childrenBeforeButtons={
          <>
            {ensAddress && !isRecipientDomainResolving ? (
              <AnimatedPressable
                style={[flexbox.alignCenter, flexbox.directionRow, animStyle]}
                onPress={handleCopyResolvedAddress}
                {...bindAnim}
              >
                <Text style={flexbox.flex1} numberOfLines={1}>
                  <Text
                    style={{
                      flex: 1
                    }}
                    fontSize={12}
                    appearance="secondaryText"
                    numberOfLines={1}
                    ellipsizeMode="head"
                  >
                    ({shortenAddress(ensAddress, 18)})
                  </Text>
                </Text>
                <CopyIcon
                  width={16}
                  height={16}
                  style={[
                    spacings.mlMi,
                    {
                      minWidth: 16
                    }
                  ]}
                />
              </AnimatedPressable>
            ) : null}
            {/* Icons removed */}
            {/* <View style={[styles.domainIcons, rest.button ? spacings.pr0 : spacings.pr]}> */}
            {/*   {childrenBeforeButtons} */}
            {/*   <View style={styles.plTy}> */}
            {/*     <EnsIcon isActive={!!ensAddress} /> */}
            {/*   </View> */}
            {/* </View> */}

            {selectedNetwork && (
              <View style={styles.chainLogo}>
                <NetworkIcon
                  style={styles.icon}
                  id={selectedNetwork.chainId.toString()}
                  benzinNetwork={selectedNetwork}
                />
              </View>
            )}
            {!isWeb && (
              <TouchableOpacity style={spacings.prTy} onPress={handleOnButtonPress}>
                <ScanIcon isFilled={false} />
              </TouchableOpacity>
            )}
          </>
        }
      />

      {!isWeb && (
        <BottomSheet id="add-token" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
          <Title style={textStyles.center}>{t('Scan recipient QR code')}</Title>
          <QRCodeScanner onScan={handleOnScan} />
        </BottomSheet>
      )}
    </>
  )
}

export default React.memo(AddressInput)

import * as Clipboard from 'expo-clipboard'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import Alert from '@common/components/Alert'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader/ModalHeader'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import { SelectValue } from '@common/components/Select/types'
import { getIsNetworkSupported } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import NotSupportedNetworkTooltip from '@web/modules/swap-and-bridge/components/NotSupportedNetworkTooltip'
import Select from '@common/components/Select'
import { InteropAddressProvider } from '@interop-sdk/addresses'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import SkeletonLoader from '@common/components/SkeletonLoader'
import getStyles from './styles'

interface Props {
  modalRef: any
  handleClose: () => void
}

const { isPopup } = getUiType()

const ReceiveModal: FC<Props> = ({ modalRef, handleClose }) => {
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { keys } = useKeystoreControllerState()
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const qrCodeRef: any = useRef(null)
  const { addToast } = useToast()
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)
  const isViewOnly = getIsViewOnly(keys, account?.associatedKeys || [])
  const { supportedChainIds } = useSwapAndBridgeControllerState()
  const [selectedChain, setSelectedChain] = useState<{
    chainNamespace: 'eip155'
    chainId: number
  }>({ chainNamespace: 'eip155', chainId: 1 })
  const [isInteropAddressAgreed] = useState(true)
  const [humanReadableAddress, setHumanReadableAddress] = useState('')

  const payloadAddress = useMemo(() => {
    const fromNumberToHex = (number: number) => `0x${number.toString(16)}`
    const interopAddress = InteropAddressProvider.buildFromPayload({
      version: 1,
      chainType: 'eip155',
      chainReference: fromNumberToHex(selectedChain.chainId),
      address: account?.addr || ''
    })

    return interopAddress
  }, [account?.addr, selectedChain.chainId])

  useEffect(() => {
    async function updateHumanReadableAddress() {
      if (payloadAddress) {
        const address = await InteropAddressProvider.binaryToHumanReadable(payloadAddress)
        setHumanReadableAddress(address)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateHumanReadableAddress()
  }, [payloadAddress])

  const fromNetworkOptions: SelectValue[] = useMemo(() => {
    const availableOptions: SelectValue[] = networks.map((n) => {
      const tooltipId = `network-${n.chainId}-not-supported-tooltip`
      const isNetworkSupported = getIsNetworkSupported(supportedChainIds, n)

      return {
        value: String(n.chainId),
        extraSearchProps: [n.name],
        disabled: !isNetworkSupported,
        label: (
          <>
            <Text weight="medium" dataSet={{ tooltipId }} style={flexbox.flex1} numberOfLines={1}>
              {n.name}
            </Text>
            {!isNetworkSupported && (
              <NotSupportedNetworkTooltip tooltipId={tooltipId} network={n} />
            )}
          </>
        ),
        icon: (
          <NetworkIcon
            key={n.chainId.toString()}
            id={n.chainId.toString()}
            style={{ backgroundColor: theme.primaryBackground }}
            size={28}
          />
        )
      }
    })

    return availableOptions
  }, [networks, supportedChainIds, theme.primaryBackground])

  const handleCopyAddress = () => {
    if (!humanReadableAddress) return
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Clipboard.setStringAsync(humanReadableAddress)
    addToast(t('Address copied to clipboard!') as string, { timeout: 2500 })
  }

  const handleSetToNetworkValue = useCallback((networkOption: SelectValue) => {
    setSelectedChain({
      chainNamespace: 'eip155',
      chainId: Number(networkOption.value)
    })
  }, [])

  const getFromNetworkSelectValue = useMemo(() => {
    const network = networks.find((n) => Number(n.chainId) === Number(selectedChain.chainId))
    if (!network) return fromNetworkOptions[0]
    return fromNetworkOptions.filter((opt) => opt.value === String(network.chainId))[0]
  }, [networks, selectedChain, fromNetworkOptions])

  return (
    <BottomSheet
      id="receive-assets-modal"
      type="modal"
      sheetRef={modalRef}
      backgroundColor="primaryBackground"
      containerInnerWrapperStyles={flexbox.alignCenter}
      closeBottomSheet={handleClose}
    >
      <ModalHeader handleClose={handleClose} withBackButton={isPopup} title="Receive Assets" />
      <View style={styles.content}>
        {/* Network */}
        <View style={{ ...styles.supportedNetworksContainer, ...spacings.mb }}>
          <Text weight="regular" fontSize={14} style={styles.supportedNetworksTitle}>
            {t('Showing Interoperable Address for:')}
          </Text>

          <Select
            setValue={handleSetToNetworkValue}
            containerStyle={{ ...spacings.mb0, width: '100%' }}
            options={fromNetworkOptions}
            size="sm"
            value={getFromNetworkSelectValue}
            selectStyle={{
              backgroundColor: '#54597A14',
              borderWidth: 0,
              width: '100%',
              ...spacings.pr,
              ...spacings.plTy
            }}
            disabled={!isInteropAddressAgreed}
          />
        </View>

        {/* Temporarily hidden */}
        {/* <View style={{ ...styles.supportedNetworksContainer }}>
          <UseInteropAddress
            isInteropAddressAgreed={isInteropAddressAgreed}
            onInteropAddressCheckboxClick={handleInteropAddressCheckboxClick}
          />
        </View> */}

        {/* QR Code */}
        <View style={styles.qrCodeContainer}>
          {!!account && !qrCodeError && (
            <View style={styles.qrCode}>
              <QRCode
                value={payloadAddress}
                size={160}
                quietZone={10}
                getRef={qrCodeRef}
                onError={() => setQrCodeError(t('Failed to load QR code!') as string)}
              />
            </View>
          )}
          {!!qrCodeError && (
            <Text appearance="errorText" weight="medium">
              {t('Failed to display QR code.')}
            </Text>
          )}
        </View>

        {/* Address */}
        <View style={isPopup ? spacings.mb : spacings.mbXl}>
          <AnimatedPressable
            style={[styles.accountAddress, isViewOnly ? spacings.mbSm : spacings.mb0, animStyle]}
            onPress={handleCopyAddress}
            {...bindAnim}
          >
            {!humanReadableAddress && <SkeletonLoader width="100%" height={12} />}
            {humanReadableAddress && (
              <Text
                selectable
                numberOfLines={1}
                fontSize={12}
                ellipsizeMode="middle"
                weight="medium"
              >
                {humanReadableAddress}
              </Text>
            )}
          </AnimatedPressable>
          {isViewOnly ? (
            <Alert
              style={{
                maxWidth: 400,
                marginHorizontal: 'auto'
              }}
              type="warning"
              title={t('Selected account is view only.')}
            />
          ) : null}
        </View>
      </View>

      <AmbireLogoHorizontal />
    </BottomSheet>
  )
}

export default React.memo(ReceiveModal)

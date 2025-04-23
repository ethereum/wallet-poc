import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { TokenResult } from '@ambire-common/libs/portfolio'
import AccountsFilledIcon from '@common/assets/svg/AccountsFilledIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import AddressInput from '@common/components/AddressInput'
import { AddressValidation } from '@common/components/AddressInput/AddressInput'
import { InputProps } from '@common/components/Input'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { findAccountDomainFromPartialDomain } from '@common/utils/domains'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { Network } from '@ambire-common/interfaces/network'

import AddressBookContact from '../AddressBookContact'
import { SectionedSelect } from '../Select'
import { RenderSelectedOptionParams, SectionedSelectProps, SelectValue } from '../Select/types'
import TitleAndIcon from '../TitleAndIcon'
import AddContactBottomSheet from './AddContactBottomSheet'
import ConfirmAddress from './ConfirmAddress'
import styles from './styles'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  ensAddress: string
  addressValidationMsg: string
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  isRecipientAddressUnknown: boolean
  isRecipientAddressUnknownAgreed: TransferController['isRecipientAddressUnknownAgreed']
  onRecipientAddressUnknownCheckboxClick: () => void
  validation: AddressValidation
  isRecipientDomainResolving: boolean
  isSWWarningVisible: boolean
  isSWWarningAgreed: boolean
  selectedTokenSymbol?: TokenResult['symbol']
  selectedNetwork?: Network | null
}

const ADDRESS_BOOK_VISIBLE_VALIDATION = {
  isError: true, // Don't let the user submit, just in case there is an error
  message: ''
}

const SelectedMenuOption: React.FC<{
  selectRef: React.RefObject<any>
  validation: AddressValidation
  isMenuOpen: boolean
  ensAddress: string
  isRecipientDomainResolving: boolean
  address: string
  setAddress: (text: string) => void
  disabled?: boolean
  toggleMenu: () => void
  isAddressInAddressBook: boolean
  filteredContacts: Contact[]
  selectedNetwork?: Network | null
}> = ({
  selectRef,
  filteredContacts,
  validation,
  isMenuOpen,
  ensAddress,
  isRecipientDomainResolving,
  address,
  setAddress,
  disabled,
  toggleMenu,
  isAddressInAddressBook,
  selectedNetwork
}) => {
  const { theme } = useTheme()
  const menuClosedAutomatically = useRef(false)

  useEffect(() => {
    if (isMenuOpen && !filteredContacts.length) {
      toggleMenu()
      menuClosedAutomatically.current = true
    } else if (
      menuClosedAutomatically.current &&
      !isMenuOpen &&
      filteredContacts.length &&
      // Reopen the menu only if the address is invalid
      // Otherwise we will reopen it while the user is done with this field
      // and wants to proceed
      validation.isError
    ) {
      toggleMenu()
      menuClosedAutomatically.current = false
    }
  }, [filteredContacts.length, isMenuOpen, toggleMenu, validation.isError])

  return (
    <AddressInput
      inputBorderWrapperRef={selectRef}
      validation={isMenuOpen ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
      containerStyle={styles.inputContainer}
      ensAddress={ensAddress}
      isRecipientDomainResolving={isRecipientDomainResolving}
      label="Add Recipient"
      value={address}
      onChangeText={setAddress}
      disabled={disabled}
      onFocus={toggleMenu}
      childrenBeforeButtons={
        <AccountsFilledIcon
          color={theme[isAddressInAddressBook ? 'primary' : 'secondaryText']}
          opacity={isAddressInAddressBook ? 1 : 0.25}
          style={spacings.mrTy}
          width={24}
          height={24}
        />
      }
      button={isMenuOpen ? <UpArrowIcon /> : <DownArrowIcon />}
      buttonProps={{
        onPress: toggleMenu
      }}
      buttonStyle={{ ...spacings.pv0, ...spacings.ph, ...spacings.mr0, ...spacings.ml0 }}
      selectedNetwork={selectedNetwork}
    />
  )
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  ensAddress,
  addressValidationMsg,
  isRecipientAddressUnknownAgreed,
  onRecipientAddressUnknownCheckboxClick,
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  validation,
  isRecipientDomainResolving,
  disabled,
  isSWWarningVisible,
  isSWWarningAgreed,
  selectedTokenSymbol,
  selectedNetwork
}) => {
  const { account } = useSelectedAccountControllerState()
  const actualAddress = ensAddress || address
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { contacts } = useAddressBookControllerState()
  const { domains } = useDomainsControllerState()
  const [bindManageBtnAnim, manageBtnAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const onManagePress = useCallback(() => {
    navigate(ROUTES.addressBook)
  }, [navigate])

  const isAddressInAddressBook = contacts.some((contact) => {
    return actualAddress.toLowerCase() === contact.address.toLowerCase()
  })

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        if (!actualAddress) return true

        const lowercaseActualAddress = actualAddress.toLowerCase()
        const lowercaseName = contact.name.toLowerCase()
        const lowercaseAddress = contact.address.toLowerCase()
        const doesDomainMatch = findAccountDomainFromPartialDomain(
          contact.address,
          actualAddress,
          domains
        )

        return (
          lowercaseAddress.includes(lowercaseActualAddress) ||
          lowercaseName.includes(lowercaseActualAddress) ||
          doesDomainMatch
        )
      }),
    [contacts, actualAddress, domains]
  )

  const setAddressWrapped = useCallback(
    ({ value: newAddress }: Pick<SelectValue, 'value'>) => {
      if (typeof newAddress !== 'string') return

      const correspondingDomain = domains[newAddress]?.ens

      setAddress(correspondingDomain || newAddress)
    },
    [domains, setAddress]
  )

  const walletAccountsSourcedContactOptions = useMemo(
    () =>
      filteredContacts
        .filter((contact) => contact.isWalletAccount)
        .map((contact, index) => ({
          value: contact.address,
          label: (
            <AddressBookContact
              testID={`address-book-my-wallet-contact-${index + 1}`}
              key={contact.address}
              style={{
                borderRadius: 0,
                ...spacings.ph0,
                ...spacings.pv0
              }}
              address={contact.address}
              name={contact.name}
            />
          )
        })),
    [filteredContacts]
  )

  const manuallyAddedContactOptions = useMemo(
    () =>
      filteredContacts
        .filter((contact) => !contact.isWalletAccount)
        .map((contact) => ({
          value: contact.address,
          label: (
            <AddressBookContact
              key={contact.address}
              style={{
                borderRadius: 0,
                ...spacings.ph0,
                ...spacings.pv0
              }}
              address={contact.address}
              name={contact.name}
            />
          )
        })),
    [filteredContacts]
  )

  const selectedOption = useMemo(
    () =>
      walletAccountsSourcedContactOptions.find((contact) => contact.value === address) ||
      manuallyAddedContactOptions.find((contact) => contact.value === address),
    [walletAccountsSourcedContactOptions, manuallyAddedContactOptions, address]
  )

  const sections = useMemo(() => {
    if (!walletAccountsSourcedContactOptions.length && !manuallyAddedContactOptions.length)
      return []

    return [
      {
        data: walletAccountsSourcedContactOptions,
        key: 'my-wallets'
      },
      {
        data: manuallyAddedContactOptions,
        key: 'contacts'
      }
    ]
  }, [walletAccountsSourcedContactOptions, manuallyAddedContactOptions])

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionedSelectProps['sections'][0] }) => {
      if (section.data.length === 0) return null

      return section.key === 'contacts' ? (
        <TitleAndIcon title={t('Contacts')} icon={AccountsFilledIcon}>
          <AnimatedPressable
            style={[flexbox.directionRow, flexbox.alignCenter, manageBtnAnimStyle]}
            onPress={onManagePress}
            {...bindManageBtnAnim}
          >
            <SettingsIcon width={18} height={18} color={theme.secondaryText} />
            <Text fontSize={14} style={spacings.mlMi} appearance="secondaryText">
              {t('Manage Contacts')}
            </Text>
          </AnimatedPressable>
        </TitleAndIcon>
      ) : (
        <TitleAndIcon title={t('My Wallets')} icon={WalletFilledIcon} />
      )
    },
    [bindManageBtnAnim, manageBtnAnimStyle, onManagePress, t, theme.secondaryText]
  )

  const renderSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      return (
        <SelectedMenuOption
          selectedNetwork={selectedNetwork}
          toggleMenu={toggleMenu}
          selectRef={selectRef}
          filteredContacts={filteredContacts}
          isMenuOpen={isMenuOpen}
          validation={isMenuOpen ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
          ensAddress={ensAddress}
          isRecipientDomainResolving={isRecipientDomainResolving}
          address={address}
          setAddress={setAddress}
          disabled={disabled}
          isAddressInAddressBook={isAddressInAddressBook}
        />
      )
    },
    [
      selectedNetwork,
      filteredContacts,
      validation,
      ensAddress,
      isRecipientDomainResolving,
      address,
      setAddress,
      disabled,
      isAddressInAddressBook
    ]
  )

  return (
    <>
      <SectionedSelect
        value={selectedOption}
        setValue={setAddressWrapped}
        sections={sections}
        headerHeight={32}
        menuOptionHeight={54}
        withSearch={false}
        renderSectionHeader={renderSectionHeader}
        renderSelectedOption={renderSelectedOption}
        emptyListPlaceholderText={t('No contacts found')}
      />
      <View style={styles.inputBottom}>
        <Text
          style={styles.doubleCheckMessage}
          weight="regular"
          fontSize={12}
          appearance="secondaryText"
        >
          {t(
            'Please double-check the recipient address, blockchain transactions are not reversible.'
          )}
        </Text>

        <ConfirmAddress
          onRecipientAddressUnknownCheckboxClick={onRecipientAddressUnknownCheckboxClick}
          isRecipientHumanizerKnownTokenOrSmartContract={
            isRecipientHumanizerKnownTokenOrSmartContract
          }
          isRecipientAddressUnknown={isRecipientAddressUnknown}
          isRecipientAddressUnknownAgreed={isRecipientAddressUnknownAgreed}
          isRecipientAddressSameAsSender={actualAddress === account?.addr}
          addressValidationMsg={addressValidationMsg}
          onAddToAddressBook={openBottomSheet}
          isSWWarningVisible={isSWWarningVisible}
          isSWWarningAgreed={isSWWarningAgreed}
          selectedTokenSymbol={selectedTokenSymbol}
        />
      </View>
      <AddContactBottomSheet
        sheetRef={sheetRef}
        address={ensAddress || address}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(Recipient)

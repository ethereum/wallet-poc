import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { InputProps } from '@common/components/Input'
import spacings from '@common/styles/spacings'
import { findAccountDomainFromPartialDomain } from '@common/utils/domains'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'

import AddressBookContact from '@common/components/AddressBookContact'
import { SectionedSelect } from '@common/components/Select'
import { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'
import { AddressValidation } from './AddressInput/AddressInput'
import AddressInput from './AddressInput'
import styles from './styles'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  ensAddress: string
  validation: AddressValidation
  isRecipientDomainResolving: boolean
  menuPosition?: 'top' | 'bottom'
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
}> = ({
  selectRef,
  validation,
  isMenuOpen,
  ensAddress,
  isRecipientDomainResolving,
  address,
  setAddress,
  disabled,
  toggleMenu
}) => {
  return (
    <AddressInput
      inputBorderWrapperRef={selectRef}
      validation={isMenuOpen ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
      containerStyle={styles.inputContainer}
      ensAddress={ensAddress}
      isRecipientDomainResolving={isRecipientDomainResolving}
      label="Recipient"
      value={address}
      onChangeText={setAddress}
      disabled={disabled}
      onFocus={toggleMenu}
      buttonProps={{
        onPress: toggleMenu
      }}
      buttonStyle={{ ...spacings.pv0, ...spacings.ph, ...spacings.mr0, ...spacings.ml0 }}
    />
  )
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  ensAddress,
  validation,
  isRecipientDomainResolving,
  disabled,
  menuPosition
}) => {
  const actualAddress = ensAddress || address
  const { t } = useTranslation()
  const { contacts } = useAddressBookControllerState()
  const { domains } = useDomainsControllerState()

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

  const renderSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      return (
        <SelectedMenuOption
          toggleMenu={toggleMenu}
          selectRef={selectRef}
          isMenuOpen={isMenuOpen}
          validation={isMenuOpen ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
          ensAddress={ensAddress}
          isRecipientDomainResolving={isRecipientDomainResolving}
          address={address}
          setAddress={setAddress}
          disabled={disabled}
        />
      )
    },
    [validation, ensAddress, isRecipientDomainResolving, address, setAddress, disabled]
  )

  return (
    <SectionedSelect
      value={selectedOption}
      setValue={setAddressWrapped}
      sections={sections}
      headerHeight={32}
      menuOptionHeight={54}
      withSearch={false}
      renderSelectedOption={renderSelectedOption}
      emptyListPlaceholderText={t('No contacts found')}
      menuPosition={menuPosition}
    />
  )
}

export default React.memo(Recipient)

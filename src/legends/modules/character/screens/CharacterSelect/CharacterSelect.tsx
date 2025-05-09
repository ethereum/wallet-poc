import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import Alert from '@legends/components/Alert'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import blurredLights from './blurred-lights-wide.png'
import styles from './CharacterSelect.module.scss'
import CharacterLoadingModal from './components/CharacterLoadingModal'
import CharacterSlider from './components/CharacterSlider'
import useMintCharacter from './hooks/useMintCharacter'

const CharacterSelect = () => {
  const navigate = useNavigate()
  const [characterId, setCharacterId] = useState(1)
  const { connectedAccount, v1Account } = useAccountContext()
  const [errorMessage, setErrorMessage] = useState('')

  const { character, isLoading } = useCharacterContext()
  const { isMinting, mintedAt, isMinted, loadingMessage, isCheckingMintStatus, mintCharacter } =
    useMintCharacter()

  const isMintedAndNotCaughtByRelayer =
    isMinted && !character && !isLoading && mintedAt === 'past-block-watch'

  useEffect(() => {
    if (character && !isMinting && !mintedAt) {
      navigate(LEGENDS_ROUTES.home)
      return
    }

    if (isMintedAndNotCaughtByRelayer) {
      setErrorMessage(
        'Character is already minted but could not be retrieved. Please try again or refresh the page.'
      )
    }
  }, [character, isMinted, isLoading, isMintedAndNotCaughtByRelayer, mintedAt, isMinting, navigate])

  const onCharacterChange = (id: number) => {
    setCharacterId(id)
  }

  const redirectToCharacterPage = () => {
    navigate(LEGENDS_ROUTES.home)
  }

  useEffect(() => {
    document.title = 'Ambire Rewards'
  }, [])

  if (!!v1Account || !connectedAccount) {
    return <Navigate to="/" />
  }

  const isButtonDisabled = isMinting || isLoading || isMinted

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.backgroundEffect}
        style={{ backgroundImage: `url(${blurredLights})` }}
      />
      <h1 className={styles.title}>Mint Your NFT</h1>
      <p className={styles.description}>
        Pick your profile avatar and mint a soulbound NFT for free
      </p>
      <CharacterSlider initialCharacterId={characterId} onCharacterChange={onCharacterChange} />
      {isMintedAndNotCaughtByRelayer && !isCheckingMintStatus && (
        <Alert
          type="error"
          title="Character is already minted"
          message="Character is already minted but could not be retrieved. Please contact Ambire support."
        />
      )}
      {!isMintedAndNotCaughtByRelayer && !isCheckingMintStatus && (
        <button
          onClick={() => {
            !isButtonDisabled && mintCharacter(characterId)
          }}
          type="button"
          disabled={isButtonDisabled}
          className={styles.saveButton}
        >
          {isMinting ? 'Please wait...' : 'Mint NFT'}
        </button>
      )}
      {isCheckingMintStatus && <Spinner />}

      <CharacterLoadingModal
        isOpen={
          !!character ||
          // Currently minting
          isMinting ||
          // Minted a short time ago and not caught by the relayer
          (isMinted && !character && !isMintedAndNotCaughtByRelayer)
        }
        loadingMessage={loadingMessage}
        errorMessage={errorMessage}
        showOnMintModal={!!(character || (character && isMinted))}
        onButtonClick={redirectToCharacterPage}
      />
    </div>
  )
}

export default CharacterSelect

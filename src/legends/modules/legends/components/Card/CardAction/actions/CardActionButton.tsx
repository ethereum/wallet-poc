import React from 'react'

import styles from './Action.module.scss'

export type ButtonProps = {
  onButtonClick: () => void
  buttonText: string
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  className?: string
}

const CardActionButton = ({
  onButtonClick,
  buttonText,
  disabled = false,
  isLoading = false,
  loadingText = 'Loading...',
  className = ''
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      onClick={onButtonClick}
      type="button"
      className={`${styles.button} ${className}`}
    >
      {!isLoading ? buttonText : loadingText}
    </button>
  )
}

export default CardActionButton

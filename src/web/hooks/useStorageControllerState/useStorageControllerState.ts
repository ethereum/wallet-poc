import { useContext } from 'react'

import { StorageControllerStateContext } from '@web/contexts/storageControllerStateContext'

export default function useStorageControllerState() {
  const context = useContext(StorageControllerStateContext)

  if (!context) {
    throw new Error(
      'useStorageControllerState must be used within a StorageControllerStateProvider'
    )
  }

  return context
}

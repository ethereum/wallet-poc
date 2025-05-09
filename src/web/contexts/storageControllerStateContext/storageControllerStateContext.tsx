import React, { createContext, useEffect } from 'react'

import { StorageController } from '@ambire-common/controllers/storage/storage'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const StorageControllerStateContext = createContext<StorageController>({} as StorageController)

const StorageControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'storage'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <StorageControllerStateContext.Provider value={memoizedState}>
      {children}
    </StorageControllerStateContext.Provider>
  )
}

export { StorageControllerStateProvider, StorageControllerStateContext }

/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { TransactionManagerController } from '@ambire-common/controllers/transaction/transactionManager'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const TransactionControllerStateContext = createContext<TransactionManagerController>(
  {} as TransactionManagerController
)

const TransactionControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'transactionManager'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <TransactionControllerStateContext.Provider value={memoizedState}>
      {children}
    </TransactionControllerStateContext.Provider>
  )
}

export { TransactionControllerStateProvider, TransactionControllerStateContext }

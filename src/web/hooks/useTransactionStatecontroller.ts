import { useContext } from 'react'

import { TransactionControllerStateContext } from '@web/contexts/transactionControllerStateContext'

export default function useTransactionControllerState() {
  const context = useContext(TransactionControllerStateContext)

  if (!context) {
    throw new Error(
      'useTransactionControllerState must be used within a TransactionControllerStateProvider'
    )
  }
  return context
}

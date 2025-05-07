import useBackgroundService from '@web/hooks/useBackgroundService'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import { useCallback } from 'react'

const useTransactionForm = () => {
  const { formState } = useTransactionControllerState()
  const { dispatch } = useBackgroundService()

  const handleSubmitForm = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_BUILD_TRANSACTION_USER_REQUEST',
      params: {
        transactionType: 'intent'
      }
    })
  }, [dispatch])

  return {
    formState,
    handleSubmitForm
  }
}

export default useTransactionForm

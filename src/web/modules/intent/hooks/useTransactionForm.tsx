import usePrevious from '@common/hooks/usePrevious'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import { useCallback, useEffect, useState } from 'react'

const useTransactionForm = () => {
  const { formState } = useTransactionControllerState()
  const { fromAmount, fromAmountFieldMode, fromAmountInFiat, fromChainId, toChainId } = formState
  const { dispatch } = useBackgroundService()
  const [fromAmountValue, setFromAmountValue] = useState<string>(fromAmount)
  const prevFromAmount = usePrevious(fromAmount)
  const prevFromAmountInFiat = usePrevious(fromAmountInFiat)

  const handleSubmitForm = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_BUILD_TRANSACTION_USER_REQUEST',
      params: {
        transactionType: 'intent'
      }
    })
  }, [dispatch])

  const onFromAmountChange = useCallback(
    (value: string) => {
      setFromAmountValue(value)
      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { fromAmount: value }
      })
    },
    [dispatch, setFromAmountValue]
  )

  useEffect(() => {
    if (fromAmountFieldMode === 'token') setFromAmountValue(fromAmount)
    if (fromAmountFieldMode === 'fiat') setFromAmountValue(fromAmountInFiat)
  }, [fromAmountFieldMode, fromAmount, fromAmountInFiat, setFromAmountValue])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'token' &&
      prevFromAmount !== fromAmount &&
      fromAmount !== fromAmountValue
    ) {
      setFromAmountValue(fromAmount)
    }
  }, [fromAmount, fromAmountValue, prevFromAmount, fromAmountFieldMode])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'fiat' &&
      prevFromAmountInFiat !== fromAmountInFiat &&
      fromAmountInFiat !== fromAmountValue
    ) {
      setFromAmountValue(fromAmountInFiat)
    }
  }, [fromAmountInFiat, fromAmountValue, prevFromAmountInFiat, fromAmountFieldMode])

  return {
    handleSubmitForm,
    onFromAmountChange,
    fromAmountValue,
    fromAmountFieldMode,
    fromAmount,
    fromAmountInFiat,
    fromChainId,
    toChainId
  }
}

export default useTransactionForm

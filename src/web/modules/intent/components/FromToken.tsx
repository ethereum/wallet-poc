import React, { FC, memo, useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { SelectValue } from '@common/components/Select/types'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useSwapAndBridgeForm from '@web/modules/intent/hooks/useSwapAndBridgeForm'
import { getTokenId } from '@web/utils/token'
import useTransactionControllerState from '@web/hooks/useTransactionStatecontroller'
import useTransactionForm from '../hooks/useTransactionForm'
import SendToken from './SendToken'

type Props = Pick<
  ReturnType<typeof useSwapAndBridgeForm>,
  | 'fromTokenOptions'
  | 'fromTokenValue'
  | 'fromAmountValue'
  | 'fromTokenAmountSelectDisabled'
  | 'onFromAmountChange'
>

const FromToken: FC<Props> = ({
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  // setIsAutoSelectRouteDisabled,
  onFromAmountChange
}) => {
  const { networks } = useNetworksControllerState()
  const { dispatch } = useBackgroundService()
  const { fromAmount, fromAmountInFiat, fromSelectedToken, maxFromAmount } = useTransactionForm()
  const {
    formState: { portfolioTokenList }
  } = useTransactionControllerState()
  const { fromAmountFieldMode, validateFromAmount } = useSwapAndBridgeControllerState()

  const handleChangeFromToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = portfolioTokenList.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes, networks) === value
      )
      // setIsAutoSelectRouteDisabled(false)

      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { fromSelectedToken: tokenToSelect }
      })
    },
    [portfolioTokenList, dispatch, networks]
  )

  const handleSetMaxFromAmount = useCallback(() => {
    dispatch({
      type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
      params: { fromAmount: maxFromAmount, fromAmountFieldMode: 'token' }
    })
  }, [maxFromAmount, dispatch])

  const handleSwitchFromAmountFieldMode = useCallback(() => {
    dispatch({
      type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
      params: { fromAmountFieldMode: fromAmountFieldMode === 'token' ? 'fiat' : 'token' }
    })
  }, [fromAmountFieldMode, dispatch])

  return (
    <SendToken
      fromTokenOptions={fromTokenOptions}
      fromTokenValue={fromTokenValue}
      fromAmountValue={fromAmountValue}
      fromTokenAmountSelectDisabled={fromTokenAmountSelectDisabled}
      handleChangeFromToken={handleChangeFromToken}
      fromSelectedToken={fromSelectedToken}
      fromAmount={fromAmount}
      fromAmountInFiat={fromAmountInFiat}
      fromAmountFieldMode={fromAmountFieldMode}
      maxFromAmount={maxFromAmount}
      validateFromAmount={validateFromAmount}
      onFromAmountChange={onFromAmountChange}
      handleSwitchFromAmountFieldMode={handleSwitchFromAmountFieldMode}
      handleSetMaxFromAmount={handleSetMaxFromAmount}
      inputTestId="from-amount-input-sab"
      selectTestId="from-token-select"
    />
  )
}

export default memo(FromToken)

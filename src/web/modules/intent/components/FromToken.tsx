import React, { FC, memo, useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useSwapAndBridgeForm from '@web/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import { getTokenId } from '@web/utils/token'

type Props = Pick<
  ReturnType<typeof useSwapAndBridgeForm>,
  | 'fromTokenOptions'
  | 'fromTokenValue'
  | 'fromAmountValue'
  | 'fromTokenAmountSelectDisabled'
  | 'onFromAmountChange'
  | 'setIsAutoSelectRouteDisabled'
>

const FromToken: FC<Props> = ({
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  setIsAutoSelectRouteDisabled,
  onFromAmountChange
}) => {
  const { networks } = useNetworksControllerState()
  const { dispatch } = useBackgroundService()

  const {
    fromSelectedToken,
    toSelectedToken,
    fromAmount,
    fromAmountInFiat,
    portfolioTokenList,
    fromAmountFieldMode,
    maxFromAmount,
    validateFromAmount
  } = useSwapAndBridgeControllerState()

  const handleChangeFromToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = portfolioTokenList.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes, networks) === value
      )

      setIsAutoSelectRouteDisabled(false)

      // Switch the tokens if the selected token is the same as the "to" token
      if (
        tokenToSelect &&
        toSelectedToken &&
        tokenToSelect.address === toSelectedToken.address &&
        tokenToSelect.chainId === BigInt(toSelectedToken.chainId || 0)
      ) {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS'
        })
        return
      }

      dispatch({
        type: 'TRANSACTION_CONTROLLER_UPDATE_FORM',
        params: { fromSelectedToken: tokenToSelect }
      })
    },
    [portfolioTokenList, setIsAutoSelectRouteDisabled, toSelectedToken, dispatch, networks]
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

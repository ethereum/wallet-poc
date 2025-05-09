import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AdditionalPortfolioNetworkResult } from '@ambire-common/libs/portfolio/interfaces'
import { RELAYER_URL } from '@env'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'

export type AccountPortfolio = {
  amount?: number
  amountFormatted?: string
  isReady?: boolean
  error?: string
}
export type ClaimableRewards = {
  address: string
  symbol: string
  amount: string
  decimals: number
  networkId: string
  chainId: number
  priceIn: Array<{
    baseCurrency: string
    price: number
  }>
}

const PortfolioControllerStateContext = createContext<{
  accountPortfolio?: AccountPortfolio
  updateAccountPortfolio: () => void
  claimableRewardsError: string | null
  claimableRewards: ClaimableRewards | null
  isLoadingClaimableRewards: boolean
}>({
  updateAccountPortfolio: () => {},
  claimableRewardsError: null,
  claimableRewards: null,
  isLoadingClaimableRewards: false
})

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const getPortfolioIntervalRef: any = useRef(null)
  const { connectedAccount, nonV2Account, isLoading } = useAccountContext()
  const [accountPortfolio, setAccountPortfolio] = useState<AccountPortfolio>()
  const [claimableRewards, setClaimableRewards] = useState<any>(null)
  const [isLoadingClaimableRewards, setIsLoadingClaimableRewards] = useState(true)
  const [claimableRewardsError, setClaimableRewardsError] = useState<string | null>(null)
  const [xWalletClaimableBalance, setXWalletClaimableBalance] = useState<string | null>(null)

  const updateAdditionalPortfolio = useCallback(async () => {
    if (!connectedAccount) return
    try {
      setIsLoadingClaimableRewards(true)
      const additionalPortfolioResponse = await fetch(
        `${RELAYER_URL}/v2/identity/${connectedAccount}/portfolio-additional`
      )

      const additionalPortfolioJson = await additionalPortfolioResponse.json()

      const xWalletClaimableBalanceData =
        additionalPortfolioJson?.data?.rewards?.xWalletClaimableBalance
      const claimableBalance = additionalPortfolioJson?.data?.rewards?.stkWalletClaimableBalance
      if (claimableBalance === undefined) {
        throw new Error('Invalid response format')
      }

      setClaimableRewards(claimableBalance)
      setXWalletClaimableBalance(xWalletClaimableBalanceData)
      setIsLoadingClaimableRewards(false)
    } catch (e) {
      console.error('Error fetching additional portfolio:', e)
      setIsLoadingClaimableRewards(false)
      setClaimableRewards(null)
      setClaimableRewardsError('Error fetching claimable data')
    }
  }, [connectedAccount])

  const updateAccountPortfolio = useCallback(async () => {
    if (!window.ambire)
      return setAccountPortfolio({
        error: 'The Ambire extension is not installed!',
        isReady: false
      })

    // While account is loading, we don't know yet what is the value of actual value of `nonV2Account`
    if (isLoading) return

    if (!connectedAccount) return

    // Ensure there isn't already a scheduled timeout before setting a new one.
    if (getPortfolioIntervalRef.current) clearTimeout(getPortfolioIntervalRef.current)

    // We don't want to trigger a portfolio update (updateAccountPortfolio) for non v2 account
    if (nonV2Account) {
      return setAccountPortfolio((prevAccountPortfolio) => {
        // If the user switches to a non-V2 account and we already have the balance for the `connectedAccount`,
        // we want to display the balance of the `connectedAccount`.
        if (prevAccountPortfolio) return prevAccountPortfolio

        // If the balance of the `connectedAccount` has not been fetched, we simply show a placeholder balance for the `nonV2Account`,
        // as we do not want to display its actual balance.
        return {
          amount: 0,
          amountFormatted: '-',
          isReady: true
        }
      })
    }

    // Polling mechanism for fetching the extension's portfolio.
    // A polling mechanism is needed because we fetch the portfolio from multiple networks,
    // and when calling `get_portfolioBalance`, the portfolio might not be fully fetched,
    // resulting in a partial amount being returned (`isReady=false`).
    // To handle this, we retry fetching the portfolio until `isReady=true`,
    // with a 3-second delay between calls.
    const getPortfolioTillReady = async () => {
      // Reset the portfolio to prevent displaying an outdated portfolio state for the previously connected account
      // while fetching the portfolio for the new account (address).
      setAccountPortfolio({ isReady: false })

      const portfolioRes = (await window.ambire.request({
        method: 'get_portfolioBalance',
        // TODO: impl a dynamic way of getting the chainIds
        params: [
          { chainIds: LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID.map((n) => `0x${n.toString(16)}`) }
        ]
      })) as AccountPortfolio

      if (portfolioRes.isReady) {
        return setAccountPortfolio(portfolioRes)
      }

      getPortfolioIntervalRef.current = setTimeout(getPortfolioTillReady, 3000)
    }

    await getPortfolioTillReady()
  }, [isLoading, connectedAccount, nonV2Account, setAccountPortfolio])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateAdditionalPortfolio()
  }, [updateAdditionalPortfolio])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateAccountPortfolio()
    return () => {
      clearTimeout(getPortfolioIntervalRef.current)
    }
  }, [updateAccountPortfolio])

  return (
    <PortfolioControllerStateContext.Provider
      value={useMemo(
        () => ({
          accountPortfolio,
          updateAccountPortfolio,
          claimableRewardsError,
          claimableRewards,
          isLoadingClaimableRewards,
          xWalletClaimableBalance
        }),
        [
          accountPortfolio,
          updateAccountPortfolio,
          claimableRewards,
          claimableRewardsError,
          isLoadingClaimableRewards,
          xWalletClaimableBalance
        ]
      )}
    >
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }

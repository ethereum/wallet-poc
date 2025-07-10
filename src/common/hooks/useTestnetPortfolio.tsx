import { useMemo } from 'react'
import { PINNED_TOKENS } from '@ambire-common/consts/pinnedTokens'
import { testnetNetworks } from '@ambire-common/consts/testnetNetworks'
import { Network } from '@ambire-common/interfaces/network'
import { AssetType } from '@ambire-common/libs/defiPositions/types'
import { getTokenBalanceInUSD, getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { tokenSearch } from '@common/utils/search'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

// if any of the post amount (during simulation) or the current state
// has a balance above 0, we should consider it legit and show it
const hasAmount = (token: TokenResult) => {
  return token.amount > 0n || (token.amountPostSimulation && token.amountPostSimulation > 0n)
}
// if the token is on the gas tank and the network is not a relayer network (a custom network)
// we should not show it on dashboard
const isGasTankTokenOnCustomNetwork = (token: TokenResult, networks: Network[]) => {
  return token.flags.onGasTank && !networks.find((n) => n.chainId === token.chainId && n.hasRelayer)
}

export const useTestnetPortfolio = () => {
  const { customTokens } = usePortfolioControllerState()
  const { portfolio, dashboardNetworkFilter } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()

  const tokens = useMemo(
    () =>
      (portfolio?.tokens || [])
        // Hide gas tank and borrowed defi tokens from the list
        .filter((token) => !token.flags.onGasTank && token.flags.defiTokenType !== AssetType.Borrow)
        .filter((token) => {
          if (!dashboardNetworkFilter) return true
          if (dashboardNetworkFilter === 'rewards') return token.flags.rewardsType
          if (dashboardNetworkFilter === 'gasTank') return token.flags.onGasTank

          return (
            token?.chainId?.toString() === dashboardNetworkFilter.toString() &&
            !token.flags.onGasTank
          )
        })
        .filter((token) => tokenSearch({ search: '', token, networks })),
    [portfolio?.tokens, dashboardNetworkFilter, networks]
  )

  const userHasNoBalance = useMemo(
    // Exclude gas tank tokens from the check
    // as new users get some Gas Tank balance by default
    () => !tokens.some((token) => !token.flags.onGasTank && hasAmount(token)),
    [tokens]
  )

  const sortedTokens = useMemo(() => {
    const filteredTokens = tokens
      .filter((token) => {
        if (isGasTankTokenOnCustomNetwork(token, networks)) return false
        if (token?.flags.isHidden) return false

        const hasTokenAmount = hasAmount(token)
        const isCustom = customTokens.find(
          ({ address, chainId }) =>
            token.address.toLowerCase() === address.toLowerCase() && token.chainId === chainId
        )
        const isPinned = PINNED_TOKENS.find(
          ({ address, chainId }) =>
            token.address.toLowerCase() === address.toLowerCase() && token.chainId === chainId
        )

        return (
          hasTokenAmount ||
          isCustom ||
          // Don't display pinned tokens until we are sure the user has no balance
          (isPinned && userHasNoBalance && portfolio?.isAllReady)
        )
      })
      .sort((a, b) => {
        // pending tokens go on top
        if (
          typeof a.amountPostSimulation === 'bigint' &&
          a.amountPostSimulation !== BigInt(a.amount)
        ) {
          return -1
        }
        if (
          typeof b.amountPostSimulation === 'bigint' &&
          b.amountPostSimulation !== BigInt(b.amount)
        ) {
          return 1
        }

        // If a is a rewards token and b is not, a should come before b.
        if (a.flags.rewardsType && !b.flags.rewardsType) {
          return -1
        }
        if (!a.flags.rewardsType && b.flags.rewardsType) {
          // If b is a rewards token and a is not, b should come before a.
          return 1
        }

        const aBalance = getTokenBalanceInUSD(a)
        const bBalance = getTokenBalanceInUSD(b)

        if (a.flags.rewardsType === b.flags.rewardsType) {
          if (aBalance === bBalance) {
            return Number(getTokenAmount(b)) - Number(getTokenAmount(a))
          }

          return bBalance - aBalance
        }

        if (a.flags.onGasTank && !b.flags.onGasTank) {
          return -1
        }
        if (!a.flags.onGasTank && b.flags.onGasTank) {
          return 1
        }

        return 0
      })

    // Group tokens by symbol and aggregate balances
    const groupedTokensMap = new Map()

    filteredTokens
      // Filter out mainnet tokens
      .filter((token) => testnetNetworks.find((n) => n.chainId === token.chainId))
      .forEach((token) => {
        const key = token.symbol

        if (groupedTokensMap.has(key)) {
          const existingToken = groupedTokensMap.get(key)

          // Aggregate amounts
          const newAmount = existingToken.amount + token.amount

          // Track amount per chain
          const amountPerChain = {
            ...existingToken.amountPerChain,
            [token.chainId.toString()]:
              (existingToken.amountPerChain[token.chainId.toString()] || 0n) + token.amount
          }

          // Merge flags (prioritize certain flags)
          const mergedFlags = {
            ...existingToken.flags,
            onGasTank: existingToken.flags.onGasTank || token.flags.onGasTank,
            rewardsType: existingToken.flags.rewardsType || token.flags.rewardsType,
            canTopUpGasTank: existingToken.flags.canTopUpGasTank || token.flags.canTopUpGasTank,
            isFeeToken: existingToken.flags.isFeeToken || token.flags.isFeeToken,
            isCustom: existingToken.flags.isCustom || token.flags.isCustom
          }

          // Hardcoded price for testnet tokens
          const newPriceIn =
            existingToken.symbol === 'ETH'
              ? [{ baseCurrency: 'usd', price: 2300 }]
              : [{ baseCurrency: 'usd', price: 1 }]

          // Hardcoded uri for testnet tokens
          const newUri =
            existingToken.symbol === 'ETH'
              ? 'https://cena.ambire.com/iconProxy/base/0x0000000000000000000000000000000000000000'
              : 'https://cena.ambire.com/iconProxy/polygon-pos/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

          // Remove if we dont want to show the simulation amount
          const newPostSimulationAmount = newAmount + (existingToken.simulationAmount || 0n)

          groupedTokensMap.set(key, {
            ...existingToken,
            amount: newAmount,
            uri: newUri,
            latestAmount: newAmount,
            pendingAmount: newAmount,
            amountPostSimulation: newPostSimulationAmount,
            amountPerChain,
            priceIn: newPriceIn,
            flags: mergedFlags,
            // Keep the chainId of the token with the highest balance for this symbol
            chainId:
              getTokenBalanceInUSD(token) > getTokenBalanceInUSD(existingToken)
                ? token.chainId
                : existingToken.chainId
          })
        } else {
          groupedTokensMap.set(key, {
            ...token,
            amountPerChain: {
              [token.chainId.toString()]: token.amount
            }
          })
        }
      })

    // Convert back to array and maintain the original sorting order
    const groupedTokens = Array.from(groupedTokensMap.values()).sort((a, b) => {
      // Apply the same sorting logic as before to maintain consistency
      if (
        typeof a.amountPostSimulation === 'bigint' &&
        a.amountPostSimulation !== BigInt(a.amount)
      ) {
        return -1
      }
      if (
        typeof b.amountPostSimulation === 'bigint' &&
        b.amountPostSimulation !== BigInt(b.amount)
      ) {
        return 1
      }

      if (a.flags.rewardsType && !b.flags.rewardsType) {
        return -1
      }
      if (!a.flags.rewardsType && b.flags.rewardsType) {
        return 1
      }

      const aBalance = getTokenBalanceInUSD(a)
      const bBalance = getTokenBalanceInUSD(b)

      if (a.flags.rewardsType === b.flags.rewardsType) {
        if (aBalance === bBalance) {
          return Number(getTokenAmount(b)) - Number(getTokenAmount(a))
        }
        return bBalance - aBalance
      }

      if (a.flags.onGasTank && !b.flags.onGasTank) {
        return -1
      }
      if (!a.flags.onGasTank && b.flags.onGasTank) {
        return 1
      }

      return 0
    })

    return groupedTokens
  }, [tokens, networks, customTokens, userHasNoBalance, portfolio?.isAllReady])

  const totalBalance = useMemo(() => {
    return sortedTokens.reduce((acc, token) => acc + getTokenBalanceInUSD(token), 0)
  }, [sortedTokens])

  return {
    sortedTokens,
    totalBalance
  }
}

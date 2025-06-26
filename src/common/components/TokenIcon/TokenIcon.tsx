import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'

import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import SkeletonLoader from '../SkeletonLoader'
import { SkeletonLoaderProps } from '../SkeletonLoader/types'
import getStyles from './styles'

interface Props extends Partial<ImageProps> {
  /* supports network id or chain id */
  chainId?: bigint
  address?: string
  containerStyle?: ViewStyle
  withContainer?: boolean
  withNetworkIcon?: boolean
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
  onGasTank?: boolean
  networkSize?: number
  uri?: string
  skeletonAppearance?: SkeletonLoaderProps['appearance']
  amountPerChain?: {
    [chainId: string]: bigint
  }
}

enum UriStatus {
  UNKNOWN = 'UNKNOWN',
  IMAGE_MISSING = 'IMAGE_MISSING',
  IMAGE_EXISTS = 'IMAGE_EXISTS'
}

const TokenIcon: React.FC<Props> = ({
  chainId,
  address = '',
  uri: fallbackUri,
  withContainer = false,
  withNetworkIcon = true,
  containerWidth = 34,
  containerHeight = 34,
  containerStyle,
  width = 20,
  height = 20,
  onGasTank = false,
  networkSize = 14,
  skeletonAppearance = 'primaryBackground',
  amountPerChain,
  ...props
}) => {
  const { styles } = useTheme(getStyles)
  const [uriStatus, setUriStatus] = useState<UriStatus>(UriStatus.UNKNOWN)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const { networks: controllerNetworks } = useNetworksControllerState()
  const { benzinNetworks } = useBenzinNetworksContext()
  // Component used across Benzin and Extension, make sure to always set networks
  const networks = controllerNetworks ?? benzinNetworks

  const network = useMemo(() => networks.find((n) => n.chainId === chainId), [chainId, networks])

  const handleImageLoaded = useCallback(() => setUriStatus(UriStatus.IMAGE_EXISTS), [])
  const attemptToLoadFallbackImage = useCallback(async () => {
    if (fallbackUri) {
      const doesFallbackUriImageExists = await checkIfImageExists(fallbackUri)
      if (doesFallbackUriImageExists) {
        setImageUrl(fallbackUri)
        setUriStatus(UriStatus.IMAGE_EXISTS)
        return
      }
    }

    setUriStatus(UriStatus.IMAGE_MISSING)
    setImageUrl(undefined)
  }, [fallbackUri])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const hasAmbireUriRequiredData = !!(network?.platformId && address)
      if (hasAmbireUriRequiredData) {
        const ambireUri = `https://cena.ambire.com/iconProxy/${network.platformId}/${address}`
        // Skip checking if the this image exists for optimizing network calls.
        // Although the `checkIfImageExists` only retrieves headers (which is
        // quick), in the cast majority of cases, the (default) ambire URI will exist.
        // const doesAmbireUriImageExists = await checkIfImageExists(ambireUri)
        setImageUrl(ambireUri)
        setUriStatus(UriStatus.IMAGE_EXISTS)
        return
      }

      await attemptToLoadFallbackImage()
    })()
  }, [address, network?.platformId, fallbackUri, attemptToLoadFallbackImage, network])

  const memoizedContainerStyle = useMemo(
    () => [
      containerStyle,
      {
        width: withContainer ? containerWidth : width,
        height: withContainer ? containerHeight : height
      },
      withContainer && styles.withContainerStyle
    ],
    [
      containerStyle,
      withContainer,
      containerWidth,
      width,
      containerHeight,
      height,
      styles.withContainerStyle
    ]
  )

  const shouldDisplayNetworkIcon = withNetworkIcon && !!network && !onGasTank

  // Get first 4 chains with amounts, sorted by amount (highest first)
  const chainsWithAmounts = useMemo(() => {
    if (!amountPerChain) return []

    return Object.entries(amountPerChain)
      .filter(([, amount]) => (amount as bigint) > 0n)
      .sort(([, a], [, b]) =>
        (b as bigint) > (a as bigint) ? 1 : (b as bigint) < (a as bigint) ? -1 : 0
      )
      .slice(0, 4)
      .map(([chainIdString]) => {
        const networkForChain = networks.find((n) => n.chainId.toString() === chainIdString)
        return { chainId: chainIdString, network: networkForChain }
      })
      .filter(({ network: networkForChain }) => !!networkForChain)
  }, [amountPerChain, networks])

  const hasMultipleChains = chainsWithAmounts.length > 1

  return (
    <View style={memoizedContainerStyle}>
      {uriStatus === UriStatus.UNKNOWN ? (
        <SkeletonLoader
          width={width}
          height={height}
          style={styles.loader}
          appearance={skeletonAppearance}
        />
      ) : uriStatus === UriStatus.IMAGE_MISSING ? (
        <MissingTokenIcon
          withRect={withContainer}
          width={withContainer ? containerWidth : width}
          height={withContainer ? containerHeight : height}
        />
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{ width, height, borderRadius: BORDER_RADIUS_PRIMARY }}
          // Just in case the URI is valid and image exists, but still fails to load
          onError={attemptToLoadFallbackImage}
          onLoad={handleImageLoaded}
          {...props}
        />
      )}
      {hasMultipleChains ? (
        <View style={[styles.networkIconWrapper]}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              width: networkSize * 2,
              height: networkSize * 2
            }}
          >
            {chainsWithAmounts.map(({ chainId: chainIdString, network: networkForChain }, index) =>
              networkForChain ? (
                <NetworkIcon
                  key={chainIdString}
                  id={networkForChain.chainId.toString()}
                  size={networkSize * 0.8}
                  style={
                    [
                      styles.networkIcon,
                      {
                        position: 'absolute',
                        right: (index % 2) * (networkSize * 0.8),
                        bottom: Math.floor(index / 2) * (networkSize * 0.8)
                      }
                    ] as any
                  }
                  benzinNetwork={networkForChain}
                />
              ) : null
            )}
          </View>
        </View>
      ) : shouldDisplayNetworkIcon ? (
        <View
          style={[
            styles.networkIconWrapper,
            !withContainer && {
              right: -3,
              bottom: -3,
              left: 'auto',
              top: 'auto'
            }
          ]}
        >
          <NetworkIcon
            id={!onGasTank ? network.chainId.toString() : 'gasTank'}
            size={networkSize}
            style={styles.networkIcon}
            benzinNetwork={network}
          />
        </View>
      ) : null}
    </View>
  )
}

export default React.memo(TokenIcon)

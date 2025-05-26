import { resolveENSDomain } from '@ambire-common/services/ensDomains'
import { ToastOptions } from '@common/contexts/toastContext'
import {
  ExtendedAddressState,
  ExtendedAddressStateOptional
} from '@ambire-common/interfaces/interop'
import { resolveInteropAddress } from './interopSdkService'

export interface Resolver {
  name: string
  canResolve: (address: string) => boolean
  resolve: (address: string) => Promise<Partial<ExtendedAddressState>>
}

export interface ResolverContext {
  fieldValue: string
  handleCacheResolvedDomain: (address: string, domain: string, type: 'ens') => void
  addToast: (message: string, options?: ToastOptions) => void
  setAddressState: (state: ExtendedAddressStateOptional, forceDispatch?: boolean) => void
}

export const createResolvers = (context: ResolverContext): Resolver[] => [
  {
    name: 'interop',
    canResolve: (address: string) => {
      // Match <prefix>@<namespace>[:<chainId>]#<checksum>
      const pattern = /^[^@]+@[^:#]+(?::[^#]+)?#[^#]+$/
      return pattern.test(address)
    },
    resolve: async (address: string) => {
      try {
        const resolvedAddress = await resolveInteropAddress(address)

        if (resolvedAddress) {
          return { interopAddress: resolvedAddress }
        }

        return { interopAddress: '' }
      } catch (error) {
        context.addToast('Something went wrong while attempting to resolve the interop address.', {
          type: 'error'
        })
        return { interopAddress: '' }
      }
    }
  },
  {
    name: 'ens',
    canResolve: (address: string) => address.toLowerCase().endsWith('.eth'),
    resolve: async (address: string) => {
      try {
        const resolvedAddress = await resolveENSDomain(address)

        if (resolvedAddress) {
          context.handleCacheResolvedDomain(resolvedAddress, context.fieldValue, 'ens')
          return { ensAddress: resolvedAddress }
        }

        return { ensAddress: '' }
      } catch (error) {
        context.addToast('Something went wrong while attempting to resolve the ENS domain.', {
          type: 'error'
        })
        return { ensAddress: '' }
      }
    }
  }
]

export const resolveAddress = async (address: string, context: ResolverContext): Promise<void> => {
  const resolvers = createResolvers(context)
  const applicableResolvers = resolvers.filter((r) => r.canResolve(address))

  // If no resolvers apply, reset state
  if (applicableResolvers.length === 0) {
    context.setAddressState({
      ensAddress: '',
      interopAddress: '',
      isDomainResolving: false
    })
    return
  }

  context.setAddressState({ isDomainResolving: true })

  try {
    const results = await Promise.all(applicableResolvers.map((r) => r.resolve(address)))

    const combined = results.reduce<Partial<ExtendedAddressState>>((acc, curr) => {
      return { ...acc, ...curr }
    }, {})

    context.setAddressState({ ...combined, isDomainResolving: false }, true)
  } catch (error) {
    context.addToast('Something went wrong while resolving domain.', { type: 'error' })
    context.setAddressState({ isDomainResolving: false }, true)
  }
}

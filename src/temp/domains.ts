// Duplcated from @ambire-common/interfaces/domains.ts

type AddressState = {
  fieldValue: string
  ensAddress: string
  interopAddress: string
  isDomainResolving: boolean
}

type AddressStateOptional = {
  fieldValue?: AddressState['fieldValue']
  ensAddress?: AddressState['ensAddress']
  interopAddress?: AddressState['interopAddress']
  isDomainResolving?: AddressState['isDomainResolving']
}

export type { AddressState, AddressStateOptional }

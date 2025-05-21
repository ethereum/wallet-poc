export const resolveInteropAddress = async (trimmedAddress: string): Promise<string> => {
  const pattern = /^[^@]+@[^:#]+(?::[^#]+)?#[^#]+$/

  if (pattern.test(trimmedAddress)) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(trimmedAddress)
      }, 100)
    })
  }

  return Promise.reject('')

  // return isValid ? trimmedAddress : ''
}

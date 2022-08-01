export interface Owner {
    address: string
    associatedTokenAccountAddress: string
  }

  export interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
    owner: Owner
    animationUrl: string
  }
export interface Owner {
  address: string
  associatedTokenAccountAddress: string
}

export interface Attribute {
  value: String
  traitType: String
}

export interface File {
  metadataAddress: String
  uri: String
  fileType: String
}

export interface Creator{
  address: String
  metadataAddress: String
  share: Number
  verified: Boolean
  position?: Number
  twitterHandle?: String	
}

export interface Nft {
  name: string
  address: string
  description: string
  image: string
  mintAddress: string
  animationUrl: string
  externalUrl: string
  owner: Owner
  files: File[]
  attributes: Attribute[]
  creators: Creator[]
}

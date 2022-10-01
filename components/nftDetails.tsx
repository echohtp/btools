import { Nft } from '../types'

interface nftDetailsInterface {
  nft: Nft | undefined
}

export const NftDetails = (props: nftDetailsInterface) => {
  const { nft } = props
  if (!nft) return <></>
  console.log('nft details')
  console.log(nft)
  return (
    <div className='container'>
      <h1>{nft.name}</h1>
      <h3>{nft.description}</h3>
      {nft.files.map(file => {
        if (file.fileType.includes('video')) {
          return <video src={file.uri.toString()} />
        }
        if (file.fileType.includes('image')) {
          if (file.uri == nft.image) return <img src={nft.image} />
          else return <img src={file.uri.toString()} />
        }
        if (file.fileType.includes('html')) {
          return <iframe src={file.uri.toString()} />
        }
      })}
      <h3>Creators</h3>
      <div className='grid grid-flow-row'>
        {nft.creators.map(creator => {
          if (creator.twitterHandle)
            return (
              <div>
                <h2 className='inline-block'>
                  {creator.twitterHandle}&nbsp;&nbsp;
                </h2>
                <p className='inline-block text-small'>({creator.address})</p>
              </div>
            )
          else
            return (
              <div>
                <h2>{creator.address}</h2>
              </div>
            )
        })}
      </div>
      {nft.attributes.length > 0 && (
        <>
          <h3>Attributes</h3>
          <div className='grid grid-cols-4 gap-4'>
            {nft.attributes.map((attr, i) => (
              <div key={i}>
                <h2>{attr.traitType}</h2>
                <h3>{attr.value}</h3>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default NftDetails

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity, Nft } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'

const schema = {
  type: 'object',
  properties: {
    mint: {
      type: 'string'
    },
    url: {
      type: 'string'
    }
  },
  required: ['uri']
}

export const QuickFix = () => {
  const initData = { url: '' , mint: ''}
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)

  const mintIt = async () => {
    console.log(data)
    if (data.url.length === 0 || !data.mint || data.mint == "" ) {
      alert('Please enter a metadata URL')
      return
    }

    if (!data.mint || data.mint == "" ) {
      alert('Please enter a mint hash')
      return
    }
    
    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )
      let nft: Nft
      try {
        nft = await metaplex.nfts().findByMint(new PublicKey(data.mint)).run()
      }catch (e:any){
        alert("couldnt load nft from mint")
        return
      }
      console.log('gonna try and fix this!')
      console.log(data.url)
      axios.get(data.url).then(async d => {
        try {
          const updatedNft = await metaplex
            .nfts()
            .update(nft, {
              name: d.data.name,
              uri: data.url,
              sellerFeeBasisPoints: d.data.seller_fee_basis_points
            })
            .run()
          console.log('updated!')
          console.log(updatedNft.nft.mintAddress.toBase58())
        } catch (e:any) {
          console.log(e)
        }
        setLoading(false)
      })
    } catch (e:any) {
      alert("couldnt load url")
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Quick Fix - Supply Mint & URL to metaplex json to fix NFT</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />

        <Button
          loading={loading}
          onClick={mintIt}
          className='btn btn-secondary'
        >
          fix it
        </Button>
      </div>
    </>
  )
}

export default QuickFix

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity, Nft } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'
import { toast } from 'react-toastify'

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
  const initData = { url: '', mint: '' }
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC!)
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(initData)

  const mintIt = async () => {
    console.log(data)
    if (data.url.length === 0 || !data.mint || data.mint == '') {
      alert('Please enter a metadata URL')
      return
    }

    if (!data.mint || data.mint == '') {
      alert('Please enter a mint hash')
      return
    }

    setLoading(true)
    const mints = data.mint.replace(/(^,)|(,$)/g, '').split(',')
    toast(mints.length)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )

      let nft: Nft
      
      for (var i = 0; i < mints.length; i++) {
        try {
          nft = await metaplex
            .nfts()
            .findByMint(new PublicKey(mints[i]))
            .run()
        } catch (e) {
          alert('couldnt load nft from mint')
          return
        }
        console.log('gonna try and fix this!')
        console.log(data.url)
        toast("Updating: ", mints[i])
        // need logic to detect of metadata is the same and skip
        try {
          const updatedNft = await metaplex
            .nfts()
            .update(nft, {
              uri: data.url
            })
            .run()
          console.log('updated!')
          console.log(updatedNft.nft.mintAddress.toBase58())
        } catch (e) {
          console.log(e)
        }
      }
    } catch (e) {
      alert('couldnt load url')
      console.error(e)
      setLoading(false)
    }
    setLoading(false)
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

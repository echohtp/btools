import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity , Nft} from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import { gql } from '@apollo/client'
import client from '../client'
import { JsonForms } from '@jsonforms/react'
import * as ga from '../lib/ga'

export const EditionPrinter = () => {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC!)
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const initData = { destinationAddress: wallet.publicKey?.toBase58(), nfts: '', mintAddress: '' }
  const [data, setData] = useState<any>(initData)
  const [nfts, setNfts] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [schema, setSchema] = useState<object>({})

  const GET_NFTS = gql`
    query GetNfts($creators: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $creators, limit: $limit, offset: $offset) {
        address
        mintAddress
        name
        description
        image
        owner {
          address
          associatedTokenAccountAddress
        }
      }
    }
  `

  useMemo(() => {
    if (wallet.publicKey?.toBase58()) {
      client
        .query({
          query: GET_NFTS,
          variables: {
            creators: [wallet.publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => {
          var mapResult = res.data.nfts.map((n: Nft) => {
            return { const: n.mintAddress, title: n.name }
          }, {})
          setNfts(mapResult)
          setSchema({
            type: 'object',
            properties: {
              destinationAddress: {
                type: 'string'
              },
              nfts: {
                type: 'string',
                title: 'Nft',
                oneOf: mapResult
              },
              mintHash: {
                type: 'string'
              }
            },
            required: ['uri']
          })
          console.log(mapResult)
        })
    } else {
      setNfts([])
      setSchema({
        type: 'object',
        properties: {
          destinationAddress: {
            type: 'string'
          },
          nfts: {
            type: 'string',
            title: 'Nft',
            enum: []
          },
          mintHash: {
            type: 'string'
          }
        },
        required: ['uri']
      })
    }
  }, [wallet, GET_NFTS])

  // useMemo(async()=>{
  //     if (wallet.publicKey?.toBase58()) {
  //       console.log("ok");
        
  //       try {
  //         const metaplex = Metaplex.make(connection).use(
  //           walletAdapterIdentity(wallet)
  //         )
  //         console.log("ok 7 ");
          
  //         const nfts = await metaplex.nfts().findAllByCreator(wallet.publicKey).run()
  //         console.log("ok 8 ");
  //         console.log(nfts);
          
  //         nfts.map((n,i)=>{
  //           console.log(n)
  //         })
  //       }catch(e:any){
  //         console.log("error")
  //         console.log(e)
  //       }
  //     }
  // },[wallet])

  const printIt = async () => {
    console.log(data)
    if (data.mintHash == '' && data.nfts == '') {
      alert('mint hash needed')
      return
    }

    if (data.destinationAddress == ''){
      alert('destination address needed')
      return
    }

    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )
      const nftPk = (data.mintHash && data.mintHash !== "" && data.nfts !== "") ? new PublicKey(data.mintHash)  : new PublicKey(data.nfts)
        // (data.mintHash !== null && data.mintHash !== ""  && data.nfts !== "")
        //   ? new PublicKey(data.nfts)
        //   : new PublicKey(data.mintHash)
      
      console.log("nft: ", nftPk.toBase58())
      const nft = await metaplex
        .nfts()
        .findByMint(nftPk)
        .run()
      
      const owners = data.destinationAddress.split(',') ? data.destinationAddress.replace(/(^,)|(,$)/g, '').split(',') : data.destinationAddress
      console.log(owners)
      for (var i =0 ; i < owners.length; i++){
        const newOwner = new PublicKey(owners[i])
        await metaplex
        .nfts()
        .printNewEdition(nft, { newOwner })
        .run()
      }
      alert('done!')
      ga.event({action: 'edition_print',
      params: { mint: nftPk.toBase58() }})
    } catch (e: any) {
      alert(`error: ${e.message}`)
      console.error(e.message)
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Edition Printer - Make prints from your Master Edition NFTs</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />

        <Button
          loading={loading}
          onClick={printIt}
          className='btn btn-secondary'
        >
          Print It
        </Button>
      </div>
    </>
  )
}

export default EditionPrinter

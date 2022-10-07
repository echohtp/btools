import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import MultiSend from '../components/multisend'
import { NftEdit } from '../components/nftedit'
import QuickFix from '../components/quickFix'
import HolderSnapshot from '../components/holdersnapshot'
import AirdropCannon from '../components/airdropCannon'
import QuickMint from '../components/quickMint'
import EditionPrinter from '../components/editionPrinter'
import UpdateUA from '../components/updateUA'
import CloseNfts from '../components/closenfts'
import MintHash from '../components/minthash'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Tooltip } from 'antd'
import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { gql } from '@apollo/client'
import Burn from '../components/burn'
import client from '../client'
import Viewer from '../components/viewer'
import NftMint from '../components/nftMinter'
import CreateCandyMachine from '../components/createCandymachine'

const navbarLinks = [
  { title: 'INDEX', href: '' },
  { title: 'AIRDROP CANNON', href: 'airdropcannon' },
  { title: 'BURN', href: 'burn' },
  { title: 'CHANGE UA', href: 'updateua' },
  { title: 'CLOSE ACCTS', href: 'closeaccts' },
  { title: 'CREATE CANDY MACHINES', href: 'createcm' },
  { title: 'EDITION PRINTER', href: 'editionprinter' },
  { title: 'HOLDER SNAPSHOT', href: 'holdersnapshot' },
  { title: 'MASS SEND', href: 'multisend' },
  { title: 'MINT HASH', href: 'minthash' },
  { title: 'NFT EDITOR', href: 'editor' },
  { title: 'NFT MINTER', href: 'nftmint' },
  { title: 'QUICK FIX', href: 'quickfix' },
  { title: 'QUICK MINT', href: 'quickmint' },
  { title: 'VIEWER', href: 'viewer' }
]

const Sidebar = () => {
  return(<div className='grid grid-flow-row auto-rows-max'>
  <button className='bg-purple-800'><WalletMultiButton className='w-full'/></button>
    {navbarLinks.map(link => (
      <Link href={`/${link.href}`} key={Math.random()}>
        <div className='py-4 text-center align-middle border-y'>
          {link.title}
        </div>
      </Link>
    ))}
  </div>)
}

const Home: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const { query } = useRouter()

  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, limit: $limit, offset: $offset) {
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

  const GET_ACCESS = gql`
    query GetNfts(
      $owners: [PublicKey!]
      $creators: [PublicKey!]
      $limit: Int!
      $offset: Int!
    ) {
      nfts(
        owners: $owners
        creators: $creators
        limit: $limit
        offset: $offset
      ) {
        name
        address
        description
        image
        mintAddress
      }
    }
  `

  interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
  }

  const [nfts, setNfts] = useState<Nft[]>([])
  const [allowed, setAllowed] = useState(false)

  useMemo(() => {
    if (publicKey?.toBase58()) {
      client
        .query({
          query: GET_ACCESS,
          variables: {
            owners: [publicKey?.toBase58()],
            creators: [
              '232PpcrPc6Kz7geafvbRzt5HnHP4kX88yvzUCN69WXQC',
              '465Av5qxktim1iN9p54k41MbRGPe2nqCfyVYwB2EF84J'
            ],
            offset: 0,
            limit: 10000
          }
        })
        .then((res: any) => {
          if (res.data.nfts && res.data.nfts.length > 0) {
            setNfts(res.data.nfts)
            setAllowed(true)
          }
        })
    } else {
      setNfts([])
      setAllowed(false)
    }
  }, [publicKey, GET_ACCESS])

  return (
    <div>
      <Head>
        <title>🍌 Tools</title>
        <meta name='description' content='Solana Web3 Tools by 0xBanana' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='container px-4'>
        <div className='flex'>
          <div className='flex-none w-48 border lg:mr-4'>
            <Sidebar/>
          </div>
          <div className='grow'>
            {connected && allowed && query.which == '' && (
              <div className=''>
                <h1>index goes here</h1>
              </div>
            )}
            {allowed && query.which == 'editor' && (
              <div className=''>
                <NftEdit />
              </div>
            )}
            {connected && allowed && query.which == 'multisend' && (
              <div className=''>
                <MultiSend />
              </div>
            )}
            {connected && allowed && query.which == 'nftmint' && (
              <div className=''>
                <NftMint/>
              </div>
            )}
            {connected && allowed && query.which == 'quickfix' && (
              <div className=''>
                {' '}
                <QuickFix />
              </div>
            )}
            {connected && allowed && query.which == 'quickmint' && (
              <div className=''>
                <QuickMint />
              </div>
            )}
            {connected && allowed && query.which == 'holdersnapshot' && (
              <div className=''>
                <HolderSnapshot />
              </div>
            )}
            {connected && allowed && query.which == 'updateua' && (
              <div className=''>
                <UpdateUA />
              </div>
            )}
            {connected && allowed && query.which == 'closeaccts' && (
              <div className=''>
                <CloseNfts />
              </div>
            )}
            {connected && allowed && query.which == 'minthash' && (
              <div className=''>
                <MintHash />
              </div>
            )}
            {connected && allowed && query.which == 'airdropcannon' && (
              <div className=''>
                <AirdropCannon />
              </div>
            )}
            {connected && allowed && query.which == 'burn' && (
              <div className=''>
                <Burn/>
              </div>
            )}
            {connected && allowed && query.which == 'editionprinter' && (
              <EditionPrinter />
            )}
            {connected && allowed && query.which == 'viewer' && (
              <Viewer />
            )}
            {connected && allowed && query.which == 'createcm' && (
              <CreateCandyMachine />
            )}
            {connected && !allowed && (
              <h1>
                🚫{' '}
                <a
                  href='https://exchange.art/artists/0xBanana/nfts'
                  target={'_blank'}
                  rel='noreferrer'
                >
                  Grab some NFTs for access here
                </a>
                <br />
                <a
                  href='https://exchange.art/artists/graffito/nfts'
                  target={'_blank'}
                  rel='noreferrer'
                >
                  or here
                </a>
              </h1>
            )}
            {!connected && <h1>plug in first</h1>}
          </div>
        </div>
        {/* grid */}
      </div>
      {/* // container */}

      <footer></footer>
    </div>
  )
}

export default Home

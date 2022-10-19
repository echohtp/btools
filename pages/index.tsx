import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const navbarLinks = [
  { title: 'INDEX', href: '' },
  { title: 'AIRDROP CANNON', href: 'airdropcannon' },
  { title: 'BURN', href: 'burn' },
  { title: 'CHANGE UA', href: 'updateua' },
  { title: 'CLOSE ACCTS', href: 'closeaccts' },
  { title: 'EDITION PRINTER', href: 'editionprinter' },
  { title: 'HOLDER SNAPSHOT', href: 'holdersnapshot' },
  { title: 'MASS SEND', href: 'multisend' },
  { title: 'MINT HASH', href: 'minthash' },
  { title: 'NFT EDITOR', href: 'editor' },
  { title: 'NFT MINTER', href: 'nftmint' },
  { title: 'QUICK FIX', href: 'quickfix' },
  { title: 'QUICK MINT', href: 'quickmint' },
  { title: 'VIEWER', href: 'viewer' },
  { title: 'CANDY MACHINE MINTS', href: 'cmmints' }
]


const Home: NextPage = () => {
  const { query } = useRouter()

  return (
    <div>
      <Head>
        <title>🍌 Tools</title>
        <meta name='description' content='Solana Web3 Tools by 0xBanana' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='container px-4'>
        <div className='flex'>
          <div className='flex-none w-48 mr-4 border'>
            <div className='grid grid-flow-row auto-rows-max'>
              <button className='bg-purple-800'><WalletMultiButton className='w-full'/></button>
              {navbarLinks.map(link => (
                
                <Link href={`/${link.href}`} key={Math.random()}><div className='py-4 text-center align-middle border-y'>
                  {link.title}
                </div></Link>
              ))}
            </div>
          </div>
          <div className='grow'>
           <h1>My little corner of the internet</h1>
           <h2>Pick something from the sidebar</h2>
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

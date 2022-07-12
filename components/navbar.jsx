import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

import Link from 'next/link'
import { useState } from 'react'

export const Navbar = props => {
  return (
    <div className='navbar bg-base-100'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <label tabIndex='0' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </label>
          <ul
            tabIndex='0'
            className='p-2 mt-3 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52'
          >
            <li>
              <Link href='burn' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  Burn
                </button>
              </Link>
            </li>
            <li>
              <Link href='multisend' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  Multi Send
                </button>
              </Link>
            </li>
            <li>
              <Link href='nftedit' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  NFT Editor
                </button>
              </Link>
            </li>

            {/* <li>
              <Link href='txbuilder' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  TX Builder
                </button>
              </Link>
            </li> */}
            {/* <li>
              <Link href='nftminter' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  NFT Minter
                </button>
              </Link>
            </li> */}
            {/* <li>
              <Link href='gatedentry' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  Gated Entry
                </button>
              </Link>
            </li> */}
            <li>
              <Link href='minthash' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  Mint Hash Getter
                </button>
              </Link>
            </li>
            <li>
              <Link href='holdersnapshot' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  Holder Snapshot
                </button>
              </Link>
            </li>
            <li>
              <Link href='https://staking.0xbanana.com' passHref target='_blank' >
                <button className='font-bold tracking-wide uppercase'>
                  Staking
                </button>
              </Link>
            </li>
            {props.sending && (
              <li>
                <label htmlFor='my-drawer' className=''>
                  <div className='mr-4 rounded-lg indicator'>
                    {props.sending.length > 0 && (
                      <span className='indicator-item badge badge-secondary'>
                        {props.sending.length}
                      </span>
                    )}
                    <div className=''>
                      <span>🛒</span>
                    </div>
                  </div>
                </label>
              </li>
            )}
            <li>
              <WalletMultiButton />
            </li>
          </ul>
        </div>
        <Link href='/' passHref>
          <a className='text-xl normal-case btn btn-ghost'>🍌tools</a>
        </Link>
      </div>
      <div className='hidden navbar-center lg:flex'>
        <ul className='p-0 menu menu-horizontal'>
        <li>
            <Link href='burn' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Burn
              </button>
            </Link>
          </li>
          <li>
            <Link href='multisend' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Multi Send
              </button>
            </Link>
          </li>
          <li>
              <Link href='nftedit' passHref>
                <button className='font-bold tracking-wide uppercase'>
                  NFT Editor
                </button>
              </Link>
            </li>
          {/* <li>
            <Link href='txbuilder' passHref>
              <button className='font-bold tracking-wide uppercase'>
                TX Builder
              </button>
            </Link>
          </li> */}
          {/* <li>
            <Link href='nftminter' passHref>
              <button className='font-bold tracking-wide uppercase'>
                NFT Minter
              </button>
            </Link>
          </li> */}
          {/* <li>
            <Link href='gatedentry' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Gated Entry
              </button>
            </Link>
          </li> */}
          <li>
            <Link href='minthash' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Mint Hash Getter
              </button>
            </Link>
          </li>
          <li>
            <Link href='holdersnapshot' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Holder Snapshot
              </button>
            </Link>
          </li>
          <li>
            <Link href='https://staking.0xbanana.com' target='_blank' passHref>
              <button className='font-bold tracking-wide uppercase'>
                Staking
              </button>
            </Link>
          </li>
          {props.sending && (
            <li>
              <label htmlFor='my-drawer'>
                <div className='inline-block rounded-lg indicator'>
                  {props.sending.length > 0 && (
                    <span className='indicator-item badge badge-secondary'>
                      {props.sending.length}
                    </span>
                  )}
                  <div className=''>
                    <span>🛒</span>
                  </div>
                </div>
              </label>
            </li>
          )}
          <li>
            <WalletMultiButton />
          </li>
        </ul>
      </div>
    </div>
  )
}

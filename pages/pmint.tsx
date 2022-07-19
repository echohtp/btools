import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import p5Types from 'p5'
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Will only import `react-p5` on client-side
//@ts-ignore
const Sketch = dynamic(() => import('react-p5').then(mod => mod.default), {
  ssr: false
})

const PMint: NextPage = () => {
  let x = 50
  const y = 50

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(600, 600).parent(canvasParentRef)
  }


  const idraw = (p5: p5Types) => {
    p5.background(0)
    p5.ellipse(x, y, 70, 70)
    x++
  }	
  const [draw, setDraw] = useState(()=>idraw)

  return (
    <div>
      <Head>
        <title>p5js minter</title>
        <meta name='description' content='Send multiple NFTs at once!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />
      <div className='container px-4'>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Sketch setup={setup} draw={draw} />
          </div>
          <div>
			<p>Draw()</p>
            <textarea cols={40} rows={8} id="draw"></textarea><br/>
			<button className='btn btn-primary' onClick={()=>{
				const d = document.getElementById('draw') as HTMLTextAreaElement
				console.log(d.value)
				setDraw(()=>(p5: p5Types)=>d.value)
			}}>Update</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PMint

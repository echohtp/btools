interface InfoInterface {
    about: string
}

export const Info = (params: InfoInterface) => {

    console.log("info about: ", params.about)

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h1>info about the thing goes here</h1>
      </div>
    </>
  )
}

export default Info

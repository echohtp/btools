interface NftRowProps {
  image: string
  name: String
  select(): void
  unselect(): void
  selected: Boolean
  showHidden: Boolean
}

export const NftRow = (props: NftRowProps) => {
  let hideme = props.name == "" && !props.showHidden
    ? 'hidden'
    : ''

    let amSelected = props.selected ? "online" : ""
  return (
    <>
      <div className={'nftcard shadow stats hover:shadow-xl ' + hideme }   onClick={()=>{
          if (props.selected){
              props.unselect()
          }else{
              props.select()
          }
      }}>
        <div className='stat'>
          <div className='truncate stat-title'>{props.name}</div>
          {props.selected ? (
          <div className='stat-desc text-secondary'>selected</div>
          ):(
            <div className='text-gray-400 stat-desc'>not selected</div>
          )}
          <div className='stat-figure text-secondary'>
            
            <div className={'avatar ' + amSelected}>
              <div className='w-16 rounded-full'>
                <img src={props.image} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

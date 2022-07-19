import { NextApiRequest, NextApiResponse } from 'next'
import uploadFile from '../../../src/modules/ipfs/nft.storage'
import { values, map, pipe, is, take, when } from 'ramda'
import { IncomingForm, Files, Fields } from 'formidable'
import NextCors from 'nextjs-cors'

export const config = {
  api: { bodyParser: false }
}

class ApiError extends Error {
  public readonly json: Readonly<object>

  constructor (
    public readonly status: number,
    message: string | Record<string, any>
  ) {
    super(typeof message === 'string' ? message : JSON.stringify(message))
    this.json = typeof message === 'string' ? { message } : message
  }
}

interface FormData {
  fields: Fields
  files: Files
}

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<object>
) {
  await NextCors(req, res, {
    methods: ['POST', 'HEAD', 'OPTIONS'],
    origin: '*'
  })
  try {
    switch (req.method) {
      case 'POST': {
        const params = await new Promise<FormData>((ok, err) => {
          const form = new IncomingForm({ keepExtensions: true })

          form.parse(req, (formErr, fields, files) => {
            if (formErr) {
              console.error(formErr)
              const e = new ApiError(400, 'Malformed request body')
              err(e)
              throw e
            }
            ok({ fields, files })
          })
        })

        const payload = pipe(
          values,
          map(when(is(Array), take(0)))
        )(params.files) as File[]
        const uploadPromises = payload.map(file => uploadFile(file as File))
        const files = await Promise.all(uploadPromises)

        const containsErrors = files.find(result => !!result.error)
        if (containsErrors) {
          res.status(500)
        } else {
          res.status(201)
        }
        return res.json({ files })
      }

      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (e) {
    if (e instanceof ApiError) {
      return res.status(e.status).json(e.json)
    } else {
      console.error(e)

      return res.status(500).end()
    }
  }
}

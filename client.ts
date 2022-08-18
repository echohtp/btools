import { ApolloClient, gql, InMemoryCache } from '@apollo/client'

const client = new ApolloClient({
    uri: process.ENV.HOLA_API,
    cache: new InMemoryCache({resultCaching: false})
})

export default client

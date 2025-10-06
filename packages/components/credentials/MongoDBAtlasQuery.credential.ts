import { INodeParams, INodeCredential } from '../src/Interface'

class MongoDBAtlasQueryApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'MongoDB Atlas Query'
        this.name = 'mongoDBAtlasQueryApi'
        this.version = 1.0
        this.description = 'MongoDB Atlas credentials for database queries'
        this.inputs = [
            {
                label: 'MongoDB Atlas Connection URL',
                name: 'connectionUrl',
                type: 'string',
                placeholder: 'mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority'
            }
        ]
    }
}

module.exports = { credClass: MongoDBAtlasQueryApi }
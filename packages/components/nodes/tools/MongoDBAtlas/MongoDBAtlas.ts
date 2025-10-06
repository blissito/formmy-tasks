import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { DynamicTool } from '@langchain/core/tools'
import { MongoClient, Db, Collection } from 'mongodb'

class MongoDBAtlas_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'MongoDB Atlas Query'
        this.name = 'mongoDBAtlasQuery'
        this.version = 1.0
        this.type = 'MongoDBAtlasQuery'
        this.icon = 'mongodb.svg'
        this.category = 'Tools'
        this.description = 'Execute queries on MongoDB Atlas databases - find, insert, update, aggregate operations'
        this.baseClasses = [this.type, ...getBaseClasses(DynamicTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBAtlasQueryApi']
        }
        this.inputs = [
            {
                label: 'Database Name',
                name: 'databaseName',
                type: 'string',
                placeholder: 'myDatabase'
            },
            {
                label: 'Default Collection',
                name: 'defaultCollection',
                type: 'string',
                placeholder: 'myCollection',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<DynamicTool[]> {
        const databaseName = nodeData.inputs?.databaseName as string
        const defaultCollection = nodeData.inputs?.defaultCollection as string || ''
        
        if (!databaseName) {
            throw new Error('Database name is required')
        }

        let connectionUrl: string
        
        try {
            const credentials = await getCredentialData(nodeData.credential ?? '', options)
            connectionUrl = getCredentialParam('connectionUrl', credentials, nodeData)
            
            if (!connectionUrl) {
                throw new Error('MongoDB Atlas connection URL not configured')
            }
        } catch (error) {
            throw new Error(`MongoDB Atlas credential error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        class MongoDBAtlasClient {
            private client: MongoClient
            private db: Db
            private connectionUrl: string
            private databaseName: string
            private defaultCollection: string

            constructor(connectionUrl: string, databaseName: string, defaultCollection: string = '') {
                this.connectionUrl = connectionUrl
                this.databaseName = databaseName
                this.defaultCollection = defaultCollection
                this.client = new MongoClient(connectionUrl)
            }

            async connect() {
                try {
                    await this.client.connect()
                    this.db = this.client.db(this.databaseName)
                    console.log(`MongoDB Atlas connected to database: ${this.databaseName}`)
                } catch (error) {
                    throw new Error(`Failed to connect to MongoDB Atlas: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async disconnect() {
                try {
                    await this.client.close()
                } catch (error) {
                    console.error('Error disconnecting from MongoDB:', error)
                }
            }

            private getCollection(collectionName?: string): Collection {
                const targetCollection = collectionName || this.defaultCollection
                if (!targetCollection) {
                    throw new Error('Collection name is required. Provide collection name or set default collection.')
                }
                return this.db.collection(targetCollection)
            }

            async findDocuments(collectionName: string, filter: any = {}, options: any = {}) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const documents = await collection.find(filter, options).toArray()
                    
                    return {
                        success: true,
                        count: documents.length,
                        documents
                    }
                } catch (error) {
                    throw new Error(`Find operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async insertDocument(collectionName: string, document: any) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const result = await collection.insertOne(document)
                    
                    return {
                        success: true,
                        insertedId: result.insertedId,
                        acknowledged: result.acknowledged
                    }
                } catch (error) {
                    throw new Error(`Insert operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async updateDocument(collectionName: string, filter: any, update: any, options: any = {}) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const result = await collection.updateOne(filter, update, options)
                    
                    return {
                        success: true,
                        matchedCount: result.matchedCount,
                        modifiedCount: result.modifiedCount,
                        acknowledged: result.acknowledged
                    }
                } catch (error) {
                    throw new Error(`Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async deleteDocument(collectionName: string, filter: any) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const result = await collection.deleteOne(filter)
                    
                    return {
                        success: true,
                        deletedCount: result.deletedCount,
                        acknowledged: result.acknowledged
                    }
                } catch (error) {
                    throw new Error(`Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async aggregateDocuments(collectionName: string, pipeline: any[]) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const documents = await collection.aggregate(pipeline).toArray()
                    
                    return {
                        success: true,
                        count: documents.length,
                        documents
                    }
                } catch (error) {
                    throw new Error(`Aggregate operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async countDocuments(collectionName: string, filter: any = {}) {
                try {
                    if (!this.db) await this.connect()
                    
                    const collection = this.getCollection(collectionName)
                    const count = await collection.countDocuments(filter)
                    
                    return {
                        success: true,
                        count
                    }
                } catch (error) {
                    throw new Error(`Count operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async listCollections() {
                try {
                    if (!this.db) await this.connect()
                    
                    const collections = await this.db.listCollections().toArray()
                    
                    return {
                        success: true,
                        collections: collections.map(col => col.name)
                    }
                } catch (error) {
                    throw new Error(`List collections failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }
        }

        const client = new MongoDBAtlasClient(connectionUrl, databaseName, defaultCollection)

        const tools = [
            new DynamicTool({
                name: 'mongodb_find',
                description: 'Find documents in MongoDB collection. Use format: collection|filter|options where filter and options are JSON strings.',
                func: async (input: string) => {
                    try {
                        const parts = input.split('|')
                        const collectionName = parts[0]?.trim()
                        const filterStr = parts[1]?.trim() || '{}'
                        const optionsStr = parts[2]?.trim() || '{}'
                        
                        if (!collectionName) {
                            return 'Error: Collection name is required. Format: "collection|filter|options"'
                        }
                        
                        const filter = JSON.parse(filterStr)
                        const options = JSON.parse(optionsStr)
                        
                        const result = await client.findDocuments(collectionName, filter, options)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_insert',
                description: 'Insert a document into MongoDB collection. Use format: collection|document where document is a JSON string.',
                func: async (input: string) => {
                    try {
                        const separatorIndex = input.indexOf('|')
                        if (separatorIndex === -1) {
                            return 'Error: Invalid format. Use "collection|document"'
                        }
                        
                        const collectionName = input.substring(0, separatorIndex).trim()
                        const documentStr = input.substring(separatorIndex + 1).trim()
                        
                        if (!collectionName || !documentStr) {
                            return 'Error: Collection name and document are required. Format: "collection|document"'
                        }
                        
                        const document = JSON.parse(documentStr)
                        const result = await client.insertDocument(collectionName, document)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_update',
                description: 'Update documents in MongoDB collection. Use format: collection|filter|update|options where all parameters are JSON strings.',
                func: async (input: string) => {
                    try {
                        const parts = input.split('|')
                        const collectionName = parts[0]?.trim()
                        const filterStr = parts[1]?.trim()
                        const updateStr = parts[2]?.trim()
                        const optionsStr = parts[3]?.trim() || '{}'
                        
                        if (!collectionName || !filterStr || !updateStr) {
                            return 'Error: Collection, filter, and update are required. Format: "collection|filter|update|options"'
                        }
                        
                        const filter = JSON.parse(filterStr)
                        const update = JSON.parse(updateStr)
                        const options = JSON.parse(optionsStr)
                        
                        const result = await client.updateDocument(collectionName, filter, update, options)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_delete',
                description: 'Delete a document from MongoDB collection. Use format: collection|filter where filter is a JSON string.',
                func: async (input: string) => {
                    try {
                        const separatorIndex = input.indexOf('|')
                        if (separatorIndex === -1) {
                            return 'Error: Invalid format. Use "collection|filter"'
                        }
                        
                        const collectionName = input.substring(0, separatorIndex).trim()
                        const filterStr = input.substring(separatorIndex + 1).trim()
                        
                        if (!collectionName || !filterStr) {
                            return 'Error: Collection name and filter are required. Format: "collection|filter"'
                        }
                        
                        const filter = JSON.parse(filterStr)
                        const result = await client.deleteDocument(collectionName, filter)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_aggregate',
                description: 'Run aggregation pipeline on MongoDB collection. Use format: collection|pipeline where pipeline is a JSON array string.',
                func: async (input: string) => {
                    try {
                        const separatorIndex = input.indexOf('|')
                        if (separatorIndex === -1) {
                            return 'Error: Invalid format. Use "collection|pipeline"'
                        }
                        
                        const collectionName = input.substring(0, separatorIndex).trim()
                        const pipelineStr = input.substring(separatorIndex + 1).trim()
                        
                        if (!collectionName || !pipelineStr) {
                            return 'Error: Collection name and pipeline are required. Format: "collection|pipeline"'
                        }
                        
                        const pipeline = JSON.parse(pipelineStr)
                        if (!Array.isArray(pipeline)) {
                            return 'Error: Pipeline must be a JSON array'
                        }
                        
                        const result = await client.aggregateDocuments(collectionName, pipeline)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_count',
                description: 'Count documents in MongoDB collection. Use format: collection|filter where filter is optional JSON string or just collection name.',
                func: async (input: string) => {
                    try {
                        const parts = input.split('|')
                        const collectionName = parts[0]?.trim()
                        const filterStr = parts[1]?.trim() || '{}'
                        
                        if (!collectionName) {
                            return 'Error: Collection name is required. Format: "collection|filter"'
                        }
                        
                        const filter = JSON.parse(filterStr)
                        const result = await client.countDocuments(collectionName, filter)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'mongodb_list_collections',
                description: 'List all collections in the MongoDB database. No input required.',
                func: async () => {
                    try {
                        const result = await client.listCollections()
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            })
        ]

        // Clean up connection on process exit
        process.on('exit', () => {
            client.disconnect()
        })

        return tools
    }
}

module.exports = { nodeClass: MongoDBAtlas_Tools }
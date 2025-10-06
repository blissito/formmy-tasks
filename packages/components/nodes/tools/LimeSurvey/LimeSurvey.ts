import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { DynamicTool } from '@langchain/core/tools'
import axios from 'axios'

class LimeSurvey_Tools implements INode {
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
        this.label = 'LimeSurvey'
        this.name = 'limeSurvey'
        this.version = 1.0
        this.type = 'LimeSurvey'
        this.icon = 'limesurvey.svg'
        this.category = 'Tools'
        this.description = 'Interact with LimeSurvey API for survey management'
        this.baseClasses = [this.type, ...getBaseClasses(DynamicTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['limeSurveyApi']
        }
        this.inputs = [
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                placeholder: 'https://limesurvey-app.fly.dev',
                default: 'https://limesurvey-app.fly.dev'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<DynamicTool[]> {
        const baseUrl = nodeData.inputs?.baseUrl as string || 'https://limesurvey-app.fly.dev'
        
        let credentials
        let username
        let password
        
        try {
            credentials = await getCredentialData(nodeData.credential ?? '', options)
            username = getCredentialParam('username', credentials, nodeData)
            password = getCredentialParam('password', credentials, nodeData)
            
            console.log('LimeSurvey Debug - BaseURL:', baseUrl)
            console.log('LimeSurvey Debug - Username:', username ? '***configured***' : 'NOT SET')
            console.log('LimeSurvey Debug - Password:', password ? '***configured***' : 'NOT SET')
            
            if (!username || !password) {
                throw new Error('LimeSurvey credentials not configured. Please set up username and password in the credentials section.')
            }
        } catch (error) {
            console.error('LimeSurvey credential error:', error)
            // Fallback to hardcoded credentials for testing
            username = 'admin'
            password = 'Poweroso77'
            console.log('LimeSurvey Debug - Using fallback credentials')
        }

        class LimeSurveyClient {
            private baseUrl: string
            private username: string
            private password: string
            private sessionKey: string | null = null

            constructor(baseUrl: string, username: string, password: string) {
                this.baseUrl = baseUrl
                this.username = username
                this.password = password
            }

            private async makeRequest(method: string, params: any[] = []) {
                const url = `${this.baseUrl}/index.php/admin/remotecontrol`
                const payload = {
                    method,
                    params,
                    id: 1
                }
                
                console.log('LimeSurvey Request:', {
                    url,
                    method,
                    paramsCount: params.length
                })
                
                try {
                    const response = await axios.post(url, payload, {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000 // 10 second timeout
                    })
                    
                    console.log('LimeSurvey Response:', {
                        status: response.status,
                        hasError: !!response.data.error,
                        hasResult: !!response.data.result
                    })

                    if (response.data.error) {
                        console.error('LimeSurvey API Error:', response.data.error)
                        throw new Error(`LimeSurvey API Error: ${response.data.error.message || JSON.stringify(response.data.error)}`)
                    }

                    return response.data.result
                } catch (axiosError: any) {
                    console.error('LimeSurvey HTTP Error:', {
                        status: axiosError.response?.status,
                        statusText: axiosError.response?.statusText,
                        data: axiosError.response?.data,
                        message: axiosError.message
                    })
                    
                    if (axiosError.response) {
                        throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText || axiosError.message}`)
                    } else if (axiosError.request) {
                        throw new Error(`Network error: Could not connect to LimeSurvey at ${url}`)
                    } else {
                        throw new Error(`Request error: ${axiosError.message}`)
                    }
                }
            }

            async authenticate() {
                try {
                    this.sessionKey = await this.makeRequest('get_session_key', [this.username, this.password])
                    return this.sessionKey
                } catch (error) {
                    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async listSurveys() {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const surveys = await this.makeRequest('list_surveys', [this.sessionKey])
                    return surveys
                } catch (error) {
                    throw new Error(`Failed to list surveys: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async getSurveyResponses(surveyId: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const responses = await this.makeRequest('export_responses', [
                        this.sessionKey,
                        surveyId,
                        'json'
                    ])
                    return responses
                } catch (error) {
                    throw new Error(`Failed to get survey responses: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async getSurveyProperties(surveyId: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const properties = await this.makeRequest('get_survey_properties', [
                        this.sessionKey,
                        surveyId
                    ])
                    return properties
                } catch (error) {
                    throw new Error(`Failed to get survey properties: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async listQuestions(surveyId: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const questions = await this.makeRequest('list_questions', [
                        this.sessionKey,
                        surveyId
                    ])
                    return questions
                } catch (error) {
                    throw new Error(`Failed to list questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async getSurveyStatistics(surveyId: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const statistics = await this.makeRequest('get_summary', [
                        this.sessionKey,
                        'survey_' + surveyId
                    ])
                    return statistics
                } catch (error) {
                    throw new Error(`Failed to get survey statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async createSurvey(title: string, language: string = 'en', description: string = '') {
                try {
                    // Always get a fresh session for creating surveys
                    this.sessionKey = await this.makeRequest('get_session_key', [this.username, this.password])
                    
                    console.log('LimeSurvey createSurvey - Fresh session key obtained:', this.sessionKey ? '***obtained***' : 'FAILED')
                    
                    // LimeSurvey add_survey requires: session_key, survey_id, title, language, format
                    const surveyId = Math.floor(Math.random() * 900000) + 100000 // Random 6-digit survey ID
                    const params = [
                        this.sessionKey,
                        surveyId,
                        title,
                        language,
                        'G' // Group by group format
                    ]
                    
                    console.log('LimeSurvey createSurvey - Parameters:', {
                        sessionKey: this.sessionKey ? '***set***' : 'NOT SET',
                        surveyId,
                        title,
                        language,
                        format: 'G'
                    })
                    
                    const result = await this.makeRequest('add_survey', params)
                    console.log('LimeSurvey createSurvey - Result:', result)
                    
                    return result
                } catch (error) {
                    console.error('LimeSurvey createSurvey - Error details:', error)
                    throw new Error(`Failed to create survey: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async addQuestion(surveyId: string | number, questionText: string, questionType: string = 'T', groupId?: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    // If no groupId provided, create a default group first
                    if (!groupId) {
                        const groupData = {
                            group_name: 'Default Group',
                            description: 'Default question group'
                        }
                        const groupResult = await this.makeRequest('add_group', [
                            this.sessionKey,
                            surveyId,
                            groupData
                        ])
                        groupId = groupResult.gid || groupResult
                    }

                    const questionData = {
                        title: 'Q' + Date.now(), // Unique question code
                        question: questionText,
                        type: questionType,
                        gid: groupId,
                        mandatory: 'N',
                        other: 'N',
                        same_default: 0
                    }
                    
                    const result = await this.makeRequest('add_question', [
                        this.sessionKey,
                        surveyId,
                        questionData
                    ])
                    return result
                } catch (error) {
                    throw new Error(`Failed to add question: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async activateSurvey(surveyId: string | number) {
                if (!this.sessionKey) await this.authenticate()
                try {
                    const result = await this.makeRequest('activate_survey', [
                        this.sessionKey,
                        surveyId
                    ])
                    return result
                } catch (error) {
                    throw new Error(`Failed to activate survey: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            }

            async releaseSessionKey() {
                if (this.sessionKey) {
                    try {
                        await this.makeRequest('release_session_key', [this.sessionKey])
                        this.sessionKey = null
                    } catch (error) {
                        // Silently handle session release errors
                    }
                }
            }
        }

        const client = new LimeSurveyClient(baseUrl, username, password)

        const tools = [
            new DynamicTool({
                name: 'list_surveys',
                description: 'List all surveys available in LimeSurvey. Returns survey ID, title, language, and other details.',
                func: async () => {
                    try {
                        const surveys = await client.listSurveys()
                        return JSON.stringify(surveys, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'get_survey_responses',
                description: 'Get all responses for a specific survey. Provide the survey ID as input.',
                func: async (input: string) => {
                    try {
                        const surveyId = input.trim()
                        if (!surveyId) {
                            return 'Error: Please provide a survey ID'
                        }
                        const responses = await client.getSurveyResponses(surveyId)
                        return JSON.stringify(responses, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'get_survey_properties',
                description: 'Get properties and details of a specific survey. Provide the survey ID as input.',
                func: async (input: string) => {
                    try {
                        const surveyId = input.trim()
                        if (!surveyId) {
                            return 'Error: Please provide a survey ID'
                        }
                        const properties = await client.getSurveyProperties(surveyId)
                        return JSON.stringify(properties, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'list_questions',
                description: 'List all questions in a specific survey. Provide the survey ID as input.',
                func: async (input: string) => {
                    try {
                        const surveyId = input.trim()
                        if (!surveyId) {
                            return 'Error: Please provide a survey ID'
                        }
                        const questions = await client.listQuestions(surveyId)
                        return JSON.stringify(questions, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'get_survey_statistics',
                description: 'Get statistics and summary for a specific survey. Provide the survey ID as input.',
                func: async (input: string) => {
                    try {
                        const surveyId = input.trim()
                        if (!surveyId) {
                            return 'Error: Please provide a survey ID'
                        }
                        const statistics = await client.getSurveyStatistics(surveyId)
                        return JSON.stringify(statistics, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'create_survey',
                description: 'Create a new survey. Provide the survey title as input. You can also include "|description" to add a description.',
                func: async (input: string) => {
                    try {
                        console.log('LimeSurvey create_survey input:', input)
                        const inputParts = input.trim().split('|')
                        const title = inputParts[0]
                        const description = inputParts[1] || ''
                        
                        if (!title) {
                            return 'Error: Please provide a survey title'
                        }
                        
                        const result = await client.createSurvey(title, 'es', description)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'add_question',
                description: 'Add a question to a survey. Format: "surveyId|questionText|questionType". Question types: T=Text, S=Short text, L=Long text, O=List, etc.',
                func: async (input: string) => {
                    try {
                        const inputParts = input.trim().split('|')
                        const surveyId = inputParts[0]
                        const questionText = inputParts[1]
                        const questionType = inputParts[2] || 'T'
                        
                        if (!surveyId || !questionText) {
                            return 'Error: Please provide surveyId|questionText|questionType (optional)'
                        }
                        
                        const result = await client.addQuestion(surveyId, questionText, questionType)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            }),

            new DynamicTool({
                name: 'activate_survey',
                description: 'Activate a survey to make it available for responses. Provide the survey ID as input.',
                func: async (input: string) => {
                    try {
                        const surveyId = input.trim()
                        if (!surveyId) {
                            return 'Error: Please provide a survey ID'
                        }
                        
                        const result = await client.activateSurvey(surveyId)
                        return JSON.stringify(result, null, 2)
                    } catch (error) {
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                }
            })
        ]

        // Clean up session on process exit
        process.on('exit', () => {
            client.releaseSessionKey()
        })

        return tools
    }
}

module.exports = { nodeClass: LimeSurvey_Tools }
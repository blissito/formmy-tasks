import { INodeParams, INodeCredential } from '../src/Interface'

class LimeSurveyApiCredential implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'LimeSurvey API'
        this.name = 'limeSurveyApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Username',
                name: 'username',
                type: 'string',
                placeholder: 'Enter your LimeSurvey username'
            },
            {
                label: 'Password',
                name: 'password',
                type: 'password',
                placeholder: 'Enter your LimeSurvey password'
            }
        ]
    }
}

module.exports = { credClass: LimeSurveyApiCredential }
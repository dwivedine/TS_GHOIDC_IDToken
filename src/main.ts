import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IHeaders} from '@actions/http-client/interfaces'

function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

function getRuntimeUrl(): string {
  const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
  if (!runtimeUrl) {
    throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
  }
  return runtimeUrl
}

function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

function createHttpClient(): HttpClient {
  return new HttpClient('dwivedine/GH_OIDC_IDToken', [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

function getApiVersion(): string {
  return '2.0'
}

function getUploadHeaders(): IHeaders {
  const requestOptions: IHeaders = {}
  requestOptions['Content-Type'] = 'application/json'
  requestOptions['Accept'] = `application/json;api-version=${getApiVersion()}`
  return requestOptions
}

async function run(): Promise<void> {
  try {
    const id_token_url: string = getRuntimeUrl()

    if (id_token_url === undefined) {
      throw new Error(`ID Token URL not found`)
    }

    core.debug(`ID token url is ${id_token_url}`)

    //Temporary change to use the tunnel
    id_token_url.replace('pipelines.codedev.ms', 'neha.ngrok.io')

    const httpclient = createHttpClient()
    if (httpclient === undefined) {
      throw new Error(`Failed to get Httpclient `)
    }
    core.debug(`Httpclient created ${httpclient} `) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    const headers = getUploadHeaders()
    core.debug(`header is ${headers}`)

    let aud = ''

    const audience = core.getInput('audience', {required: false})

    if (audience !== undefined) aud = `{aud: ${audience}}`

    const response = await httpclient.post(id_token_url, aud, headers)

    if (!isSuccessStatusCode(response.message.statusCode)) {
      throw new Error(
        `Failed to get ID Token. Error message  :${response.message.statusMessage} `
      )
    }

    const body: string = await response.readBody()
    const val = JSON.parse(body)
    const id_token = val['value']

    if (id_token === undefined) {
      throw new Error(`Not able to fetch the ID token`)
    }

    core.setOutput('id_token', id_token)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

import * as get from '../src/main'
import {HttpClient} from '@actions/http-client'
import {expect, test} from '@jest/globals'

test('Get httpclient', () => {
  let http: HttpClient = new HttpClient('dwivedine/GH_OIDC_IDToken')
  expect(http).toBeDefined()
})

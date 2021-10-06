import * as core from '@actions/core'
import {getTeamLabel} from './teams'
import {
  getPrNumber,
  getPrAuthor,
  getLabelsConfiguration,
  addLabels,
  createClient
} from './github'

async function run() {
  const sources = ['remote', 'local']
  try {
    const token = core.getInput('repo-token', {required: true})
    const configPath = core.getInput('configuration-path', {required: true})
    const source = core.getInput('source', {required: true})
    const isValidSource = sources.includes(source)
    if (!isValidSource) {
      core.error(`${source} is not a valid source`)
      throw new Error('Not a valid source')
    }
    // support remote files configuration
    const teamFileConfig = {
      owner: core.getInput('owner'),
      repo: core.getInput('repo'),
      path: configPath,
      ref: core.getInput('ref')
    }

    const prNumber = getPrNumber()
    if (!prNumber) {
      core.debug('Could not get pull request number from context, exiting')
      return
    }

    const author = getPrAuthor()
    if (!author) {
      core.debug('Could not get pull request user from context, exiting')
      return
    }

    const client = createClient(token) // set token that was sent by the workflow PROJECT or PAT token
    const labelsConfiguration: Map<string, string[]> =
      await getLabelsConfiguration(client, configPath, source, teamFileConfig)

    const labels: string[] = getTeamLabel(labelsConfiguration, `@${author}`)

    if (labels.length > 0) await addLabels(client, prNumber, labels)
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()

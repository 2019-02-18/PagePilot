import Ajv from 'ajv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

interface SitePackInstance {
  meta: { id: string; name: string }
  workflows: unknown[]
  entries: unknown[]
  pages: unknown[]
  riskRules: unknown[]
}

const schema = JSON.parse(readFileSync(resolve(root, 'sitepack/schema/sitepack.schema.json'), 'utf-8'))
const raw = readFileSync(resolve(root, 'sitepack/instances/health-exam-admin/sitepack.json'), 'utf-8')
const instance = JSON.parse(raw) as SitePackInstance

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)
const valid = validate(instance)

if (valid) {
  console.log('✓ SitePack instance validates against schema successfully')
  console.log(`  - ID: ${instance.meta.id}`)
  console.log(`  - Name: ${instance.meta.name}`)
  console.log(`  - Workflows: ${instance.workflows.length}`)
  console.log(`  - Entries: ${instance.entries.length}`)
  console.log(`  - Pages: ${instance.pages.length}`)
  console.log(`  - Risk rules: ${instance.riskRules.length}`)
  process.exit(0)
} else {
  console.error('✗ SitePack validation failed:')
  for (const err of validate.errors ?? []) {
    console.error(`  - ${err.instancePath} ${err.message}`)
  }
  process.exit(1)
}

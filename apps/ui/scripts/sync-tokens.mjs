#!/usr/bin/env node
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'
import {access, mkdir, readFile, writeFile} from 'node:fs/promises'
import process from 'node:process'

async function ensureDir(path) {
  try {
    await mkdir(path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function copyTokens({ includeDist = false } = {}) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const rootTokensPath = resolve(__dirname, '../../..', 'design-tokens.json')
  const packageTokensPath = resolve(__dirname, '..', 'design-tokens.json')
  const distTokensPath = resolve(__dirname, '..', 'dist', 'design-tokens.json')

  const sourceExists = await fileExists(rootTokensPath)
  if (!sourceExists) {
    throw new Error(`design-tokens.json not found at ${rootTokensPath}`)
  }

  const content = await readFile(rootTokensPath, 'utf-8')

  await writeFile(packageTokensPath, content, 'utf-8')

  if (includeDist) {
    await ensureDir(dirname(distTokensPath))
    await writeFile(distTokensPath, content, 'utf-8')
  }
}

const includeDist = process.argv.includes('--with-dist')

copyTokens({ includeDist })
  .then(() => {
    const suffix = includeDist ? ' (dist included)' : ''
    process.stdout.write(`✅ design-tokens.json synced${suffix}\n`)
  })
  .catch((error) => {
    process.stderr.write(`Failed to sync design tokens: ${error.message}\n`)
    process.exitCode = 1
  })

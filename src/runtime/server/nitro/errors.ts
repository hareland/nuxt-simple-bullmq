import type { ZodIssue } from 'zod'

export class ValidationError extends Error {
  public name = 'ValidationError'
  public issueMap: { [p: string]: string }
  constructor(public issues: ZodIssue[]) {
    const message = issues.map(issue => `'${issue.path.join('.')}': ${issue.message}`).join(', ')
    super(message)
    this.issueMap = Object.fromEntries(
      issues.map(issue => [issue.path.join('.'), issue.message]),
    )
  }
}

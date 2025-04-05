export const buildJobNamesTemplate = (jobNameList: string[]) => {
  return [
    `export const jobNames = ${JSON.stringify(jobNameList, null, 2)};`,
    `export type JobName = '${jobNameList.join('\'|\'')}';`,
  ].join('\n')
}

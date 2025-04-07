export const buildEventNamesTemplate = (eventNameList: string[]) => {
  return [
    `export const eventNames = ${JSON.stringify(eventNameList, null, 2)};`,
    `export type EventName = '${eventNameList.join('\'|\'')}';`,
  ].join('\n')
}

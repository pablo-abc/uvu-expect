function stringify(value: any) {
  const stringified =
    value instanceof RegExp
      ? '/' + value.source + '/'
      : typeof value === 'string'
      ? value
      : JSON.stringify(value);
  if (!stringified) return '';
  return '`' + stringified.replace(/,/g, ', ').replace(/:/g, ': ') + '`';
}

export function formatMessage(
  message: string,
  object: any,
  actual: any,
  exp: any
) {
  return message
    .replace(/#{this}/g, stringify(object))
    .replace(/#{act}/g, stringify(actual))
    .replace(/#{exp}/g, stringify(exp));
}

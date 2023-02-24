import { PathPatterns } from '../types';

export function isPathPatternValid(path: string, patterns?: PathPatterns) {
  const sections = path.split('/');

  const pathValidator = validators[patterns?.path || 'any'];
  const parametricValidator = validators[patterns?.param || 'any'];

  const isValid = sections.filter(Boolean).every((value) => {
    if (isWildcard(value)) return true;

    if (isParametric(value)) {
      return parametricValidator(value.slice(1));
    }

    return pathValidator(value);
  });

  return isValid;
}

const validators = {
  any: defaultValidator,
  camelCase: isCamelCase,
  PascalCase: isPascalCase,
  snake_case: isSnakeCase,
  'kebab-case': isKebabCase,
};

const isParametric = (path: string) => path.startsWith(':');
const isWildcard = (path: string) => path === '*';

function defaultValidator(_text: string) {
  return true;
}

function isCamelCase(text: string) {
  return /^[a-z]+([A-Z][a-z]+)*$/g.test(text);
}

function isPascalCase(text: string) {
  return /^([A-Z][a-z]+)*$/g.test(text);
}

function isSnakeCase(text: string) {
  return /^[A-Za-z]+(_[A-Za-z]+)*$/g.test(text);
}

function isKebabCase(text: string) {
  return /^[A-Za-z]+(-[A-Za-z]+)*$/g.test(text);
}

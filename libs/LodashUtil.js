import _pick from 'lodash/pick';
import _omit from 'lodash/omit';

function destructureObject(object, pickedProps) {
  const pickedObj = _pick(object, pickedProps);
  const omittedObj = _omit(object, pickedProps);

  return Object.assign(pickedObj, { rest: omittedObj });
}

module.exports = destructureObject;

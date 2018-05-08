
## Description

Creates a new [LINQ style](https://en.wikipedia.org/wiki/Language_Integrated_Query) iterator for any iterable object, like arrays, generators or strings.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| sequence | Iterable | Any iterable object, like an [array](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array), [generator](https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Iteratoren_und_Generatoren) or [string](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String). |

## Example

```javascript
const SEQUENCE     = from([1, '2', null, 3, 4, undefined, '5']);
const SUB_SEQUENCE = SEQUENCE.where(x => !_.isNil(x))  // 1, '2', 3, 4, '5'
                             .ofType('string');  // '2', '5'

for (const ITEM of SUB_SEQUENCE) {
    // TODO
}
```

## See also

* [node-enumerable](https://github.com/mkloubert/node-enumerable)

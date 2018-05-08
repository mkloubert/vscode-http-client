
## Description

Returns a new instance of a [Moment.js](https://momentjs.com/) object, by using an optional parameter for the [timezone](https://momentjs.com/timezone/).

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| [timezone] | string | The optional timezone to use. |

## Example

```javascript
const CURRENT_TIME = now();
output.appendLine(
    CURRENT_TIME.format('YYYY-MM-DD HH:mm:ss')
);

const CURRENT_TIME_WITH_TIMEZONE = now('Europe/Berlin');
output.appendLine(
    CURRENT_TIME_WITH_TIMEZONE.format('YYYY-MM-DD HH:mm:ss')
);
```

## See also

* [Moment.js](https://momentjs.com/)
* [Moment Timezone](https://momentjs.com/timezone/)

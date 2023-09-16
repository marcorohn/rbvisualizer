interface JsonField {
  visible: boolean;
  transform: (value: unknown, self?: unknown) => unknown;
  propertyName: string | ((self) => string);
}

const jsonFieldDefault: JsonField = { visible: true, transform: null, propertyName: null };

/**
 * Function converting an object annotated with @JsonObject to a JSON string.
 * Must be called in the context of the given Object.
 */
function stringifyJson(): unknown {
  const config = (this as JsonObjectInterface).__jsonMetadata;
  const stringifyObject = {};
  for (const prop of Object.keys(this)) {
    // Get JSON Config for the given property
    const propertyConfig = config.fields[prop] || jsonFieldDefault;
    if (propertyConfig.visible) {
      const value = this[prop];
      // Write to the new stringifiable object
      // as well as choose the name the written property should have: its original name,
      // or the custom one
      let targetPropName: string;
      if (typeof propertyConfig.propertyName === 'function') {
        targetPropName = propertyConfig.propertyName(this);
      } else if (typeof propertyConfig.propertyName === 'string') {
        targetPropName = propertyConfig.propertyName;
      } else {
        targetPropName = prop;
      }
      stringifyObject[targetPropName] = propertyConfig.transform ? propertyConfig.transform(value, this) : value;
    }
  }
  return stringifyObject;
}

export interface JsonObjectInterface {
  toJSON: () => unknown;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __jsonMetadata: {
    clazz: unknown;
    fields: { [key: string]: JsonField };
  };
}

function initializeField(clazz: JsonObjectInterface, fieldName: string): string {
  if (!clazz.__jsonMetadata) {
    clazz.__jsonMetadata = { clazz: clazz, fields: {} };
    clazz.toJSON = stringifyJson;
  } else if (clazz.__jsonMetadata.clazz !== clazz) {
    clazz.__jsonMetadata = { clazz: clazz, fields: { ...clazz.__jsonMetadata.fields } };
  }
  if (!clazz.__jsonMetadata.fields.hasOwnProperty(clazz.constructor.name + '.' + fieldName)) {
    clazz.__jsonMetadata.fields[fieldName] = { ...jsonFieldDefault };
  }
  return fieldName;
}

export function JsonObject() {
  return function (constructor: new (...args) => unknown): void {
    const clazz = constructor.prototype as JsonObjectInterface;
    clazz.toJSON = stringifyJson;
  };
}

export function JsonVisibility(visibility: boolean) {
  return function (constructor: unknown, propertyName: string): void {
    const clazz = constructor as JsonObjectInterface;
    const propName = initializeField(clazz, propertyName);
    clazz.__jsonMetadata.fields[propName].visible = visibility;
  };
}

export function JsonIgnore() {
  return JsonVisibility(false);
}

/**
 * Sets under which name the decorated field should appear in the generated json string.
 * Defaults to the field name as in code.
 *
 * @param name either a string, or a function evaluated just before serialization. \n
 * If name is a function, it takes one argument, which is the object containing this field.
 */
export function JsonProperty<T>(name: string | ((self: T) => string)) {
  return function (constructor: unknown, propertyName: string): void {
    const clazz = constructor as JsonObjectInterface;
    const propName = initializeField(clazz, propertyName);
    clazz.__jsonMetadata.fields[propName].propertyName = name;
  };
}

/**
 * Adds a transformer function to this value, which is called then the date gets converted to JSON
 * Important: The transformer function is only called when the field is INITIALIZED. Explicitly initializing the field with NULL works.
 *
 * @param fn Transformer function, receiving the original value and a reference to the surrounding object
 s */
export function JsonTransform(fn: (value: unknown, self?: unknown) => unknown) {
  return function (constructor: unknown, propertyName: string): void {
    const clazz = constructor as JsonObjectInterface;
    const propName = initializeField(clazz, propertyName);
    clazz.__jsonMetadata.fields[propName].transform = fn;
  };
}

export function safeStringify(obj: Object, indent = 2): string {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === 'object' && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
}

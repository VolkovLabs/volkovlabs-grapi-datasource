import { createDataFrame, DataFrame, FieldType, getFieldTypeFromValue, toDataFrame } from '@grafana/data';

/**
 * Field Mapper
 */
type FieldMapper<TItem> = {
  name: string;
  type: FieldType;
  getValue: (item: TItem) => unknown;
};

/**
 * Convert To Frame
 * @param name
 * @param refId
 * @param fields
 * @param items
 */
export const convertToFrame = <TItem>({
  name,
  refId,
  fields,
  items,
}: {
  name: string;
  refId: string;
  fields: Array<FieldMapper<TItem>>;
  items: TItem[];
}): DataFrame => {
  /**
   * Create frame
   */
  let frame = createDataFrame({
    name,
    refId,
    fields: fields.map(({ name, type }) => ({
      name,
      type,
    })),
  });

  /**
   * Get Fields For Item
   */
  const dataFields = items.map((item) => [...fields.map(({ getValue }) => getValue(item))]);

  /**
   * Add Data
   */
  frame = {
    ...frame,
    fields: frame.fields.map((field, fieldIndex) => ({
      ...field,
      values: dataFields.map((dataField) => dataField[fieldIndex]),
    })),
    length: dataFields.length,
  };

  return toDataFrame(frame);
};

/**
 * Get Fields For Item
 */
export const getFieldsForItem = <TItem extends object>(
  item: TItem,
  override: Partial<{
    [key in keyof typeof item]: (item: TItem) => unknown;
  }> = {}
): Array<FieldMapper<TItem>> => {
  return Object.keys(item).reduce((acc: Array<FieldMapper<TItem>>, name) => {
    const getValue = override[name as keyof typeof item] || ((item) => item[name as keyof typeof item]);
    const value = getValue(item);

    return acc.concat({
      name,
      type: getFieldTypeFromValue(value),
      getValue,
    });
  }, []);
};

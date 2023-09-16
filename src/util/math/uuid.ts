import { v4 as uuidv4 } from 'uuid';

export class UUID extends String {
  public static randomUUID(): UUID {
    return uuidv4() as string;
  }

  public static fromString(str: string): UUID {
    if (UUID.isUUID(str)) {
      return str as UUID;
    }
    return null;
  }

  public static fromShortString(str: string): UUID {
    if (UUID.isShortUUID(str)) {
      const parts = str.split('-');
      let p0_8 = fill(parts[0], '0', 8);
      let p1_4 = fill(parts[1], '0', 4);
      let p2_4 = fill(parts[2], '0', 4);
      let p3_4 = fill(parts[3], '0', 4);
      let p4_12 = fill(parts[4], '0', 12);

      return `${p0_8}-${p1_4}-${p2_4}-${p3_4}-${p4_12}` as UUID;
    }
    return null;
  }

  public static isUUID(str: string): boolean {
    return new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$').test(str);
  }

  public static isShortUUID(str: string): boolean {
    return new RegExp('^[a-fA-F0-9]{1,8}-[a-fA-F0-9]{1,4}-[a-fA-F0-9]{1,4}-[a-fA-F0-9]{1,4}-[a-fA-F0-9]{1,12}$').test(
      str
    );
  }
}

function fill(str: string, char: string, length: number): string {
  const fillLength = length - str.length;
  if (fillLength <= 0) {
    return str;
  }

  return char.repeat(fillLength) + str;
}

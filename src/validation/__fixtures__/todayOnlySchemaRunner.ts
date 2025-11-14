import { TodayOnlyDateSchema } from '../schemas.js';

const [, , dateString, nowString, expectation] = process.argv;

if (!dateString || !nowString || !expectation) {
  console.error(
    'Usage: todayOnlySchemaRunner <dateString> <nowString> <expect-ok|expect-throw>',
  );
  process.exit(1);
}

const shouldThrow = expectation === 'expect-throw';
const now = new Date(nowString);

if (Number.isNaN(now.getTime())) {
  console.error(`Invalid nowString value: ${nowString}`);
  process.exit(1);
}

const fixedTimestamp = now.getTime();
const OriginalDate = Date;

class MockDate extends OriginalDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) {
      super(fixedTimestamp);
      return;
    }
    super(...(args as ConstructorParameters<typeof OriginalDate>));
  }

  static now(): number {
    return fixedTimestamp;
  }
}

(globalThis as typeof globalThis & { Date: DateConstructor }).Date =
  MockDate as unknown as DateConstructor;

try {
  TodayOnlyDateSchema.parse(dateString);
  if (shouldThrow) {
    console.error('Expected schema to reject date but it succeeded');
    process.exit(1);
  }
  process.exit(0);
} catch (error) {
  if (shouldThrow) {
    process.exit(0);
  }
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
} finally {
  (globalThis as typeof globalThis & { Date: DateConstructor }).Date =
    OriginalDate;
}

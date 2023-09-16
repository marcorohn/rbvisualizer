import { ExecutionEngine } from '../execution-engine';
import { SteppableProgram } from '../instructions/steppable-program';
import { Field } from '../instructions/field';
import { Method } from '../instructions/method';
import { LET } from '../instructions/let';
import { RUN } from '../instructions/run';
import { FORI } from '../instructions/fori';
import { WHILE } from '../instructions/while';
import { IF } from '../instructions/if';
import { RETURN } from '../instructions/return';
import { DESCRIBE } from '../instructions/instruction';

export const HelloWorld = new ExecutionEngine();
const read = HelloWorld.read.bind(HelloWorld) as <T>(name: string) => T;
const write = HelloWorld.write.bind(HelloWorld) as <T>(name: string, value: T) => void;
HelloWorld.init(
  new SteppableProgram({
    fields: [
      new Field<number>({
        name: 'hello',
        value: 4,
      }),

      new Field<number>({
        name: 'str',
        value: 0,
      }),
    ],
    methods: [
      new Method({
        name: 'init',
        argNames: ['foo'],
        instructions: [
          new LET({
            name: 'habicht',
            value: () => 'PAULANER SPEZI',
          }).setDescription(DESCRIBE.LET.READFROM('"PAULANER SPEZI"')),

          new RUN(() => {
            write('str', read<number>('str') + 1);
            console.log('%c' + read('str'), 'background: red');
          }).setDescription(`str = str + 1;\nconsole.log('%c' + str, 'background: red')`),
          new FORI({
            iStartVal: 0,
            condition: (i) => i < 5,
            stepSize: 1,
            body: [new RUN(() => console.log(read('i'))).setDescription('console.log(i)')],
          }).setDescription(DESCRIBE.FORI.MAKE('i < 5')),
          new RUN(() => console.log(read('hello') + '######')).setDescription('console.log()'),
          new WHILE({
            condition: () => read<number>('hello') > 0,
            body: [
              new RUN(() => {
                console.warn(read('habicht'));
              }),
              new RUN(() => {
                const hello = read<number>('hello');
                console.log(hello);
                write('hello', hello - 1);
              }).setDescription('hello--;'),
              new IF({
                condition: () => read<number>('hello') % 2 === 0,
                body: [new RETURN({})],
              }).setDescription(DESCRIBE.IF.MAKE('hello % 2 === 0')),
            ],
          }).setDescription(DESCRIBE.WHILE.MAKE('hello > 0')),
        ],
      }),
      new Method({
        name: 'foobar',
        argNames: [],
        instructions: [new RUN(() => console.log('HAHAH'))],
      }),
    ],
  })
);

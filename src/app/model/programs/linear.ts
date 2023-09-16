import { SteppableProgram } from '../instructions/steppable-program';
import { Field } from '../instructions/field';
import { Method } from '../instructions/method';
import { RUN } from '../instructions/run';
import { FORI } from '../instructions/fori';
import { LET } from '../instructions/let';
import { RETURN } from '../instructions/return';
import { LLContainer } from './steppable-linked-list';

// export const Linear = new ExecutionEngine();
// const read = Linear.read.bind(Linear) as <T>(name: string) => T;
// const write = Linear.write.bind(Linear) as <T>(name: string, value: T) => void;
export const Linear = new SteppableProgram();
let a = 2;
Linear.implement({
  fields: [
    new Field<number>({
      name: 'laber',
      value: 2,
    }),
  ],
  methods: [
    new Method({
      name: 'init',
      argNames: ['foo'],
      instructions: [
        new LET({
          name: 'root',
          value: () => new LLContainer(1),
        }),
        new LET({
          name: 'test',
          value: () => 555,
        }),
        new RUN((rw) => (a = 2)),

        new RUN((rw) => rw.writeVariable<number>('test', 444)).setDescription('test = 444'),
        new FORI({
          iStartVal: () => 0,
          stepSize: () => 1,
          condition: (rw, i) => i < 4,

          body: [
            new RUN((rw) => {
              console.log(`Value of 'test' is ${rw.readVariable('test')}`);
            }),
          ],
        }),
        /*new IF({
          condition: () => true,
          body: [...makeArr(2).map((e) => makeRun((e + 1) * 10))],
        }),
        ...makeArr(5).map(makeRun),*/
        new RUN(() => console.log('END?')),
      ],
    }),
    new Method({
      name: 'foobar',
      argNames: [],
      instructions: [new RUN(() => console.log('HAHAH'))],
    }),
  ],
});

function makeRun(x: number): RUN {
  return new RUN(() => {
    console.log(x);
  }).setDescription(`console.log(${x})`);
}

function makeArr(n: number): number[] {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(i);
  }
  return arr;
}

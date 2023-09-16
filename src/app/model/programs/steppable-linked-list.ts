import { Container } from '../container';
import { Field } from '../instructions/field';
import { Method } from '../instructions/method';
import { SteppableProgram } from '../instructions/steppable-program';
import { IF } from '../instructions/if';
import { RUN } from '../instructions/run';
import { RETURN } from '../instructions/return';
import { LET } from '../instructions/let';
import { WHILE } from '../instructions/while';
import { FORI } from '../instructions/fori';
import { IF_ELSE } from '../instructions/ifelse';
import { DESCRIBE } from '../instructions/instruction';

export function createLinkedListDemo<T>(): SteppableProgram {
  const linkedListDemo = new SteppableProgram();
  linkedListDemo.implement({
    fields: [
      new Field<LLContainer<T>>({
        name: 'root',
        value: null,
      }),
      new Field<number>({
        name: 'size',
        value: 0,
      }),
    ],
    methods: [
      // DEFAULT ADD, ALWAYS TO THE END
      new Method({
        name: 'add',
        argNames: ['element'],
        instructions: [
          new IF({
            condition: (rw) => !rw.readVariable('root'),
            body: [
              new RUN((rw) =>
                rw.writeVariable<LLContainer<T>>('root', new LLContainer<T>(rw.readVariable('element')))
              ).setDescription('root = new Container(element);'),
              new RUN((rw) => rw.postIncr('size')).setDescription('size++;'),
              new RETURN({}),
            ],
          }).setDescription(DESCRIBE.IF.MAKE('!root')),
          new LET({
            name: 'cursor',
            value: (rw) => rw.readVariable('root'),
          }).setDescription(DESCRIBE.LET.READFROM('root')),
          new WHILE({
            condition: (rw) => !!rw.readVariable<LLContainer<T>>('cursor').getSuccessor(),
            body: [
              new RUN((rw) =>
                rw.writeVariable('cursor', rw.readVariable<LLContainer<T>>('cursor').getSuccessor())
              ).setDescription('cursor = cursor.getSuccessor()'),
            ],
          }).setDescription(DESCRIBE.WHILE.MAKE('!!cursor.getSuccessor()')),
          new RUN((rw) =>
            rw.readVariable<LLContainer<T>>('cursor').setSuccessor(new LLContainer<T>(rw.readVariable('element')))
          ).setDescription('cursor.setSuccessor(new Container(element))'),
        ],
      }),

      // ADD AT ANY INDEX
      new Method({
        name: 'addIndex',
        argNames: ['element', 'index'],
        instructions: [
          // Decrease larger indices than necessary
          new IF({
            condition: (rw) => rw.readVariable<number>('index') > rw.readVariable<number>('size'),
            body: [
              new RUN((rw) => rw.writeVariable<number>('index', rw.readVariable<number>('size'))).setDescription(
                'index = size'
              ),
            ],
          }).setDescription(DESCRIBE.IF.MAKE('index > size')),

          // vars
          new LET({
            name: 'cursor',
            value: (rw) => rw.readVariable('root'),
          }).setDescription(DESCRIBE.LET.READFROM('root')),
          new LET({
            name: 'predecessor',
            value: () => null,
          }).setDescription(DESCRIBE.LET.READFROM('null')),

          // skip to point of interest
          new FORI({
            iStartVal: 0,
            condition: (rw, i) => i < rw.readVariable<number>('index'),
            stepSize: 1,
            body: [
              new RUN((rw) => rw.writeVariable('predecessor', rw.readVariable('cursor'))).setDescription(
                'predecessor = cursor'
              ),
              new RUN((rw) =>
                rw.writeVariable('cursor', rw.readVariable<LLContainer<T>>('cursor').getSuccessor())
              ).setDescription('cursor = cursor.getSuccessor()'),
            ],
          }).setDescription(DESCRIBE.FORI.MAKE('i < index')),

          // Create new container
          new LET({
            name: 'newContainer',
            value: (rw) => new LLContainer(rw.readVariable<T>('element')),
          }).setDescription(DESCRIBE.LET.READFROM('element')),
          new IF_ELSE({
            condition: (rw) => rw.readVariable<number>('index') === 0,
            ifBody: [
              new RUN((rw) =>
                rw.readVariable<LLContainer<T>>('newContainer').setSuccessor(rw.readVariable('root'))
              ).setDescription('newContainer.setSuccessor(root)'),
              new RUN((rw) => rw.writeVariable('root', rw.readVariable<LLContainer<T>>('newContainer'))).setDescription(
                'root = newContainer'
              ),
            ],
            elseBody: [
              new RUN((rw) =>
                rw
                  .readVariable<LLContainer<T>>('predecessor')
                  .setSuccessor(rw.readVariable<LLContainer<T>>('newContainer'))
              ),
              new RUN((rw) =>
                rw.readVariable<LLContainer<T>>('newContainer').setSuccessor(rw.readVariable<LLContainer<T>>('cursor'))
              ),
            ],
          }).setDescription(DESCRIBE.IF_ELSE.MAKE('index === 0')),
          new RUN((rw) => rw.postIncr('size')).setDescription('size++;'),
        ],
      }),

      // REMOVE
      new Method({
        name: 'remove',
        argNames: ['element'],
        instructions: [
          new LET({
            name: 'cursor',
            value: (rw) => rw.readVariable('root'),
          }).setDescription(DESCRIBE.LET.READFROM('root')),
          new LET({
            name: 'predecessor',
            value: () => null,
          }).setDescription(DESCRIBE.LET.READFROM('null')),
          new WHILE({
            condition: (rw) => !!rw.readVariable('cursor'),
            body: [
              new IF({
                condition: (rw) =>
                  rw.readVariable<LLContainer<T>>('cursor').getElement() === rw.readVariable<T>('element'),
                body: [
                  new IF_ELSE({
                    condition: (rw) => rw.readVariable<LLContainer<T>>('cursor') === rw.readVariable('root'),
                    // Special case for first element, need to change the root
                    ifBody: [
                      new RUN((rw) =>
                        rw.writeVariable('root', rw.readVariable<LLContainer<T>>('cursor')?.getSuccessor())
                      ).setDescription('root = cursor.getSuccessor();'),
                    ],

                    // regular case
                    elseBody: [
                      new RUN((rw) =>
                        rw
                          .readVariable<LLContainer<T>>('predecessor')
                          ?.setSuccessor(rw.readVariable<LLContainer<T>>('cursor')?.getSuccessor())
                      ).setDescription('predecessor?.setSuccessor(cursor.getSuccessor())'),
                    ],
                  }).setDescription(DESCRIBE.IF_ELSE.MAKE('cursor === root')),
                  new RUN((rw) => rw.postDecr('size')).setDescription('size--;'),
                ],
              }).setDescription(DESCRIBE.IF.MAKE('cursor.getElement() === element')),
              new RUN((rw) =>
                rw.writeVariable<LLContainer<T>>('predecessor', rw.readVariable<LLContainer<T>>('cursor'))
              ).setDescription('predecessor = cursor;'),
              new RUN((rw) =>
                rw.writeVariable<LLContainer<T>>('cursor', rw.readVariable<LLContainer<T>>('cursor').getSuccessor())
              ).setDescription('cursor = cursor.getSuccessor()'),
            ],
          }).setDescription(DESCRIBE.WHILE.MAKE('!!cursor')),
        ],
      }),

      // get element at given index
      new Method({
        name: 'get',
        argNames: ['index'],
        instructions: [
          // if index is out of bounds return null
          new IF({
            condition: (rw) => {
              const idx = rw.readVariable<number>('index');
              return idx >= rw.readVariable<number>('size') || idx < 0;
            },
            body: [
              new RETURN({
                returnVal: () => null,
              }),
            ],
          }),

          // actual search
          new LET({
            name: 'cursor',
            value: (rw) => rw.readVariable('root'),
          }),
          // skip to wanted index
          new FORI({
            iStartVal: 0,
            condition: (rw, i) => i < rw.readVariable<number>('index'),
            stepSize: 1,
            body: [
              new RUN((rw) => rw.writeVariable('cursor', rw.readVariable<LLContainer<T>>('cursor').getSuccessor())),
            ],
          }),
          new RETURN({
            returnVal: (rw) => rw.readVariable<LLContainer<T>>('cursor').getElement(),
          }),
        ],
      }),

      // whether the list contains an item
      new Method({
        name: 'contains',
        argNames: ['element'],
        instructions: [
          new LET({
            name: 'cursor',
            value: (rw) => rw.readVariable('root'),
          }),
          new WHILE({
            condition: (rw) => rw.readVariable('cursor'),
            body: [
              new IF({
                condition: (rw) =>
                  rw.readVariable<LLContainer<T>>('cursor').getElement() === rw.readVariable<T>('element'),
                body: [new RETURN({ returnVal: () => true })],
              }),
              new RUN((rw) => rw.writeVariable('cursor', rw.readVariable<LLContainer<T>>('cursor').getSuccessor())),
            ],
          }),
          new RETURN({ returnVal: () => false }),
        ],
      }),

      // clear the list of all entries
      new Method({
        name: 'clear',
        argNames: [],
        instructions: [new RUN((rw) => rw.writeVariable('root', null)), new RUN((rw) => rw.writeVariable('size', 0))],
      }),
    ],
  });
  return linkedListDemo;
}

export class LLContainer<T> extends Container<T> {
  private successor: LLContainer<T>;
  public constructor(element: T) {
    super(element);
  }

  public setSuccessor(succ: LLContainer<T>): void {
    this.successor = succ;
  }

  public getSuccessor(): LLContainer<T> {
    return this.successor;
  }
}

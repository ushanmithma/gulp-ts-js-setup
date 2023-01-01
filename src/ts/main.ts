import { sayHello } from './greet';
const { Typewriter } = require('./Typewriter');

console.log(sayHello('👋 TypeScript'));
(window as any).Typewriter = Typewriter;

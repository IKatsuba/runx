import { ReflectiveInjector } from 'injection-js';
import { Api } from '@runx/nx-runners/src/cloud/api';

const injector = ReflectiveInjector.resolveAndCreate([Api]);

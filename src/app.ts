import * as cors from 'cors';
import * as express from 'express';
import * as logger from 'morgan';

import { router } from './routes/index';

/**
 * Cria o app
 */
export const app = express()

/**
 * Configuração dos middlewares
 */
app.use(express.json({limit: '50mb'}));
app.use(cors())
app.use(logger('dev'))

/**
 * Integra o endpoint na aplicação
 */
app.use('/', router)
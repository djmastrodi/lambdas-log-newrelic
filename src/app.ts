import {LogService} from './service/logService'

export const handler = (event: any, context: any, callback: any) => {
    let logService = new LogService(event);

    logService.sendlog();

    callback();
}
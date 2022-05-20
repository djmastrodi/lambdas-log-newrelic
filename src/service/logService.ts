const zlib = require('zlib');
import axios, { AxiosInstance } from 'axios';

interface Log{
    id: string;
    timestamp: number;
    message: string;
    logtype: string;
    service: string;
    "faas.name": string;
    engine: string;
}

interface LogsEvet{
    requestID: string

    logs:Log[]
}


class LogService {
    private baseUrl=process.env.BASE_URL_NEWRELIC || 'https://log-api.newrelic.com'
    private licenseKey=process.env.BASE_LICENSE_KEY_NEWRELIC || ''
    
    
    constructor(private event: any) {}

    sendlog=()=>{
        let logsMessage = this.getMessage();

        this.sendMessage(logsMessage);
    }

    private sendMessage(log:LogsEvet) {
        let axiosClient:AxiosInstance;
        
        axiosClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000,
            headers: {
                'X-License-Key': this.licenseKey,
                'Content-Type': 'application/json'
            }
        });
        
        for (const logevent of log.logs) {
                axiosClient.post('/log/v1', {
                    id:logevent.id,
                    logtype:logevent.logtype,
                    timestamp: logevent.timestamp,
                    message: logevent.message,
                    service: logevent.service,
                    'faas.name':logevent['faas.name'],
                    engine:logevent.engine,
                    requestId: log.requestID,
                });
        }

        
    }

    private getMessage():LogsEvet {
        let logs = {} as LogsEvet;
        if (this.event.awslogs && this.event.awslogs.data) {
            
            const payload = Buffer.from(this.event.awslogs.data, 'base64');
          
            const lib=zlib.unzipSync(payload).toString()
            
            const logevents = JSON.parse(lib);
            
            for (const logevent of logevents.logEvents) {
              //const log = JSON.parse(logevent.message);
              let requestID='';
              let log= {} as Log;
              if(logevent.message.startsWith('{')){
                let awslog = JSON.parse(logevent.message);
                
                log.id = logevent.id
                log.logtype = awslog.level
                log.timestamp = awslog.timestamp;
                log.message = awslog.message
                log.service = awslog.service;
                log['faas.name'] = awslog.service;
                log.engine = 'logservices-integration';
              }else{
                if(logevent.message.contains('START RequestId:')){
                    requestID=this.getRequestId(logevent.message);
                }
                log.id = logevent.id
                log.logtype = 'info'
                log.timestamp = logevent.timestamp;
                log.message = logevent.message;
                log.service ='thirdparty';
                log['faas.name'] ='thirdparty';
                log['engine'] = 'logservices-integration-thirdparty';
              }
              logs.requestID=requestID;
              logs.logs.push(log);
            }
        }
        return logs;
    }

    private getRequestId(log:string):string{
        return log.replace('START RequestId:','').replace('Version: $LATEST','').trimEnd().trimStart();
    }
}

export {LogService}
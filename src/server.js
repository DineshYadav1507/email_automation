import 'dotenv/config'; import {app} from './app.js'; import {startWorker} from './queue.js'; import {db} from './db.js';
const port=Number(process.env.PORT||4000); startWorker(); const server=app.listen(port,()=>console.log(`Email automation listening on :${port}`));
function shutdown(signal){console.log(signal+': shutting down');server.close(()=>{db.close();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
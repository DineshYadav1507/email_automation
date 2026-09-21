import {db,logEvent} from './db.js';
import {createTransport,interpolate} from './email.js';
const maxPerMinute=Math.max(1,Number(process.env.MAX_PER_MINUTE||30));
const maxRetries=Math.max(1,Number(process.env.MAX_RETRIES||3));
let running=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function sendOne(row){
  const contact=db.prepare('SELECT * FROM contacts WHERE id=?').get(row.contact_id);
  const campaign=db.prepare('SELECT * FROM campaigns WHERE id=?').get(row.campaign_id);
  if(!contact||!campaign) throw new Error('Delivery data missing');
  if(contact.unsubscribed||!contact.consent){db.prepare("UPDATE deliveries SET status='skipped',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);logEvent(row.id,'skipped',{reason:contact.unsubscribed?'unsubscribed':'no_consent'});return;}
  const u=(process.env.UNSUBSCRIBE_BASE_URL||'')+'?contact='+encodeURIComponent(contact.id);
  const subject=interpolate(campaign.subject,contact);
  const html=interpolate(campaign.body_html,contact,{unsubscribe_url:u});
  const text=interpolate(campaign.body_text,contact,{unsubscribe_url:u});
  const attempts=row.attempts+1;
  db.prepare("UPDATE deliveries SET attempts=?,status='sending',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(attempts,row.id);
  const t=createTransport();
  let info={messageId:'dry-run-'+row.id+'-'+Date.now()};
  if(t) info=await t.sendMail({from:process.env.FROM_NAME?'"'+process.env.FROM_NAME+'" <'+process.env.FROM_EMAIL+'>':process.env.FROM_EMAIL,to:contact.email,subject,html,text,headers:{'List-Unsubscribe':u}});
  const fu=campaign.followup_days>0?new Date(Date.now()+campaign.followup_days*86400000).toISOString():null;
  db.prepare("UPDATE deliveries SET status='sent',provider_message_id=?,sent_at=CURRENT_TIMESTAMP,followup_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(info.messageId||null,fu,row.id);
  logEvent(row.id,'sent',{messageId:info.messageId,dryRun:!t});
}
export function startWorker(){
  if(running)return; running=true;
  (async()=>{const delay=Math.ceil(60000/maxPerMinute); while(running){
    const rows=db.prepare("SELECT * FROM deliveries WHERE status='queued' ORDER BY id LIMIT 1").all();
    if(!rows.length){await wait(1000);continue;}
    const row=rows[0]; try{await sendOne(row);}catch(e){const next=row.attempts+1>=maxRetries?'failed':'queued'; db.prepare('UPDATE deliveries SET status=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next,String(e.message||e),row.id);logEvent(row.id,'error',{error:String(e.stack||e)});} await wait(delay);
  }})().catch(e=>{running=false;console.error(e);});
}
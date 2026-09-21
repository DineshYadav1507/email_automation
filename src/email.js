import nodemailer from 'nodemailer';
export function createTransport(){
  if (String(process.env.DRY_RUN).toLowerCase()==='true') return null;
  const port=Number(process.env.SMTP_PORT||587);
  return nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:String(process.env.SMTP_SECURE).toLowerCase()==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},pool:true});
}
export function interpolate(template,contact,extras={}){
  return String(template).replaceAll('{{name}}',contact.name||'there').replaceAll('{{email}}',contact.email).replaceAll('{{company}}',contact.company).replaceAll('{{job_title}}',contact.job_title).replaceAll('{{unsubscribe_url}}',extras.unsubscribe_url||'');
}
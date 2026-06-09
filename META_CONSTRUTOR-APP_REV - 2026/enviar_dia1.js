const https = require('https');
const fs = require('fs');
const path = require('path');

const CSV_PATH = "C:\\Users\\nicol\\OneDrive\\Documentos\\META CONSTRUTOR\\PROSPECCAO\\contatos_master.csv";
const TEMPLATE_PATH = "C:\\Users\\nicol\\OneDrive\\Documentos\\META CONSTRUTOR\\META CONSTRUTOR - APP\\META_CONSTRUTOR-APP_REV - 2026\\campanha-26-dias\\dia-01-rdo-tecnico.html";
const CRONO_PATH = "C:\\Users\\nicol\\OneDrive\\Documentos\\META CONSTRUTOR\\META CONSTRUTOR - APP\\META_CONSTRUTOR-APP_REV - 2026\\campanha-26-dias\\cronograma.json";
const API_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now";

// Read cronograma
const cronograma = JSON.parse(fs.readFileSync(CRONO_PATH, 'utf8'));
const subject = cronograma[0].subject + " — Meta Construtor";

// Read template
const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Read CSV
const csvData = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');
const contacts = [];

for (let i = 1; i < lines.length && contacts.length < 50; i++) {
    const parts = lines[i].split(',');
    const email = (parts[2] || '').trim();
    const nome = (parts[0] || '').trim();
    if (email && email.includes('@')) {
        contacts.push({ to: email, nome_empresa: nome });
    }
}

console.log(`Subject: ${subject}`);
console.log(`Contacts: ${contacts.length}`);

// Send function
async function sendEmail(contact, index) {
    return new Promise((resolve, reject) => {
        const html = templateHtml.replace('{{nome_empresa}}', contact.nome_empresa);
        const payload = JSON.stringify({
            subject: subject,
            html: html,
            emails: [contact]
        });

        const url = new URL(API_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`  [${index+1}/${contacts.length}] OK - ${contact.nome_empresa} <${contact.to}>`);
                    resolve(true);
                } else {
                    console.log(`  [${index+1}/${contacts.length}] FAIL (${res.statusCode}) - ${contact.nome_empresa} <${contact.to}>: ${data.slice(0,200)}`);
                    resolve(false);
                }
            });
        });
        req.on('error', (e) => {
            console.log(`  [${index+1}/${contacts.length}] ERROR - ${contact.nome_empresa} <${contact.to}>: ${e.message.slice(0,200)}`);
            resolve(false);
        });
        req.write(payload);
        req.end();
    });
}

// Send all with delay
async function main() {
    let success = 0;
    let fail = 0;

    for (let i = 0; i < contacts.length; i++) {
        const ok = await sendEmail(contacts[i], i);
        if (ok) success++; else fail++;
        if (i < contacts.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('RESUMO DO ENVIO - DIA 1');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total: ${contacts.length}`);
    console.log(`Sucesso: ${success}`);
    console.log(`Falha: ${fail}`);
    console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);

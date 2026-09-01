import fs from 'fs';
let content = fs.readFileSync('temp_worker.js', 'utf8');

const targetStr = `          if (!response.ok) {
            const errText = await response.text();
            throw new Error(\`Gemini API error (HTTP \${response.status}): \${errText}\`);
          }`;

const replacementStr = `          if (!response.ok) {
            const errText = await response.text();
            let extraDelay = '';
            try {
              const p = JSON.parse(errText);
              const retryInfo = (p.error?.details || []).find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
              if (retryInfo && retryInfo.retryDelay) extraDelay = ' Attendi ' + retryInfo.retryDelay.replace('s', ' secondi') + ' prima di riprovare.';
            } catch(e) {}
            if (response.status === 429) {
              throw new Error(\`Limite quota API superato per l'AI gratuita.\${extraDelay}\`);
            }
            throw new Error(\`Gemini API error (HTTP \${response.status}): \${errText}\`);
          }`;

content = content.replaceAll(targetStr, replacementStr);
fs.writeFileSync('temp_worker.js', content);
console.log('Updated all occurrences in temp_worker.js');

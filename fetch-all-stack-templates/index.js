const fs = require('fs');
const sdk = require('aws-sdk');
const cf = new sdk.CloudFormation({ region: 'eu-west-1' });

const cacheDir = '.cache/templates';

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

async function fetchTemplate(opts) {
  return new Promise((resolve, reject) => {
    cf.getTemplate({
      StackName: opts.stackName,
      TemplateStage: opts.isProcessed ? 'Processed' : 'Original',
      
    },(err, res) => err ? reject(err) : resolve(res));
  });
}

async function fetchCompleteStacks() {
  return new Promise((resolve, reject) => {
    cf.listStacks({
      StackStatusFilter: ['CREATE_COMPLETE', 'ROLLBACK_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
    },(err, res) => err ? reject(err) : resolve(res));
  });
}

async function fetchStackNames() {
  const stacks = await fetchCompleteStacks();
  if(!stacks || !stacks.StackSummaries) return [];
  return stacks.StackSummaries.map(s => s.StackName);
}

async function createFile(path, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, err => err ? reject(err) : resolve());
  });
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function main() {
  const stackNames = await fetchStackNames();
  stackNames.forEach(async stackName => {
    console.log(`fetching stack ${stackName}`);
    const template = await fetchTemplate({ stackName, isProcessed: false });
    await createFile(`${cacheDir}/${stackName}.yaml`, template.TemplateBody);
  });
}

main();
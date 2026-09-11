import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const run=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/nusatrip/model.ts','lib/nusatrip/catalog.ts','lib/nusatrip/engine.ts','lib/nusatrip/expenses.ts','lib/nusatrip/exports.ts','lib/nusatrip/providers.ts','lib/nusatrip/repository.ts','--outDir','.test-build','--module','commonjs','--moduleResolution','node','--target','ES2022','--esModuleInterop','--skipLibCheck','--resolveJsonModule','--strict'],{stdio:'inherit'});
if(run.status)process.exit(run.status);mkdirSync('.test-build',{recursive:true});writeFileSync('.test-build/package.json',JSON.stringify({type:'commonjs'}));
const result=spawnSync(process.execPath,['--test','tests/domain.test.cjs'],{stdio:'inherit'});process.exit(result.status??1);

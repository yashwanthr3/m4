// Load lesson files and print them as JSON: node eval/dump.js lessons/ch01.js [...]
const fs=require('fs'), vm=require('vm');
const out={};
for(const f of process.argv.slice(2)){
  const COURSE={lessons:[],lesson(o){this.lessons.push(o)}};
  try{
    vm.runInNewContext(fs.readFileSync(f,'utf8'),{COURSE},{filename:f});
    if(COURSE.lessons.length!==1) out[f]={__error:'expected exactly one COURSE.lesson() call, got '+COURSE.lessons.length};
    else out[f]=COURSE.lessons[0];
  }catch(e){ out[f]={__error:String(e&&e.stack||e).split('\n').slice(0,3).join(' | ')}; }
}
process.stdout.write(JSON.stringify(out));

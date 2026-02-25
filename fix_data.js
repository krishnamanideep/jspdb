const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            if (!dirFile.includes('node_modules') && !dirFile.includes('.next') && !dirFile.includes('.git')) {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
                filelist.push(dirFile);
            }
        }
    });
    return filelist;
};

const dirsToSearch = ['components', 'utils', 'types', 'app', 'hooks', 'lib', 'data'];
let files = [];
dirsToSearch.forEach(d => {
    const fullPath = path.join('d:\\\\JSPDB\\\\janasena-dashboard', d);
    if (fs.existsSync(fullPath)) {
        files = files.concat(walkSync(fullPath));
    }
});

files.forEach(file => {
    if (file.includes('polling_stations_fallback.json')) return;
    if (file.includes('assemblies.ts')) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix the AIADMK -> AIAYSRCP bug
    content = content.replace(/AIAYSRCP/g, 'TDP');
    content = content.replace(/'AIAYSRCP'/g, "'TDP'");

    // Actually let's make sure the party colors object doesn't have duplicate keys
    // By accident, JSP is twice because of 'NRC' and 'NR Congress'. That's fine.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
});

console.log('Fix script done');

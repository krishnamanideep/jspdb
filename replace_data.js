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
    if (file.includes('assemblies.ts')) return; // handled previously

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replacements
    content = content.replace(/2021/g, '2024');
    content = content.replace(/2016/g, '2019');
    content = content.replace(/2011/g, '2014');

    content = content.replace(/DMK/g, 'YSRCP');
    content = content.replace(/AIADMK/g, 'TDP');
    content = content.replace(/'NRC'/g, "'JSP'");
    content = content.replace(/'NR Congress'/g, "'JSP'");
    content = content.replace(/NR Congress/g, 'JSP');
    content = content.replace(/NRC/g, 'JSP');
    content = content.replace(/PMK/g, 'BJP');
    content = content.replace(/VCK/g, 'BSP');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
    }
});

console.log('Done');

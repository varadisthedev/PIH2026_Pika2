const fs = require('fs');
const path = require('path');

const mappings = [
    { oldPath: /(?<!-)000501/gi, newHex: '162521' },
    { oldPath: /0,\s*5,\s*1/g, newHex: '22, 37, 33' },

    { oldPath: /(?<!-)73ab84/gi, newHex: '3c474b' },
    { oldPath: /115,\s*171,\s*132/g, newHex: '60, 71, 75' },

    { oldPath: /(?<!-)99d19c/gi, newHex: '4f7cac' },
    { oldPath: /153,\s*209,\s*156/g, newHex: '79, 124, 172' },

    { oldPath: /(?<!-)79c7c5/gi, newHex: '9eefe5' },
    { oldPath: /121,\s*199,\s*197/g, newHex: '158, 239, 229' },

    { oldPath: /(?<!-)ade1e5/gi, newHex: 'c0e0de' },
    { oldPath: /173,\s*225,\s*229/g, newHex: '192, 224, 222' },

    { oldPath: /(?<!-)f7fcf9/gi, newHex: 'f0f7f7' }
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = content;
            for (const map of mappings) {
                modified = modified.replace(map.oldPath, map.newHex);
            }
            if (content !== modified) {
                fs.writeFileSync(fullPath, modified, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir('src');
console.log('Done!');

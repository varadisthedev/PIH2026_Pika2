import fs from 'fs';
import path from 'path';
import fetch, { FormData, fileFromSync } from 'node-fetch';

const testUpload = async () => {
    // create 2 dummy files
    fs.writeFileSync('test1.jpg', 'dummy1');
    fs.writeFileSync('test2.jpg', 'dummy2');

    const form = new FormData();
    form.append('images', fileFromSync('test1.jpg'));
    form.append('images', fileFromSync('test2.jpg'));

    // Wait, the upload route requires Clerk Authentication... 
    // we can't test it directly without a token!

    console.log("Needs token. Cleaning up.");
    fs.unlinkSync('test1.jpg');
    fs.unlinkSync('test2.jpg');
};
testUpload();

const request = require('superagent');
const cheerio = require('cheerio')
const fs = require('fs');
const TurndownService = require('turndown');
const turndown = new TurndownService();
const dec = require('./decode.js')

const PATH = process.argv[2];
const PASS = process.argv[3] || 'Severus';

if(PATH == null){
    console.log('invaild path to blog')
    process.exit(0)
}

turndown.keep('pre')
turndown.escape = (s) => s

turndown.addRule('codeblock',{
    filter: 'pre',
    replacement: function (content) {
        return '\n```\n' + content.replace() + '```\n'
    }
});

let images = []

turndown.addRule('remergeImg',{
    filter: 'img',
    replacement: function (content,node) {
        var alt = node.alt || ''
        var src = node.getAttribute('src') || ''
        var sp = src.split('/')
        var title = node.title || ''
        var titlePart = title ? ' "' + title + '"' : ''
        images.push(src)
        return src ? '![' + alt + ']' + '(' + sp[sp.length - 1] + titlePart + ')' : ''
    }
});

function getUnprotected(path){
    return request.get(path)
}

function getProtected(path, pass = PASS){
    return request.post(path)
        .set('Cookie',require('./cookie.json').cookie)
        .set('Accept','text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
        //.set('User-Agent',"Mozilla/5.0 (X11; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0")
        .set('Content-Type','application/x-www-form-urlencoded')
        .send({'tb_password': pass})
}

(PATH.includes('protected') ? getProtected : getUnprotected)(PATH).then((resp) => {
    let $ = cheerio.load(resp.text);
    let r = $("#cnblogs_post_body").html();
    let out = dec.htmlDecode(turndown.turndown(r))

    let dirName = $('#cb_post_title_url').text().trim();

    fs.mkdirSync(dirName);

    for(let i of images){
        var sp = i.split('/')
        const stream = fs.createWriteStream(`./${dirName}/${sp[sp.length-1]}`);
        const req = request.get(i);
        req.pipe(stream);
    }

    fs.writeFile(`./${dirName}/article.md`,out, {flag: 'w'}, err => {if(err) console.log(err)})
})

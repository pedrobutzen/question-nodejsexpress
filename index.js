var fs = require('fs'); 
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var rows = [];
// lê arquivo csv
fs.createReadStream('input1.csv')
    .on('data', (chunk) => {
        // transforma linha em string
        rows = chunk.toString().split('\n');
    })
    .on('end', () => {
        let headers = rows.shift().split(',');
        let values = rows.map((row) => {
            // trata valores entre aspas ("")
            var nrow = row.split('"');
            nrow.forEach((row, index) => {
                if(!(row.startsWith(',') || row.endsWith(',')) && nrow.length > 1)
                    nrow[index] = row.replace(',', ' / ');
            });
            nrow = nrow.join('');

            // quebra células em array
            var row = nrow.split(',');
            let obj = {};
            headers.forEach((header, index) => {
                // remove aspas e espaços no começo e no fim da string
                var cellValue = row[index].replace(/[/"]/g, '').trim();
                header = header.replace(/[/"]/g, '');
                if(header == 'group') {
                    if(!Array.isArray(obj['groups']))
                        obj['groups'] = [];

                    // quebra valores multiplos em uma única célula
                    if(cellValue.search(' / ') >= 0) {
                        const groups = cellValue.split(' / ');
                        obj['groups'].push(...groups);
                    } else if(cellValue != '') {
                        obj['groups'].push(cellValue);
                    }
                } else if(header.search('email') >= 0 || header.search('phone') >= 0) {
                    if(!Array.isArray(obj['addresses']))
                        obj['addresses'] = [];

                    if(cellValue == '') 
                        return;

                    var [type, ...tag] = header.split(' ');

                    if(type == 'phone') {
                        // deixa somente números e concatena com 55
                        cellValue = '55' + cellValue.replace(/\D/g, '');
                        // verifica se telefone é válido
                        if(!phoneUtil.isValidNumberForRegion(phoneUtil.parse(cellValue, 'BR'), 'BR'))
                            return;
                    } else {
                        // quebra valores multiplos em uma única célula
                        if(cellValue.search('/') >= 0) {
                            cellValue = cellValue.split('/');
                        } else if(cellValue.search(',') >= 0) {
                            cellValue = cellValue.split(',');
                        } else {
                            // remove qualquer caractere inválido para e-mails
                            cellValue = cellValue.replace(/[^a-zA-Z0-9_/@.]/g, '');
                        }
                    }

                    if(Array.isArray(cellValue)) {
                        cellValue.forEach(value => {
                            obj['addresses'].push({
                                'type': type,
                                'tags': [...tag],
                                'address': value
                            });
                        });
                    } else {
                        obj['addresses'].push({
                            'type': type,
                            'tags': [...tag],
                            'address': cellValue
                        });
                    }
                } else if(typeof cellValue == undefined || ['no', 0, '0', ''].includes(cellValue)) {
                    obj[header] = false;
                } else if(['yes', 1, '1'].includes(cellValue)) {
                    obj[header] = true;
                } else {
                    obj[header] = cellValue;
                }
            });
            // retorna objeto referente a linha
            return obj;
        })

        // salva retorno em arquivo json
        fs.writeFile('output1.json', JSON.stringify(values), function(err) {
            if (err) {
                console.log(err);
            }
        });
    });

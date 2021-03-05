/**
 * This script is meant to be used on https://world.hyatt.com/
 * Run script after searching.
 */


function getNumber(string) {
    if (!string) return null;
    let output = '';
    for (let i = 0; i < string.length; i++) {
        if (!Number.isNaN(Number(string[i]))) {
            output += string[i];
        }
    };
    return Number(output);
};

function getHyattPointValue() {
    const list = document.querySelector('[data-js="inner-card-row"]').children;

    const table = {};
    [...list].forEach(node => {
        const name = node.querySelector('.hotel-name')?.innerText;
        let points = node.querySelector('[data-js="rate-points"]')?.innerText;
        points = getNumber(points);
        let dollars = node.querySelector('[data-js="rate-currency"]')?.innerText;
        dollars = getNumber(dollars);
        if (points == null || dollars == null) return;
        table[name] = (dollars / points).toPrecision(3);
    });

    const sorted = Object.keys(table).sort((a, b) => table[b] - table[a]);
    const output = sorted.map(name => [name, `$${table[name]}`]);
    console.log(output);
    return output;
};

getHyattPointValue();